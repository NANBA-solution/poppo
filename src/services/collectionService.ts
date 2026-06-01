import { isSupabaseConfigured } from '@/lib/supabaseConfig';
import {
  clearAllCollectionLocal,
  deletePigeonScanLocal,
  readAllLocal,
  savePigeonScanLocal,
} from '@/services/collectionService.local';
import {
  clearAllCollectionRemote,
  deletePigeonScanRemote,
  savePigeonScanRemote,
  syncCollectionWithCloud,
} from '@/services/collectionService.remote';
import type { PigeonEntry } from '@/types/collection';
import type { PigeonScanJson } from '@/services/aiService';

export type CollectionStats = {
  total: number;
  uniqueBreeds: number;
  latestNickname: string | null;
};

export function computeCollectionStats(entries: PigeonEntry[]): CollectionStats {
  const breeds = new Set(entries.map((entry) => entry.breed));
  return {
    total: entries.length,
    uniqueBreeds: breeds.size,
    latestNickname: entries[0]?.nickname ?? null,
  };
}

export function isCollectionCloudEnabled(): boolean {
  return isSupabaseConfigured();
}

export async function savePigeonScan(
  sourceUri: string,
  result: PigeonScanJson,
): Promise<PigeonEntry> {
  const entry = await savePigeonScanLocal(sourceUri, result);
  if (isCollectionCloudEnabled()) {
    try {
      await savePigeonScanRemote(entry);
    } catch (e) {
      console.warn('[collection] cloud save failed:', e);
    }
  }
  return entry;
}

export async function getPigeonCollection(): Promise<PigeonEntry[]> {
  if (isCollectionCloudEnabled()) {
    try {
      return await syncCollectionWithCloud();
    } catch (e) {
      console.warn('[collection] cloud sync failed, using local:', e);
    }
  }
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
  const ok = await deletePigeonScanLocal(id);
  if (ok && isCollectionCloudEnabled()) {
    try {
      await deletePigeonScanRemote(id);
    } catch (e) {
      console.warn('[collection] cloud delete failed:', e);
    }
  }
  return ok;
}

export async function clearAllCollection(): Promise<number> {
  const count = await clearAllCollectionLocal();
  if (isCollectionCloudEnabled()) {
    try {
      await clearAllCollectionRemote();
    } catch (e) {
      console.warn('[collection] cloud clear failed:', e);
    }
  }
  return count;
}
