import {
  clearAllCollectionLocal,
  deletePigeonScanLocal,
  readAllLocal,
  savePigeonScanLocal,
} from '@/services/collectionService.local';
import type { PigeonEntry } from '@/types/collection';
import type { PigeonScanJson } from '@/types/scan';

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
  return savePigeonScanLocal(sourceUri, result);
}

export async function getPigeonCollection(): Promise<PigeonEntry[]> {
  const local = await readAllLocal();
  return [...local].sort(
    (a, b) => new Date(b.scannedAt).getTime() - new Date(a.scannedAt).getTime(),
  );
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
  return deletePigeonScanLocal(id);
}

export async function clearAllCollection(): Promise<number> {
  return clearAllCollectionLocal();
}
