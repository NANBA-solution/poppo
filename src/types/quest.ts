import type { IconName } from '@/components/icons/AppIcon';
import type { PigeonEntry } from '@/types/collection';

export type QuestId =
  | 'first_scan'
  | 'scan_3'
  | 'scan_7'
  | 'scan_10'
  | 'scan_13'
  | 'scan_25'
  | 'scan_42'
  | 'scan_50'
  | 'scan_69'
  | 'scan_88'
  | 'scan_100'
  | 'scan_108'
  | 'scan_200'
  | 'scan_404'
  | 'scan_500'
  | 'scan_666'
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
  | 'same_day_5'
  | 'week_streak_7'
  | 'hour_rush_10'
  | 'phantom_breed'
  | 'exact_second_444'
  | 'sunday_purist'
  | 'pending_5'
  | 'pending_20'
  | 'pending_purist_10'
  | 'hour_333'
  | 'hour_909'
  | 'hour_1111'
  | 'hour_3am'
  | 'noon_zone'
  | 'minute_zero_3'
  | 'minute_59'
  | 'friday_13th'
  | 'april_fool'
  | 'groundhog_day'
  | 'mar_3_triple'
  | 'dec_31'
  | 'jan_1'
  | 'mirror_date'
  | 'moon_day_15'
  | 'all_weekdays'
  | 'monday_purist'
  | 'wednesday_3'
  | 'saturday_night'
  | 'rainbow_day'
  | 'monoculture_10'
  | 'same_minute_3'
  | 'flash_10sec_3'
  | 'breed_chaos_7'
  | 'hour_4_four'
  | 'consecutive_midnight'
  | 'tax_day_poppo'
  | 'lucky_707'
  | 'schrodinger_poppo';

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

const PENDING_BREED = '未判定';

function countScans(entries: PigeonEntry[]): number {
  return entries.length;
}

function countPending(entries: PigeonEntry[]): number {
  return entries.filter((x) => x.breed === PENDING_BREED).length;
}

function countAtHM(entries: PigeonEntry[], hour: number, minute: number): number {
  return entries.filter((x) => {
    const d = new Date(x.scannedAt);
    return d.getHours() === hour && d.getMinutes() === minute;
  }).length;
}

function countInHour(entries: PigeonEntry[], hour: number): number {
  return entries.filter((x) => new Date(x.scannedAt).getHours() === hour).length;
}

function countAtMinute(entries: PigeonEntry[], minute: number): number {
  return entries.filter((x) => new Date(x.scannedAt).getMinutes() === minute).length;
}

function countOnMonthDay(entries: PigeonEntry[], month: number, day: number): number {
  return entries.filter((x) => {
    const d = new Date(x.scannedAt);
    return d.getMonth() === month && d.getDate() === day;
  }).length;
}

function countWeekday(entries: PigeonEntry[], weekday: number): number {
  return entries.filter((x) => new Date(x.scannedAt).getDay() === weekday).length;
}

function hasAllWeekdays(entries: PigeonEntry[]): boolean {
  const days = new Set(entries.map((x) => new Date(x.scannedAt).getDay()));
  return [0, 1, 2, 3, 4, 5, 6].every((d) => days.has(d));
}

function maxBreedsSameDay(entries: PigeonEntry[]): number {
  const byDay = new Map<string, Set<string>>();
  for (const e of entries) {
    const key = scanDateKey(e);
    const breeds = byDay.get(key) ?? new Set<string>();
    breeds.add(e.breed);
    byDay.set(key, breeds);
  }
  return Math.max(0, ...[...byDay.values()].map((s) => s.size));
}

