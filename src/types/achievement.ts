export type AchievementId =
  | 'first_poppo'
  | 'collector_3'
  | 'veteran_10'
  | 'breed_3'
  | 'breed_master';

export type AchievementDef = {
  id: AchievementId;
  emoji: string;
  title: string;
  description: string;
  check: (stats: { total: number; breeds: number }) => boolean;
};

export type Achievement = AchievementDef & {
  unlocked: boolean;
};

export const ACHIEVEMENT_DEFS: AchievementDef[] = [
  {
    id: 'first_poppo',
    emoji: '🥚',
    title: '初めてのぽっぽ',
    description: '初スキャン達成',
    check: ({ total }) => total >= 1,
  },
  {
    id: 'collector_3',
    emoji: '🐦',
    title: '3羽コレクター',
    description: '3羽スキャン',
    check: ({ total }) => total >= 3,
  },
  {
    id: 'veteran_10',
    emoji: '🕊️',
    title: 'ベテラン',
    description: '10羽スキャン',
    check: ({ total }) => total >= 10,
  },
  {
    id: 'breed_3',
    emoji: '🔍',
    title: '品種ハンター',
    description: '3品種以上発見',
    check: ({ breeds }) => breeds >= 3,
  },
  {
    id: 'breed_master',
    emoji: '👑',
    title: '品種マスター',
    description: '10品種以上発見',
    check: ({ breeds }) => breeds >= 10,
  },
];
