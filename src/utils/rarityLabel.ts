import { formatMessage } from '@/i18n/format';
import type { TranslationTree } from '@/i18n/locales/ja';
import type { CardRarity } from '@/types/collection';

export function getRarityLabel(rarity: CardRarity, t: TranslationTree): string {
  return t.card.rarity[rarity];
}

export function getRarityFlavor(
  rarity: CardRarity,
  flavorIndex: number,
  t: TranslationTree,
): string {
  const lines = t.card.flavors[rarity];
  if (lines.length === 0) return '';
  const index = ((flavorIndex % lines.length) + lines.length) % lines.length;
  return lines[index] ?? lines[0]!;
}

export function getRarityRevealMessage(
  rarity: CardRarity,
  t: TranslationTree,
): string | null {
  if (rarity === 'N' || rarity === 'R') return null;
  return formatMessage(t.card.reveal, { rarity: getRarityLabel(rarity, t) });
}

export function getCardStats(
  rarity: CardRarity,
  scanNo: number,
): { atk: number; def: number } {
  const base = scanNo * 17 + rarity.length * 111;
  const atk = 800 + (base % 1200);
  const def = 400 + ((base * 3) % 900);
  return { atk, def };
}

const POWER_STAR_RANGE: Record<CardRarity, { min: number; max: number }> = {
  N: { min: 1, max: 2 },
  R: { min: 2, max: 3 },
  SR: { min: 3, max: 4 },
  UR: { min: 4, max: 5 },
  SECRET: { min: 5, max: 5 },
};

/** 強さの星（1〜5）。レアリティの床＋スキャン番号でぶれさせる */
export function getCardPowerStars(rarity: CardRarity, scanNo: number): number {
  const { min, max } = POWER_STAR_RANGE[rarity];
  if (min === max) return min;
  const span = max - min + 1;
  return min + (scanNo % span);
}

export function getCardAttackDamage(
  _rarity: CardRarity,
  scanNo: number,
  slot: 1 | 2,
): number {
  const stats = getCardStats(_rarity, scanNo);
  const seed = slot === 1 ? stats.atk : stats.def;
  return 1 + (seed % 10);
}

const HP_BASE: Record<CardRarity, number> = {
  N: 50,
  R: 70,
  SR: 90,
  UR: 110,
  SECRET: 130,
};

export function getCardHp(rarity: CardRarity, scanNo: number): number {
  return HP_BASE[rarity] + (scanNo % 25);
}

const RETREAT_BASE: Record<CardRarity, number> = {
  N: 1,
  R: 1,
  SR: 2,
  UR: 2,
  SECRET: 3,
};

export function getCardRetreatCost(rarity: CardRarity, scanNo: number): number {
  return RETREAT_BASE[rarity] + (scanNo % 3 === 0 ? 1 : 0);
}