function maxScansSameMinute(entries: PigeonEntry[]): number {
  const counts = new Map<string, number>();
  for (const e of entries) {
    const d = new Date(e.scannedAt);
    const key = `${scanDateKey(e)}-${d.getHours()}-${d.getMinutes()}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return Math.max(0, ...counts.values());
}

function maxScansWithinSeconds(entries: PigeonEntry[], seconds: number): number {
  if (entries.length === 0) return 0;
  const times = entries
    .map((e) => new Date(e.scannedAt).getTime())
    .sort((a, b) => a - b);
  const windowMs = seconds * 1000;
  let best = 1;
  let left = 0;
  for (let right = 0; right < times.length; right += 1) {
    while (times[right]! - times[left]! > windowMs) left += 1;
    best = Math.max(best, right - left + 1);
  }
  return best;
}

function hasConsecutiveMidnightDays(entries: PigeonEntry[]): boolean {
  const midnightDays = new Set(
    entries
      .filter((x) => scanHour(x) === 0)
      .map(scanDateKey),
  );
  const sorted = [...midnightDays].sort();
  for (let i = 1; i < sorted.length; i += 1) {
    const prev = new Date(sorted[i - 1]!);
    const curr = new Date(sorted[i]!);
    if ((curr.getTime() - prev.getTime()) / 86_400_000 === 1) return true;
  }
  return false;
}

function scanCount(entries: PigeonEntry[], max: number) {
  return { current: Math.min(countScans(entries), max), max };
}

function boolProgress(done: boolean) {
  return { current: done ? 1 : 0, max: 1 };
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
  { id: 'scan_7', icon: 'egg', check: (e) => e.length >= 7, progress: (e) => scanCount(e, 7) },
  { id: 'scan_13', icon: 'bird', check: (e) => e.length >= 13, progress: (e) => scanCount(e, 13) },
  { id: 'scan_25', icon: 'bird', check: (e) => e.length >= 25, progress: (e) => scanCount(e, 25) },
  { id: 'scan_42', icon: 'brain', check: (e) => e.length >= 42, progress: (e) => scanCount(e, 42) },
  { id: 'scan_50', icon: 'bird', check: (e) => e.length >= 50, progress: (e) => scanCount(e, 50) },
  { id: 'scan_69', icon: 'heart', check: (e) => e.length >= 69, progress: (e) => scanCount(e, 69) },
  { id: 'scan_88', icon: 'sparkle', check: (e) => e.length >= 88, progress: (e) => scanCount(e, 88) },
  { id: 'scan_108', icon: 'crown', check: (e) => e.length >= 108, progress: (e) => scanCount(e, 108) },
  { id: 'scan_200', icon: 'trophy', check: (e) => e.length >= 200, progress: (e) => scanCount(e, 200) },
  { id: 'scan_404', icon: 'search', check: (e) => e.length >= 404, progress: (e) => scanCount(e, 404) },
  { id: 'scan_500', icon: 'trophy', check: (e) => e.length >= 500, progress: (e) => scanCount(e, 500) },
  { id: 'scan_666', icon: 'moon', check: (e) => e.length >= 666, progress: (e) => scanCount(e, 666) },
  {
    id: 'pending_5',
    icon: 'brain',
    check: (e) => countPending(e) >= 5,
    progress: (e) => ({ current: Math.min(countPending(e), 5), max: 5 }),
  },
  {
    id: 'pending_20',
    icon: 'brain',
    check: (e) => countPending(e) >= 20,
    progress: (e) => ({ current: Math.min(countPending(e), 20), max: 20 }),
  },
  {
    id: 'pending_purist_10',
    icon: 'book',
    check: (e) => e.length >= 10 && e.every((x) => x.breed === PENDING_BREED),
    progress: (e) => {
      if (e.length === 0) return { current: 0, max: 10 };
      const pure = e.every((x) => x.breed === PENDING_BREED);
      if (!pure) return { current: 0, max: 10 };
      return { current: Math.min(e.length, 10), max: 10 };
    },
  },
  {
    id: 'hour_333',
    icon: 'moon',
    check: (e) => countAtHM(e, 3, 33) > 0,
    progress: (e) => boolProgress(countAtHM(e, 3, 33) > 0),
  },
  {
    id: 'hour_909',
    icon: 'flash',
    check: (e) => e.some((x) => {
      const d = new Date(x.scannedAt);
      return d.getHours() === 9 && d.getMinutes() === 9;
    }),
    progress: (e) => boolProgress(countAtHM(e, 9, 9) > 0),
  },
  {
    id: 'hour_1111',
    icon: 'sparkle',
    check: (e) => e.some((x) => {
      const d = new Date(x.scannedAt);
      return d.getHours() === 11 && d.getMinutes() === 11;
    }),
    progress: (e) => boolProgress(countAtHM(e, 11, 11) > 0),
  },
  {
    id: 'hour_3am',
    icon: 'moon',
    check: (e) => countInHour(e, 3) >= 1,
    progress: (e) => boolProgress(countInHour(e, 3) > 0),
  },
  {
    id: 'noon_zone',
    icon: 'flash-auto',
    check: (e) => countInHour(e, 12) >= 1,
    progress: (e) => boolProgress(countInHour(e, 12) > 0),
  },
  {
    id: 'minute_zero_3',
    icon: 'target',
    check: (e) => countAtMinute(e, 0) >= 3,
    progress: (e) => ({ current: Math.min(countAtMinute(e, 0), 3), max: 3 }),
  },
  {
    id: 'minute_59',
    icon: 'flash',
    check: (e) => countAtMinute(e, 59) >= 1,
    progress: (e) => boolProgress(countAtMinute(e, 59) > 0),
  },
  {
    id: 'friday_13th',
    icon: 'moon',
    check: (e) =>
      e.some((x) => {
        const d = new Date(x.scannedAt);
        return d.getDay() === 5 && d.getDate() === 13;
      }),
    progress: (e) =>
      boolProgress(
        e.some((x) => {
          const d = new Date(x.scannedAt);
          return d.getDay() === 5 && d.getDate() === 13;
        }),
      ),
  },
  {
    id: 'april_fool',
    icon: 'egg',
    check: (e) => countOnMonthDay(e, 3, 1) >= 1,
    progress: (e) => boolProgress(countOnMonthDay(e, 3, 1) > 0),
  },
  {
    id: 'groundhog_day',
    icon: 'bird',
    check: (e) => countOnMonthDay(e, 1, 2) >= 1,
    progress: (e) => boolProgress(countOnMonthDay(e, 1, 2) > 0),
  },
  {
    id: 'mar_3_triple',
    icon: 'target',
    check: (e) => countOnMonthDay(e, 2, 3) >= 3,
    progress: (e) => ({ current: Math.min(countOnMonthDay(e, 2, 3), 3), max: 3 }),
  },
  {
    id: 'dec_31',
    icon: 'sparkle',
    check: (e) => countOnMonthDay(e, 11, 31) >= 1,
    progress: (e) => boolProgress(countOnMonthDay(e, 11, 31) > 0),
  },
  {
    id: 'jan_1',
    icon: 'sparkle',
    check: (e) => countOnMonthDay(e, 0, 1) >= 1,
    progress: (e) => boolProgress(countOnMonthDay(e, 0, 1) > 0),
  },
  {
    id: 'mirror_date',
    icon: 'heart-outline',
    check: (e) =>
      e.some((x) => {
        const d = new Date(x.scannedAt);
        const day = d.getDate();
        return day === d.getMonth() + 1 && day <= 12;
      }),
    progress: (e) =>
      boolProgress(
        e.some((x) => {
          const d = new Date(x.scannedAt);
          const day = d.getDate();
          return day === d.getMonth() + 1 && day <= 12;
        }),
      ),
  },
  {
    id: 'moon_day_15',
    icon: 'moon',
    check: (e) => e.some((x) => new Date(x.scannedAt).getDate() === 15),
    progress: (e) =>
      boolProgress(e.some((x) => new Date(x.scannedAt).getDate() === 15)),
  },
  {
    id: 'all_weekdays',
    icon: 'book',
    check: (e) => hasAllWeekdays(e),
    progress: (e) => {
      const days = new Set(e.map((x) => new Date(x.scannedAt).getDay()));
      return { current: days.size, max: 7 };
    },
  },
  {
    id: 'monday_purist',
    icon: 'heart-outline',
    check: (e) => e.length >= 3 && e.every((x) => new Date(x.scannedAt).getDay() === 1),
    progress: (e) => {
      if (e.length === 0) return { current: 0, max: 3 };
      const pure = e.every((x) => new Date(x.scannedAt).getDay() === 1);
      if (!pure) return { current: 0, max: 3 };
      return { current: Math.min(e.length, 3), max: 3 };
    },
  },
  {
    id: 'wednesday_3',
    icon: 'pigeon',
    check: (e) => countWeekday(e, 3) >= 3,
    progress: (e) => ({ current: Math.min(countWeekday(e, 3), 3), max: 3 }),
  },
  {
    id: 'saturday_night',
    icon: 'moon',
    check: (e) =>
      e.some((x) => {
        const d = new Date(x.scannedAt);
        return d.getDay() === 6 && d.getHours() >= 20;
      }),
    progress: (e) =>
      boolProgress(
        e.some((x) => {
          const d = new Date(x.scannedAt);
          return d.getDay() === 6 && d.getHours() >= 20;
        }),
      ),
  },
  {
    id: 'rainbow_day',
    icon: 'sparkle',
    check: (e) => maxBreedsSameDay(e) >= 5,
    progress: (e) => ({ current: Math.min(maxBreedsSameDay(e), 5), max: 5 }),
  },
  {
    id: 'monoculture_10',
    icon: 'pigeon',
    check: (e) => maxBreedCount(e) >= 10,
    progress: (e) => ({ current: Math.min(maxBreedCount(e), 10), max: 10 }),
  },
  {
    id: 'same_minute_3',
    icon: 'flash',
    check: (e) => maxScansSameMinute(e) >= 3,
    progress: (e) => ({ current: Math.min(maxScansSameMinute(e), 3), max: 3 }),
  },
  {
    id: 'flash_10sec_3',
    icon: 'flash-auto',
    check: (e) => maxScansWithinSeconds(e, 10) >= 3,
    progress: (e) => ({
      current: Math.min(maxScansWithinSeconds(e, 10), 3),
      max: 3,
    }),
  },
  {
    id: 'breed_chaos_7',
    icon: 'brain',
    check: (e) => maxBreedsSameDay(e) >= 7,
    progress: (e) => ({ current: Math.min(maxBreedsSameDay(e), 7), max: 7 }),
  },
  {
    id: 'hour_4_four',
    icon: 'moon',
    check: (e) => countInHour(e, 4) >= 4,
    progress: (e) => ({ current: Math.min(countInHour(e, 4), 4), max: 4 }),
  },
  {
    id: 'consecutive_midnight',
    icon: 'moon',
    check: (e) => hasConsecutiveMidnightDays(e),
    progress: (e) => boolProgress(hasConsecutiveMidnightDays(e)),
  },
  {
    id: 'tax_day_poppo',
    icon: 'report',
    check: (e) => countOnMonthDay(e, 3, 15) >= 1,
    progress: (e) => boolProgress(countOnMonthDay(e, 3, 15) > 0),
  },
  {
    id: 'lucky_707',
    icon: 'sparkle',
    check: (e) => e.length >= 7 && countAtHM(e, 7, 7) >= 1,
    progress: (e) => {
      const at707 = countAtHM(e, 7, 7) > 0;
      return { current: at707 && e.length >= 7 ? 1 : 0, max: 1 };
    },
  },
  {
    id: 'schrodinger_poppo',
    icon: 'brain',
    check: () => false,
    progress: () => ({ current: 0, max: 1 }),
  },
];
