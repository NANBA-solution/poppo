import { DEFAULT_COLLECTION_GOAL, getCurrentGoal } from '@/services/collectionGoalService';
import * as React from 'react';

/** 永続化されたコレクション目標を読み込む */
export function useCollectionGoal(scanCount: number): number {
  const [goal, setGoal] = React.useState(DEFAULT_COLLECTION_GOAL);

  React.useEffect(() => {
    let active = true;
    void getCurrentGoal(scanCount).then((value) => {
      if (active) setGoal(value);
    });
    return () => {
      active = false;
    };
  }, [scanCount]);

  return goal;
}
