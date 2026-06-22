import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  copyAsync,
  deleteAsync,
  documentDirectory,
  makeDirectoryAsync,
} from 'expo-file-system/legacy';

/** アプリ専用ストレージ（カメラロール・クラウドには保存しない） */

import { ensureEntryRarity, rollRarityForNewScan } from '@/services/rarityService';
import type { CardImageFraming, PigeonEntry } from '@/types/collection';
import type { PigeonScanJson } from '@/types/scan';
import { normalizeCardImageFraming } from '@/utils/cardImageFraming';

const STORAGE_KEY = '@poppo/collection/v1';
export const SCAN_DIR = `${documentDirectory ?? ''}poppo-scans/`;

async function ensureScanDir(): Promise<void> {
  await makeDirectoryAsync(SCAN_DIR, { intermediates: true });
}

async function removeTempSource(sourceUri: string): Promise<void> {
  if (!sourceUri.startsWith('file:') || sourceUri.startsWith(SCAN_DIR)) return;
  try {
    await deleteAsync(sourceUri, { idempotent: true });
  } catch {
    // 一時ファイル削除失敗は保存成功を妨げない
  }
}

async function persistImage(sourceUri: string, id: string): Promise<string> {
  await ensureScanDir();
  const dest = `${SCAN_DIR}${id}.jpg`;
  await copyAsync({ from: sourceUri, to: dest });
  await removeTempSource(sourceUri);
  return dest;
}

function normalizeCollection(entries: PigeonEntry[]): PigeonEntry[] {
  const sorted = [...entries].sort(
    (a, b) => new Date(b.scannedAt).getTime() - new Date(a.scannedAt).getTime(),
  );
  return sorted.map((entry, index) =>
    ensureEntryRarity(entry, sorted.length - index),
  );
}

export async function readAllLocal(): Promise<PigeonEntry[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return normalizeCollection(parsed.filter(isPigeonEntry));
  } catch {
    return [];
  }
}

export async function writeAllLocal(entries: PigeonEntry[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
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
  const imageUri = await persistImage(sourceUri, id);
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
    imageUri,
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

  if (target.imageUri.startsWith(SCAN_DIR)) {
    try {
      await deleteAsync(target.imageUri, { idempotent: true });
    } catch {
      // メタデータ削除は成功しているので画像削除失敗は無視
    }
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
    all
      .filter((entry) => entry.imageUri.startsWith(SCAN_DIR))
      .map((entry) =>
        deleteAsync(entry.imageUri, { idempotent: true }).catch(() => undefined),
      ),
  );
  await AsyncStorage.removeItem(STORAGE_KEY);
  return all.length;
}
