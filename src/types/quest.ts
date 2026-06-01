import type { IconName } from '@/components/icons/AppIcon';
import type { PigeonEntry } from '@/types/collection';

export type QuestId =
  | 'first_scan'
  | 'scan_3'
  | 'scan_10'
  | 'scan_100'
  | 'scan_999'
  | 'breeds_3'
  | 'breeds_10'
  | 'breeds_30'
  | 'night_poppo'
  | 'midnight_poppo'
  | 'dawn_444'
  | 'leap_day_poppo'
  | 'tuesday_3'
  | 'breed_clone_5'
  | 'long_nickname'
  | 'nickname_20'
  | 'nickname_legend'
  | 'same_day_5'
  | 'week_streak_7'
  | 'hour_rush_10'
  | 'phantom_breed'
  | 'exact_second_444'
  | 'no_vowel_nick'
  | 'sunday_purist'
  | 'all_nicknames_long';

export type QuestProgress = { current: number; max: number };

export type QuestDef = {
  id: QuestId;
  icon: IconName;
  check: (entries: PigeonEntry[]) => boolean;
  progress: (entries: PigeonEntry[]) => QuestProgress;
};

export type Quest = QuestDef & {
  title: string;
  description: string;
  flavor: string;
  progressLabel: string;
  completed: boolean;
};

function scanHour(entry: PigeonEntry): number {
  return new Date(entry.scannedAt).getHours();
}

