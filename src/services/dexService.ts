import type { PigeonEntry } from '@/types/collection';

/** スキャン羽数ベースのコレクション進捗 */
export function getDexCompletion(entries: PigeonEntry[], goal = 100): {
  current: number;
  goal: number;
  percent: number;
} {
  const current = entries.length;
  const percent = goal > 0 ? Math.min(100, Math.round((current / goal) * 100)) : 0;
  return { current, goal, percent };
}
