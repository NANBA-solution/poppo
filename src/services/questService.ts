import type { PigeonEntry } from '@/types/collection';
import { QUEST_DEFS, type Quest, type QuestId } from '@/types/quest';

export function getQuests(entries: PigeonEntry[]): Quest[] {
  return QUEST_DEFS.map((def) => ({
    ...def,
    completed: def.check(entries),
  }));
}

export function detectNewQuests(before: PigeonEntry[], after: PigeonEntry[]): QuestId[] {
  const beforeDone = new Set(
    getQuests(before)
      .filter((q) => q.completed)
      .map((q) => q.id),
  );
  return getQuests(after)
    .filter((q) => q.completed && !beforeDone.has(q.id))
    .map((q) => q.id);
}

export function getQuestById(id: QuestId) {
  return QUEST_DEFS.find((q) => q.id === id);
}
