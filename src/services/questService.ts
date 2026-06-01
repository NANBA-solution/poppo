import { formatMessage } from '@/i18n/format';
import type { TranslationTree } from '@/i18n/locales/ja';
import { QUEST_DEFS, type Quest, type QuestId } from '@/types/quest';
import type { PigeonEntry } from '@/types/collection';

export function getQuests(entries: PigeonEntry[], t: TranslationTree): Quest[] {
  return QUEST_DEFS.map((def) => {
    const copy = t.quests.items[def.id];
    const prog = def.progress(entries);
    return {
      ...def,
      title: copy.title,
      description: copy.description,
      flavor: copy.flavor ?? '',
      progressLabel: formatMessage(t.quests.progress, {
        current: prog.current,
        max: prog.max,
      }),
      completed: def.check(entries),
    };
  });
}

export function detectNewQuests(before: PigeonEntry[], after: PigeonEntry[], t: TranslationTree): QuestId[] {
  const beforeDone = new Set(
    getQuests(before, t)
      .filter((q) => q.completed)
      .map((q) => q.id),
  );
  return getQuests(after, t)
    .filter((q) => q.completed && !beforeDone.has(q.id))
    .map((q) => q.id);
}

export function getQuestTitle(id: QuestId, t: TranslationTree): string {
  return t.quests.items[id].title;
}
