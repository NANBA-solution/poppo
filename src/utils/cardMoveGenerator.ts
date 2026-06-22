import { MOVE_PAIRS, type CardMovePair } from '@/data/cardMovePools';
import type { AppLocale } from '@/services/localeService';
import type { CardRarity } from '@/types/collection';

export type GeneratedCardMove = {
  name: string;
  desc: string;
};

function seededUnit(seed: string, salt: string): number {
  const text = `${seed}:${salt}`;
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }
  return (Math.abs(hash) % 10_000) / 10_000;
}

function pickPair(
  pairs: readonly CardMovePair[],
  unit: number,
  avoid?: CardMovePair,
): CardMovePair {
  let index = Math.floor(unit * pairs.length) % pairs.length;
  let pair = pairs[index] ?? pairs[0]!;
  if (avoid && pair.name === avoid.name) {
    index = (index + 1) % pairs.length;
    pair = pairs[index] ?? pairs[0]!;
  }
  return pair;
}

function pickMove(
  seed: string,
  slot: 1 | 2,
  locale: AppLocale,
  avoid?: CardMovePair,
): GeneratedCardMove {
  const pairs = MOVE_PAIRS[locale];
  let unit = seededUnit(seed, `move-${slot}`);
  let pair = pickPair(pairs, unit, avoid);
  if (avoid && pair.desc === avoid.desc) {
    unit = seededUnit(seed, `move-${slot}-alt`);
    pair = pickPair(pairs, (unit + 0.37) % 1, avoid);
  }
  return { name: pair.name, desc: pair.desc };
}

export function buildMoveSeed(entryId: string | undefined, scanNo: number, flavorIndex: number): string {
  if (entryId) return entryId;
  return `scan-${scanNo}-flavor-${flavorIndex}`;
}

/** カードごとに固定のわざ2つを自動生成（技名と特徴は常にペア） */
export function generateCardMoves(params: {
  seed: string;
  locale: AppLocale;
  rarity: CardRarity;
}): [GeneratedCardMove, GeneratedCardMove] {
  const move1 = pickMove(params.seed, 1, params.locale);
  const move2 = pickMove(params.seed, 2, params.locale, move1);
  return [move1, move2];
}
