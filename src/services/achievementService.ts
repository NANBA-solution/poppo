import type { PigeonEntry } from '@/types/collection';
import { ACHIEVEMENT_DEFS, type Achievement, type AchievementId } from '@/types/achievement';

function statsFromEntries(entries: PigeonEntry[]) {
  return {
    total: entries.length,
    breeds: new Set(entries.map((e) => e.breed)).size,
  };
}

export function getAchievements(entries: PigeonEntry[]): Achievement[] {
  const stats = statsFromEntries(entries);
  return ACHIEVEMENT_DEFS.map((def) => ({
    ...def,
    unlocked: def.check(stats),
  }));
}

export function getUnlockedAchievements(entries: PigeonEntry[]): Achievement[] {
  return getAchievements(entries).filter((a) => a.unlocked);
}

/** 保存前後で新たに解除された実績 ID を返す */
export function detectNewAchievements(
  before: PigeonEntry[],
  after: PigeonEntry[],
): AchievementId[] {
  const beforeUnlocked = new Set(
    getAchievements(before)
      .filter((a) => a.unlocked)
      .map((a) => a.id),
  );
  return getAchievements(after)
    .filter((a) => a.unlocked && !beforeUnlocked.has(a.id))
    .map((a) => a.id);
}
