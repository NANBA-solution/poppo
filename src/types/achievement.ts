import type { IconName } from '@/components/icons/AppIcon';

export type AchievementId =
  | 'first_poppo'
  | 'collector_3'
  | 'veteran_10'
  | 'breed_3'
  | 'breed_master';

export type AchievementDef = {
  id: AchievementId;
  icon: IconName;
  check: (stats: { total: number; breeds: number }) => boolean;
};

export type Achievement = AchievementDef & {
  title: string;
  description: string;
  unlocked: boolean;
};

export const ACHIEVEMENT_DEFS: AchievementDef[] = [
  {
    id: 'first_poppo',
    icon: 'egg',
    check: ({ total }) => total >= 1,
  },
  {
    id: 'collector_3',
    icon: 'bird',
    check: ({ total }) => total >= 3,
  },
  {
    id: 'veteran_10',
    icon: 'pigeon',
    check: ({ total }) => total >= 10,
  },
  {
    id: 'breed_3',
    icon: 'search',
    check: ({ breeds }) => breeds >= 3,
  },
  {
    id: 'breed_master',
    icon: 'crown',
    check: ({ breeds }) => breeds >= 10,
  },
];
