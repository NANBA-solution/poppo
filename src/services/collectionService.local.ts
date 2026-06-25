import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  copyAsync,
  deleteAsync,
  documentDirectory,
  getInfoAsync,
  makeDirectoryAsync,
} from 'expo-file-system/legacy';

/** アプリ専用ストレージ（カメラロール・クラウドには保存しない） */

import { ensureEntryRarity, rollRarityForNewScan } from '@/services/rarityService';
import type { CardImageFraming, PigeonEntry } from '@/types/collection';
import type { PigeonScanJson } from '@/types/scan';
import { normalizeCardImageFraming } from '@/utils/cardImageFraming';

const STORAGE_KEY = '@poppo/collection/v1';
const SCAN_FOLDER = 'poppo-scans';

/** 永続保存先（documentDirectory は起動時に解決） */
export function getScanDir(): string {
  const root = documentDirectory;
  if (!root) {
    throw new Error('documentDirectory is unavailable');
  }
  return `${root}${SCAN_FOLDER}/`;
}

/** @deprecated 互換用。新規コードは getScanDir() を使うこと */
export const SCAN_DIR: string = (() => {
  try {
    return getScanDir();
  } catch {
    return '';
  }
})();

function scanFilename(entryId: string): string {
  return `${entryId}.jpg`;
}

/** AsyncStorage 用の相対パス（コンテナ UUID に依存しない） */
function toStoredImagePath(entryId: string): string {
  return `${SCAN_FOLDER}/${scanFilename(entryId)}`;
}

function extractFilename(stored: string): string | null {
  const trimmed = stored.trim();
  if (!trimmed) return null;
  const withoutScheme = trimmed.replace(/^file:\/\//, '');
  const parts = withoutScheme.split('/').filter(Boolean);
  const last = parts[parts.length - 1];
  if (!last || !last.includes('.')) return null;
  return last;
}

function isStoredRelativePath(stored: string): boolean {
  return stored.startsWith(`${SCAN_FOLDER}/`);
}

function isLegacyAbsolutePath(stored: string): boolean {
  return (
    stored.startsWith('/') ||
    stored.startsWith('file://') ||
    stored.includes('/Documents/')
  );
}

/** 保存値 → 実行時の絶対パス */
export function resolveImageUri(stored: string, entryId?: string): string {
  if (!stored) return stored;

  if (isStoredRelativePath(stored)) {
    const filename = stored.slice(SCAN_FOLDER.length + 1);
    return `${getScanDir()}${filename}`;
  }

  const filename = extractFilename(stored) ?? (entryId ? scanFilename(entryId) : null);
  if (filename) {
    return `${getScanDir()}${filename}`;
  }

  return stored.replace(/^file:\/\//, '');
}

function entryFromStorage(entry: PigeonEntry): PigeonEntry {
  return {
    ...entry,
    imageUri: resolveImageUri(entry.imageUri, entry.id),
  };
}

function entryForStorage(entry: PigeonEntry): PigeonEntry {
  return {
    ...entry,
    imageUri: toStoredImagePath(entry.id),
  };
}

function needsStorageMigration(entry: PigeonEntry): boolean {
  return isLegacyAbsolutePath(entry.imageUri) || !isStoredRelativePath(entry.imageUri);
}

async function ensureScanDir(): Promise<void> {
  await makeDirectoryAsync(getScanDir(), { intermediates: true });
}

async function removeTempSource(sourceUri: string): Promise<void> {
  const scanDir = getScanDir();
  if (!sourceUri.startsWith('file:') || sourceUri.includes(scanDir)) return;
  try {
    await deleteAsync(sourceUri, { idempotent: true });
  } catch {
    // 一時ファイル削除失敗は保存成功を妨げない
  }
}

async function persistImage(sourceUri: string, id: string): Promise<string> {
  await ensureScanDir();
  const dest = `${getScanDir()}${scanFilename(id)}`;
  await copyAsync({ from: sourceUri, to: dest });
  const info = await getInfoAsync(dest);
  if (!info.exists) {
    throw new Error(`Failed to persist scan image at ${dest}`);
  }
  await removeTempSource(sourceUri);
  return toStoredImagePath(id);
}

function normalizeCollection(entries: PigeonEntry[]): PigeonEntry[] {
  const sorted = [...entries].sort(
    (a, b) => new Date(b.scannedAt).getTime() - new Date(a.scannedAt).getTime(),
  );
  return sorted.map((entry, index) => {
    if (entry.rarity != null && entry.flavorIndex != null) {
      return entry;
    }
    return ensureEntryRarity(entry, sorted.length - index);
  });
}

export async function readAllLocal(): Promise<PigeonEntry[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    const stored = parsed.filter(isPigeonEntry);
    const needsRewrite = stored.some(needsStorageMigration);
    if (needsRewrite) {
      await writeAllLocal(stored.map(entryFromStorage));
    }

    return normalizeCollection(stored.map(entryFromStorage));
  } catch {
    return [];
  }
}

export async function writeAllLocal(entries: PigeonEntry[]): Promise<void> {
  const payload = entries.map(entryForStorage);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

function isPigeonEntry(value: unknown): value is PigeonEntry {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.id === 'string' &&
    typeof v.imageUri === 'string' &&
    typeof v.breed === 'string' &&
    typeof v.scannedAt === 'string'
  );
}

export async function savePigeonScanLocal(
  sourceUri: string,
  result: PigeonScanJson,
): Promise<PigeonEntry> {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const storedImagePath = await persistImage(sourceUri, id);
  const scannedAt = new Date();
  const existing = await readAllLocal();
  const scanNo = existing.length + 1;
  const { rarity, flavorIndex } = rollRarityForNewScan({
    entryId: id,
    scanNo,
    scannedAt,
    existingEntries: existing,
  });
  const entry: PigeonEntry = {
    id,
    imageUri: resolveImageUri(storedImagePath, id),
    breed: result.breed,
    scannedAt: scannedAt.toISOString(),
    rarity,
    flavorIndex,
  };

  await writeAllLocal([entry, ...existing]);
  return entry;
}

export async function deletePigeonScanLocal(id: string): Promise<boolean> {
  const all = await readAllLocal();
  const target = all.find((entry) => entry.id === id);
  if (!target) return false;

  const next = all.filter((entry) => entry.id !== id);
  await writeAllLocal(next);

  try {
    await deleteAsync(resolveImageUri(toStoredImagePath(id), id), { idempotent: true });
  } catch {
    // メタデータ削除は成功しているので画像削除失敗は無視
  }

  return true;
}

export async function updatePigeonImageFramingLocal(
  id: string,
  framing: CardImageFraming,
): Promise<PigeonEntry | null> {
  const all = await readAllLocal();
  const index = all.findIndex((entry) => entry.id === id);
  if (index < 0) return null;

  const nextFraming = normalizeCardImageFraming(framing);
  const updated: PigeonEntry = {
    ...all[index]!,
    imageFraming: nextFraming,
  };
  const next = [...all];
  next[index] = updated;
  await writeAllLocal(next);
  return updated;
}

export async function clearAllCollectionLocal(): Promise<number> {
  const all = await readAllLocal();
  await Promise.all(
    all.map((entry) =>
      deleteAsync(resolveImageUri(toStoredImagePath(entry.id), entry.id), {
        idempotent: true,
      }).catch(() => undefined),
    ),
  );
  await AsyncStorage.removeItem(STORAGE_KEY);
  return all.length;
}
