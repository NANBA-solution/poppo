import {
  clearAllCollectionLocal,
  deletePigeonScanLocal,
  readAllLocal,
  savePigeonScanLocal,
  updatePigeonImageFramingLocal,
} from '@/services/collectionService.local';
import { resetCollectionGoal } from '@/services/collectionGoalService';
import type { CardImageFraming, PigeonEntry } from '@/types/collection';
import type { PigeonScanJson } from '@/types/scan';

let collectionCache: PigeonEntry[] | null = null;
let collectionLoadPromise: Promise<PigeonEntry[]> | null = null;

export function invalidateCollectionCache(): void {
  collectionCache = null;
  collectionLoadPromise = null;
}

async function loadCollection(): Promise<PigeonEntry[]> {
  if (collectionCache) return collectionCache;
  if (collectionLoadPromise) return collectionLoadPromise;

  collectionLoadPromise = readAllLocal()
    .then((entries) => {
      collectionCache = entries;
      collectionLoadPromise = null;
      return entries;
    })
    .catch((error) => {
      collectionLoadPromise = null;
      throw error;
    });

  return collectionLoadPromise;
}

/** 新しい順ソート済みコレクションでのスキャン通し番号（第 N 羽） */
export function getScanNumber(entries: PigeonEntry[], entryId: string): number | null {
  const index = entries.findIndex((entry) => entry.id === entryId);
  if (index < 0) return null;
  return entries.length - index;
}

export async function savePigeonScan(
  sourceUri: string,
  result: PigeonScanJson,
): Promise<PigeonEntry> {
  const entry = await savePigeonScanLocal(sourceUri, result);
  invalidateCollectionCache();
  return entry;
}

export async function getPigeonCollection(): Promise<PigeonEntry[]> {
  return loadCollection();
}

export async function getPigeonCount(): Promise<number> {
  const all = await getPigeonCollection();
  return all.length;
}

export async function getPigeonById(id: string): Promise<PigeonEntry | null> {
  const all = await getPigeonCollection();
  return all.find((entry) => entry.id === id) ?? null;
}

export async function deletePigeonScan(id: string): Promise<boolean> {
  const deleted = await deletePigeonScanLocal(id);
  if (deleted) invalidateCollectionCache();
  return deleted;
}

export async function updatePigeonImageFraming(
  id: string,
  framing: CardImageFraming,
): Promise<PigeonEntry | null> {
  const updated = await updatePigeonImageFramingLocal(id, framing);
  if (updated) invalidateCollectionCache();
  return updated;
}

export async function clearAllCollection(): Promise<number> {
  const count = await clearAllCollectionLocal();
  invalidateCollectionCache();
  await resetCollectionGoal();
  return count;
}
