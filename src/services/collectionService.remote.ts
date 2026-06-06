import { uploadLocalImage } from '@/lib/storageUpload';
import { getSupabase } from '@/lib/supabase';
import {
  readAllLocal,
  writeAllLocal,
} from '@/services/collectionService.local';
import { ensureSupabaseSession, getCurrentUserId } from '@/services/authService';
import type { PigeonEntry } from '@/types/collection';

const SCAN_BUCKET = 'scan-images';

type ScanRow = {
  client_id: string;
  breed: string;
  image_url: string | null;
  scanned_at: string;
};

function rowToEntry(row: ScanRow): PigeonEntry {
  return {
    id: row.client_id,
    imageUri: row.image_url ?? '',
    breed: row.breed,
    scannedAt: row.scanned_at,
  };
}

function sortEntries(entries: PigeonEntry[]): PigeonEntry[] {
  return [...entries].sort(
    (a, b) => new Date(b.scannedAt).getTime() - new Date(a.scannedAt).getTime(),
  );
}

function mergeEntries(local: PigeonEntry[], remote: PigeonEntry[]): PigeonEntry[] {
  const map = new Map<string, PigeonEntry>();
  for (const entry of local) map.set(entry.id, entry);
  for (const entry of remote) {
    const existing = map.get(entry.id);
    if (!existing) {
      map.set(entry.id, entry);
      continue;
    }
    const preferRemote =
      entry.imageUri.startsWith('http') && !existing.imageUri.startsWith('http');
    map.set(entry.id, preferRemote ? entry : existing);
  }
  return sortEntries([...map.values()]);
}

async function uploadScanImage(
  localUri: string,
  userId: string,
  clientId: string,
): Promise<string | null> {
  if (localUri.startsWith('http')) return localUri;
  if (!localUri.startsWith('file:') && !localUri.startsWith('content:')) return null;
  const path = `${userId}/scans/${clientId}.jpg`;
  return uploadLocalImage(SCAN_BUCKET, localUri, path);
}

async function fetchRemoteScans(userId: string): Promise<PigeonEntry[]> {
  const supabase = getSupabase();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('pigeon_scans')
    .select('client_id, breed, image_url, scanned_at')
    .eq('user_id', userId)
    .order('scanned_at', { ascending: false });

  if (error) {
    console.warn('[collection] fetch failed:', error.message);
    throw new Error(error.message);
  }

  return (data as ScanRow[]).map(rowToEntry);
}

async function pushEntryToCloud(entry: PigeonEntry, userId: string): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;

  const imageUrl = await uploadScanImage(entry.imageUri, userId, entry.id);

  const { error } = await supabase.from('pigeon_scans').upsert(
    {
      user_id: userId,
      client_id: entry.id,
      breed: entry.breed,
      image_url: imageUrl,
      scanned_at: entry.scannedAt,
    },
    { onConflict: 'user_id,client_id' },
  );

  if (error) {
    console.warn('[collection] push failed:', error.message);
    throw new Error(error.message);
  }
}

export async function syncCollectionWithCloud(): Promise<PigeonEntry[]> {
  const supabase = getSupabase();
  if (!supabase) return readAllLocal();

  await ensureSupabaseSession();
  const userId = await getCurrentUserId();
  if (!userId) return readAllLocal();

  const local = await readAllLocal();
  let remote = await fetchRemoteScans(userId);
  const remoteIds = new Set(remote.map((e) => e.id));

  for (const entry of local) {
    if (!remoteIds.has(entry.id)) {
      await pushEntryToCloud(entry, userId);
    }
  }

  remote = await fetchRemoteScans(userId);
  const merged = mergeEntries(local, remote);
  await writeAllLocal(merged);
  return merged;
}

export async function savePigeonScanRemote(entry: PigeonEntry): Promise<void> {
  await ensureSupabaseSession();
  const userId = await getCurrentUserId();
  if (!userId) return;
  await pushEntryToCloud(entry, userId);
}

export async function deletePigeonScanRemote(clientId: string): Promise<void> {
  await ensureSupabaseSession();
  const supabase = getSupabase();
  const userId = await getCurrentUserId();
  if (!supabase || !userId) return;

  await supabase
    .from('pigeon_scans')
    .delete()
    .eq('user_id', userId)
    .eq('client_id', clientId);
}

export async function clearAllCollectionRemote(): Promise<void> {
  await ensureSupabaseSession();
  const supabase = getSupabase();
  const userId = await getCurrentUserId();
  if (!supabase || !userId) return;

  await supabase.from('pigeon_scans').delete().eq('user_id', userId);
}
