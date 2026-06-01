import { formatMessage } from '@/i18n/format';
import type { TranslationTree } from '@/i18n/locales/ja';

export type PlayerTitle = {
  title: string;
  subtitle: string;
  nextTitle: string | null;
  progressLabel: string | null;
};

const TIER_MINS = [0, 1, 3, 7, 15, 30] as const;

function bestPoppoTitleKey(wins: number): keyof TranslationTree['titles']['best'] | null {
  if (wins >= 30) return 'legend';
  if (wins >= 10) return 'regular';
  if (wins >= 3) return 'hunter';
  if (wins >= 1) return 'once';
  return null;
}

export function getPlayerTitle(
  scanCount: number,
  bestPoppoWins = 0,
  t: TranslationTree,
): PlayerTitle {
  const tiers = t.titles.tiers;
  let tierIndex = 0;
  for (let i = 0; i < TIER_MINS.length; i++) {
    if (scanCount >= TIER_MINS[i]) tierIndex = i;
  }

  const current = tiers[tierIndex];
  const next = tiers[tierIndex + 1] ?? null;

  const progressLabel =
    next != null
      ? formatMessage(t.titles.progressToNext, {
          count: Math.max(0, TIER_MINS[tierIndex + 1] - scanCount),
        })
      : null;

  const bestKey = bestPoppoTitleKey(bestPoppoWins);
  const winnerTitle = bestKey ? t.titles.best[bestKey] : null;

  return {
    title: winnerTitle ?? current.title,
    subtitle:
      winnerTitle != null
        ? formatMessage(t.titles.bestWinsSubtitle, { count: bestPoppoWins })
        : current.subtitle,
    nextTitle: next?.title ?? null,
    progressLabel,
  };
}