function scanDateKey(entry: PigeonEntry): string {
  const d = new Date(entry.scannedAt);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function maxSameDayCount(entries: PigeonEntry[]): number {
  const counts = new Map<string, number>();
  for (const e of entries) {
    const key = scanDateKey(e);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return Math.max(0, ...counts.values());
}

function longestDayStreak(entries: PigeonEntry[]): number {
  const keys = [...new Set(entries.map(scanDateKey))].sort();
  if (keys.length === 0) return 0;
  let best = 1;
  let run = 1;
  for (let i = 1; i < keys.length; i += 1) {
    const prev = new Date(keys[i - 1]!);
    const curr = new Date(keys[i]!);
    const diff = (curr.getTime() - prev.getTime()) / 86_400_000;
    if (diff === 1) {
      run += 1;
      best = Math.max(best, run);
    } else {
      run = 1;
    }
  }
  return best;
}

function maxScansWithinHour(entries: PigeonEntry[]): number {
  if (entries.length === 0) return 0;
  const times = entries
    .map((e) => new Date(e.scannedAt).getTime())
    .sort((a, b) => a - b);
  let best = 1;
  let left = 0;
  for (let right = 0; right < times.length; right += 1) {
    while (times[right]! - times[left]! > 3_600_000) left += 1;
    best = Math.max(best, right - left + 1);
  }
  return best;
}

function maxBreedCount(entries: PigeonEntry[]): number {
  const counts = new Map<string, number>();
  for (const e of entries) {
    counts.set(e.breed, (counts.get(e.breed) ?? 0) + 1);
  }
  return Math.max(0, ...counts.values());
}

function uniqueBreeds(entries: PigeonEntry[]): number {
  return new Set(entries.map((x) => x.breed)).size;
}

export const QUEST_DEFS: QuestDef[] = [
  {
    id: 'first_scan',
    icon: 'egg',
    check: (e) => e.length >= 1,
    progress: (e) => ({ current: Math.min(e.length, 1), max: 1 }),
  },
  {
    id: 'scan_3',
    icon: 'bird',
    check: (e) => e.length >= 3,
    progress: (e) => ({ current: Math.min(e.length, 3), max: 3 }),
  },
  {
    id: 'scan_10',
    icon: 'bird',
    check: (e) => e.length >= 10,
    progress: (e) => ({ current: Math.min(e.length, 10), max: 10 }),
  },
  {
    id: 'scan_100',
    icon: 'trophy',
    check: (e) => e.length >= 100,
    progress: (e) => ({ current: Math.min(e.length, 100), max: 100 }),
  },
  {
    id: 'scan_999',
    icon: 'crown',
    check: (e) => e.length >= 999,
    progress: (e) => ({ current: Math.min(e.length, 999), max: 999 }),
  },
  {
    id: 'breeds_3',
    icon: 'book',
    check: (e) => uniqueBreeds(e) >= 3,
    progress: (e) => ({
      current: Math.min(uniqueBreeds(e), 3),
      max: 3,
    }),
  },
  {
    id: 'breeds_10',
    icon: 'book',
    check: (e) => uniqueBreeds(e) >= 10,
    progress: (e) => ({
      current: Math.min(uniqueBreeds(e), 10),
      max: 10,
    }),
  },
  {
    id: 'breeds_30',
    icon: 'book',
    check: (e) => uniqueBreeds(e) >= 30,
    progress: (e) => ({
      current: Math.min(uniqueBreeds(e), 30),
      max: 30,
    }),
  },
  {
    id: 'night_poppo',
    icon: 'moon',
    check: (e) => e.some((x) => {
      const h = scanHour(x);
      return h >= 22 || h < 5;
    }),
    progress: (e) => {
      const done = e.some((x) => {
        const h = scanHour(x);
        return h >= 22 || h < 5;
      });
      return { current: done ? 1 : 0, max: 1 };
    },
  },
  {
    id: 'midnight_poppo',
    icon: 'moon',
    check: (e) => e.some((x) => scanHour(x) === 0),
    progress: (e) => ({
      current: e.some((x) => scanHour(x) === 0) ? 1 : 0,
      max: 1,
    }),
  },
  {
    id: 'dawn_444',
    icon: 'flash',
    check: (e) =>
      e.some((x) => {
        const d = new Date(x.scannedAt);
        return d.getHours() === 4 && d.getMinutes() === 44;
      }),
    progress: (e) => ({
      current: e.some((x) => {
        const d = new Date(x.scannedAt);
        return d.getHours() === 4 && d.getMinutes() === 44;
      })
        ? 1
        : 0,
      max: 1,
    }),
  },
  {
    id: 'leap_day_poppo',
    icon: 'sparkle',
    check: (e) =>
      e.some((x) => {
        const d = new Date(x.scannedAt);
        return d.getMonth() === 1 && d.getDate() === 29;
      }),
    progress: (e) => ({
      current: e.some((x) => {
        const d = new Date(x.scannedAt);
        return d.getMonth() === 1 && d.getDate() === 29;
      })
        ? 1
        : 0,
      max: 1,
    }),
  },
  {
    id: 'tuesday_3',
    icon: 'target',
    check: (e) =>
      e.filter((x) => new Date(x.scannedAt).getDay() === 2).length >= 3,
    progress: (e) => ({
      current: Math.min(
        e.filter((x) => new Date(x.scannedAt).getDay() === 2).length,
        3,
      ),
      max: 3,
    }),
  },
  {
    id: 'breed_clone_5',
    icon: 'pigeon',
    check: (e) => maxBreedCount(e) >= 5,
    progress: (e) => ({
      current: Math.min(maxBreedCount(e), 5),
      max: 5,
    }),
  },
  {
    id: 'long_nickname',
    icon: 'sparkle',
    check: (e) => e.some((x) => x.nickname.length >= 12),
    progress: (e) => ({
      current: e.some((x) => x.nickname.length >= 12) ? 1 : 0,
      max: 1,
    }),
  },
  {
    id: 'nickname_20',
    icon: 'sparkle',
    check: (e) => e.some((x) => x.nickname.length >= 20),
    progress: (e) => ({
      current: e.some((x) => x.nickname.length >= 20) ? 1 : 0,
      max: 1,
    }),
  },
  {
    id: 'nickname_legend',
    icon: 'crown',
    check: (e) => e.some((x) => x.nickname.includes('伝説')),
    progress: (e) => ({
      current: e.some((x) => x.nickname.includes('伝説')) ? 1 : 0,
      max: 1,
    }),
  },
  {
    id: 'same_day_5',
    icon: 'flash-auto',
    check: (e) => maxSameDayCount(e) >= 5,
    progress: (e) => ({
      current: Math.min(maxSameDayCount(e), 5),
      max: 5,
    }),
  },
  {
    id: 'week_streak_7',
    icon: 'heart',
    check: (e) => longestDayStreak(e) >= 7,
    progress: (e) => ({
      current: Math.min(longestDayStreak(e), 7),
      max: 7,
    }),
  },
  {
    id: 'hour_rush_10',
    icon: 'flash',
    check: (e) => maxScansWithinHour(e) >= 10,
    progress: (e) => ({
      current: Math.min(maxScansWithinHour(e), 10),
      max: 10,
    }),
  },
  {
    id: 'phantom_breed',
    icon: 'search',
    check: (e) => e.some((x) => x.breed === '存在しない幻のハト'),
    progress: (e) => ({
      current: e.some((x) => x.breed === '存在しない幻のハト') ? 1 : 0,
      max: 1,
    }),
  },
  {
    id: 'exact_second_444',
    icon: 'moon',
    check: (e) =>
      e.some((x) => {
        const d = new Date(x.scannedAt);
        return d.getHours() === 4 && d.getMinutes() === 44 && d.getSeconds() === 44;
      }),
    progress: (e) => ({
      current: e.some((x) => {
        const d = new Date(x.scannedAt);
        return d.getHours() === 4 && d.getMinutes() === 44 && d.getSeconds() === 44;
      })
        ? 1
        : 0,
      max: 1,
    }),
  },
  {
    id: 'no_vowel_nick',
    icon: 'brain',
    check: (e) =>
      e.some((x) => !/[あいうえおアイウエオ]/.test(x.nickname)),
    progress: (e) => ({
      current: e.some((x) => !/[あいうえおアイウエオ]/.test(x.nickname)) ? 1 : 0,
      max: 1,
    }),
  },
  {
    id: 'sunday_purist',
    icon: 'heart-outline',
    check: (e) => e.length >= 3 && e.every((x) => new Date(x.scannedAt).getDay() === 0),
    progress: (e) => {
      if (e.length === 0) return { current: 0, max: 3 };
      const allSunday = e.every((x) => new Date(x.scannedAt).getDay() === 0);
      if (!allSunday) return { current: 0, max: 3 };
      return { current: Math.min(e.length, 3), max: 3 };
    },
  },
  {
    id: 'all_nicknames_long',
    icon: 'trophy',
    check: (e) => e.length >= 5 && e.every((x) => x.nickname.length >= 12),
    progress: (e) => {
      if (e.length < 5) return { current: e.length, max: 5 };
      const allLong = e.every((x) => x.nickname.length >= 12);
      return { current: allLong ? 5 : 0, max: 5 };
    },
  },
];
