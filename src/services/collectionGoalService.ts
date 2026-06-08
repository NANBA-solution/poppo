import AsyncStorage from '@react-native-async-storage/async-storage';

const GOAL_STORAGE_KEY = '@poppo/collection/goal-target';

/** 段階的に繰り上がる目標値 */
export const GOAL_TIERS = [5, 10, 25, 50, 100, 200, 500, 1000] as const;

export const DEFAULT_COLLECTION_GOAL: number = GOAL_TIERS[0];

export function getNextGoalTier(current: number): number {
  const idx = GOAL_TIERS.indexOf(current as (typeof GOAL_TIERS)[number]);
  if (idx >= 0 && idx < GOAL_TIERS.length - 1) {
    return GOAL_TIERS[idx + 1];
  }
  if (idx === GOAL_TIERS.length - 1) {
    return current + 500;
  }
  const nextTier = GOAL_TIERS.find((tier) => tier > current);
  return nextTier ?? current + 500;
}

async function readStoredGoal(): Promise<number | null> {
  const raw = await AsyncStorage.getItem(GOAL_STORAGE_KEY);
  if (!raw) return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

async function writeStoredGoal(goal: number): Promise<void> {
  await AsyncStorage.setItem(GOAL_STORAGE_KEY, String(goal));
}

/** スキャン数に合わせて目標を先へ進める（通知なし・巻き戻しなし） */
export async function syncGoalToCount(count: number, goal: number): Promise<number> {
  let next = goal;
  while (count >= next) {
    const advanced = getNextGoalTier(next);
    if (advanced <= next) break;
    next = advanced;
  }
  if (next !== goal) {
    await writeStoredGoal(next);
  }
  return next;
}

/** 現在のコレクション目標（必要ならスキャン数で同期） */
export async function getCurrentGoal(scanCount?: number): Promise<number> {
  const stored = (await readStoredGoal()) ?? DEFAULT_COLLECTION_GOAL;
  if (scanCount == null) return stored;
  return syncGoalToCount(scanCount, stored);
}

export async function resetCollectionGoal(): Promise<void> {
  await AsyncStorage.removeItem(GOAL_STORAGE_KEY);
}

export type GoalAchievement = {
  completedGoal: number;
  nextGoal: number;
};

/**
 * スキャン保存後に目標達成を判定。
 * 今回のスキャンで初めて目標に到達したときだけ結果を返す。
 */
export async function handleScanGoalAchievement(
  beforeCount: number,
  afterCount: number,
): Promise<GoalAchievement | null> {
  const goal = await getCurrentGoal(beforeCount);

  if (afterCount < goal) return null;

  if (beforeCount >= goal) {
    await syncGoalToCount(afterCount, goal);
    return null;
  }

  const completedGoal = goal;
  const nextGoal = getNextGoalTier(goal);
  await writeStoredGoal(nextGoal);
  await syncGoalToCount(afterCount, nextGoal);
  return { completedGoal, nextGoal };
}
