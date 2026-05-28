import type { PigeonEntry } from '@/types/collection';

export type QuestId =
  | 'first_scan'
  | 'scan_3'
  | 'breeds_3'
  | 'night_poppo'
  | 'long_nickname';

export type QuestDef = {
  id: QuestId;
  emoji: string;
  title: string;
  description: string;
  check: (entries: PigeonEntry[]) => boolean;
  progress: (entries: PigeonEntry[]) => string;
};

export type Quest = QuestDef & {
  completed: boolean;
};

export const QUEST_DEFS: QuestDef[] = [
  {
    id: 'first_scan',
    emoji: '🥚',
    title: 'はじめてのぽっぽ',
    description: 'ハトを1羽スキャンする',
    check: (e) => e.length >= 1,
    progress: (e) => `${Math.min(e.length, 1)}/1`,
  },
  {
    id: 'scan_3',
    emoji: '🐦',
    title: '街のハトハンター',
    description: '3羽スキャンする',
    check: (e) => e.length >= 3,
    progress: (e) => `${Math.min(e.length, 3)}/3`,
  },
  {
    id: 'breeds_3',
    emoji: '📖',
    title: '品種コレクター',
    description: '3種類以上の品種を発見',
    check: (e) => new Set(e.map((x) => x.breed)).size >= 3,
    progress: (e) => `${Math.min(new Set(e.map((x) => x.breed)).size, 3)}/3`,
  },
  {
    id: 'night_poppo',
    emoji: '🌙',
    title: '夜のぽっぽ',
    description: '22時〜5時にスキャンする',
    check: (e) =>
      e.some((x) => {
        const h = new Date(x.scannedAt).getHours();
        return h >= 22 || h < 5;
      }),
    progress: (e) => {
      const done = e.some((x) => {
        const h = new Date(x.scannedAt).getHours();
        return h >= 22 || h < 5;
      });
      return done ? '1/1' : '0/1';
    },
  },
  {
    id: 'long_nickname',
    emoji: '✨',
    title: 'ミームの達人',
    description: '長い二つ名（12文字以上）を獲得',
    check: (e) => e.some((x) => x.nickname.length >= 12),
    progress: (e) =>
      e.some((x) => x.nickname.length >= 12) ? '1/1' : '0/1',
  },
];
