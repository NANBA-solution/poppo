import { formatMessage } from '@/i18n/format';
import type { TranslationTree } from '@/i18n/locales/ja';

export type PlayerTitle = {
  title: string;
  subtitle: string;
  nextTitle: string | null;
  progressLabel: string | null;
};

/** スキャン数しきい値（tiers 配列の index と対応） */
const TIER_MINS = [
  0, 1, 2, 3, 5, 7, 10, 13, 15, 20, 25, 30, 42, 50, 69, 77, 88, 99, 100, 108, 130, 150,
  200, 250, 300, 404, 500, 666, 777, 888, 999,
] as const;

export function getPlayerTitle(scanCount: number, t: TranslationTree): PlayerTitle {
  const tiers = t.titles.tiers;
  let tierIndex = 0;
  for (let i = 0; i < TIER_MINS.length; i += 1) {
    if (scanCount >= TIER_MINS[i]) tierIndex = i;
  }

  const current = tiers[tierIndex] ?? tiers[tiers.length - 1]!;
  const next = tiers[tierIndex + 1] ?? null;
  const nextMin = TIER_MINS[tierIndex + 1];

  const progressLabel =
    next != null && nextMin != null
      ? formatMessage(t.titles.progressToNext, {
          count: Math.max(0, nextMin - scanCount),
        })
      : null;

  return {
    title: current.title,
    subtitle: current.subtitle,
    nextTitle: next?.title ?? null,
    progressLabel,
  };
}
