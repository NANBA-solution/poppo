import {
  CARD_RARITIES,
  type CardRarity,
  type PigeonEntry,
} from '@/types/collection';

const RARITY_RANK: Record<CardRarity, number> = {
  N: 0,
  R: 1,
  SR: 2,
  UR: 3,
  SECRET: 4,
};

/** ja/en の t.card.flavors[rarity] 件数（各レア 12 件）と揃える */
const FLAVOR_COUNT = 12;

/**
 * 基本抽選（unit は 0〜1 の一様乱数）
 * N 約 97% / R 約 2.5% / SR 約 0.35% / UR 約 0.12% / SECRET 約 0.03%
 */
function rollFromUnit(unit: number): CardRarity {
  if (unit < 0.0003) return 'SECRET';
  if (unit < 0.0015) return 'UR';
  if (unit < 0.005) return 'SR';
  if (unit < 0.03) return 'R';
  return 'N';
}

function maxRarity(a: CardRarity, b: CardRarity): CardRarity {
  return RARITY_RANK[a] >= RARITY_RANK[b] ? a : b;
}

function seededUnit(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  return (Math.abs(hash) % 10_000) / 10_000;
}

function isLeapDay(date: Date): boolean {
  return date.getMonth() === 1 && date.getDate() === 29;
}

function isExactTime(date: Date, hour: number, minute: number): boolean {
  return date.getHours() === hour && date.getMinutes() === minute;
}

/** イースターエッグのみ最低保証（通常は N 床） */
export function getRarityFloor(_scanNo: number, scannedAt: Date): CardRarity {
  if (isLeapDay(scannedAt)) {
    return 'SR';
  }
  if (isExactTime(scannedAt, 4, 44) || isExactTime(scannedAt, 3, 33)) {
    return 'SECRET';
  }
  return 'N';
}

function pickFlavorIndex(rarity: CardRarity, seed: string): number {
  const unit = seededUnit(`${seed}:flavor`);
  return Math.floor(unit * FLAVOR_COUNT) % FLAVOR_COUNT;
}

export function rollRarityForNewScan(params: {
  entryId: string;
  scanNo: number;
  scannedAt: Date;
  existingEntries: PigeonEntry[];
}): { rarity: CardRarity; flavorIndex: number } {
  void params.existingEntries;
  const floor = getRarityFloor(params.scanNo, params.scannedAt);
  const rolled = rollFromUnit(Math.random());
  const rarity = maxRarity(rolled, floor);
  return {
    rarity,
    flavorIndex: pickFlavorIndex(rarity, params.entryId),
  };
}

/** 旧データ向け: id をシードに同じ結果を再現 */
export function resolveRetroactiveRarity(
  entry: PigeonEntry,
  scanNo: number,
): { rarity: CardRarity; flavorIndex: number } {
  const scannedAt = new Date(entry.scannedAt);
  const floor = getRarityFloor(scanNo, scannedAt);
  const rolled = rollFromUnit(seededUnit(`${entry.id}:rarity`));
  const rarity = maxRarity(rolled, floor);
  return {
    rarity,
    flavorIndex: pickFlavorIndex(rarity, entry.id),
  };
}

export function ensureEntryRarity(
  entry: PigeonEntry,
  scanNo: number,
): PigeonEntry {
  if (entry.rarity != null && entry.flavorIndex != null) {
    return entry;
  }
  const resolved =
    entry.rarity != null
      ? {
          rarity: entry.rarity,
          flavorIndex:
            entry.flavorIndex ??
            pickFlavorIndex(entry.rarity, entry.id),
        }
      : resolveRetroactiveRarity(entry, scanNo);

  return {
    ...entry,
    rarity: resolved.rarity,
    flavorIndex: resolved.flavorIndex,
  };
}

export function isHighRarity(rarity: CardRarity): boolean {
  return RARITY_RANK[rarity] >= RARITY_RANK.SR;
}

export function raritySortWeight(rarity: CardRarity): number {
  return RARITY_RANK[rarity];
}

export { CARD_RARITIES, FLAVOR_COUNT };
