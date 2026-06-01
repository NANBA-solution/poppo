import type { TranslationTree } from '@/i18n/locales/ja';
import { ACHIEVEMENT_DEFS, type Achievement, type AchievementId } from '@/types/achievement';
import type { PigeonEntry } from '@/types/collection';

function statsFromEntries(entries: PigeonEntry[]) {
  return {
    total: entries.length,
    breeds: new Set(entries.map((e) => e.breed)).size,
  };
}

export function getAchievements(entries: PigeonEntry[], t: TranslationTree): Achievement[] {
  const stats = statsFromEntries(entries);
  return ACHIEVEMENT_DEFS.map((def) => {
    const copy = t.achievements.items[def.id];
    return {
      ...def,
      title: copy.title,
      description: copy.description,
      unlocked: def.check(stats),
    };
  });
}

export function getAchievementTitle(id: AchievementId, t: TranslationTree): string {
  return t.achievements.items[id].title;
}

export function detectNewAchievements(
  before: PigeonEntry[],
  after: PigeonEntry[],
  t: TranslationTree,
): AchievementId[] {
  const beforeUnlocked = new Set(
    getAchievements(before, t)
      .filter((a) => a.unlocked)
      .map((a) => a.id),
  );
  return getAchievements(after, t)
    .filter((a) => a.unlocked && !beforeUnlocked.has(a.id))
    .map((a) => a.id);
}
