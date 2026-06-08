import { DEFAULT_COLLECTION_GOAL } from '@/services/collectionGoalService';
import type { PigeonEntry } from '@/types/collection';

/** スキャン羽数ベースのコレクション進捗 */
export function getDexCompletion(entries: PigeonEntry[], goal = DEFAULT_COLLECTION_GOAL): {
  current: number;
  goal: number;
  percent: number;
} {
  const current = entries.length;
  const percent = goal > 0 ? Math.min(100, Math.round((current / goal) * 100)) : 0;
  return { current, goal, percent };
}
