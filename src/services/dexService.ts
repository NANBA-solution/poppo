import type { PigeonEntry } from '@/types/collection';

export type DexEntry = {
  breed: string;
  count: number;
  latestNickname: string;
  firstScannedAt: string;
  sampleImageUri: string;
};

/** 品種ごとにまとめたぽっぽ図鑑 */
export function buildDex(entries: PigeonEntry[]): DexEntry[] {
  const map = new Map<string, DexEntry>();

  for (const entry of entries) {
    const existing = map.get(entry.breed);
    if (!existing) {
      map.set(entry.breed, {
        breed: entry.breed,
        count: 1,
        latestNickname: entry.nickname,
        firstScannedAt: entry.scannedAt,
        sampleImageUri: entry.imageUri,
      });
      continue;
    }
    existing.count += 1;
    existing.latestNickname = entry.nickname;
    if (new Date(entry.scannedAt) < new Date(existing.firstScannedAt)) {
      existing.firstScannedAt = entry.scannedAt;
      existing.sampleImageUri = entry.imageUri;
    }
  }

  return [...map.values()].sort((a, b) => a.breed.localeCompare(b.breed, 'ja'));
}

export function getDexCompletion(entries: PigeonEntry[], goal = 20): {
  discovered: number;
  goal: number;
  percent: number;
} {
  const discovered = new Set(entries.map((e) => e.breed)).size;
  const percent = goal > 0 ? Math.min(100, Math.round((discovered / goal) * 100)) : 0;
  return { discovered, goal, percent };
}
