import {
  clearAllCollectionLocal,
  deletePigeonScanLocal,
  readAllLocal,
  savePigeonScanLocal,
} from '@/services/collectionService.local';
import type { PigeonEntry } from '@/types/collection';
import type { PigeonScanJson } from '@/types/scan';

export type CollectionStats = {
  total: number;
  uniqueBreeds: number;
};

export function computeCollectionStats(entries: PigeonEntry[]): CollectionStats {
  const breeds = new Set(entries.map((entry) => entry.breed));
  return {
    total: entries.length,
    uniqueBreeds: breeds.size,
  };
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
