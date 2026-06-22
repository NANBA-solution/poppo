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

const MILESTONE_SCAN_NOS = new Set([
  1, 7, 13, 42, 69, 77, 88, 100, 108, 404, 500, 666, 777, 888, 999,
]);

const PITY_THRESHOLD = 45;
/** ja/en の t.card.flavors[rarity] 件数（各レア 12 件）と揃える */
const FLAVOR_COUNT = 12;

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

function rollFromUnit(unit: number): CardRarity {
  if (unit < 0.002) return 'SECRET';
  if (unit < 0.008) return 'UR';
  if (unit < 0.028) return 'SR';
  if (unit < 0.10) return 'R';
  return 'N';
}

function scanHour(entry: PigeonEntry): number {
  return new Date(entry.scannedAt).getHours();
}

function isFriday13th(date: Date): boolean {
  return date.getDay() === 5 && date.getDate() === 13;
}

function isLeapDay(date: Date): boolean {
  return date.getMonth() === 1 && date.getDate() === 29;
}

function isExactTime(date: Date, hour: number, minute: number): boolean {
  return date.getHours() === hour && date.getMinutes() === minute;
}

/** スキャン状況から最低保証レア（ランダムの床） */
export function getRarityFloor(scanNo: number, scannedAt: Date): CardRarity {
  let floor: CardRarity = 'N';

  if (scanNo === 1) {
    return 'R';
  }

  if (MILESTONE_SCAN_NOS.has(scanNo)) {
    floor = maxRarity(floor, 'R');
  }

  if (scanNo > 1 && scanNo % 50 === 0) {
    floor = maxRarity(floor, 'R');
  }

  const hour = scannedAt.getHours();
  if (hour === 0) {
    floor = maxRarity(floor, 'R');
  } else if (hour >= 22 || hour < 5) {
    floor = maxRarity(floor, 'R');
  }

  if (isFriday13th(scannedAt)) {
    floor = maxRarity(floor, 'R');
  }

  if (isLeapDay(scannedAt)) {
    floor = maxRarity(floor, 'SR');
  }

  if (isExactTime(scannedAt, 4, 44) || isExactTime(scannedAt, 3, 33)) {
    floor = maxRarity(floor, 'SECRET');
  }

  return floor;
}

function scansSinceLastHighRarity(entries: PigeonEntry[]): number {
  for (let i = 0; i < entries.length; i += 1) {
    const rarity = entries[i]?.rarity;
    if (rarity && RARITY_RANK[rarity] >= RARITY_RANK.SR) {
      return i;
    }
  }
  return entries.length;
}

function applyPityFloor(
  floor: CardRarity,
  existingEntries: PigeonEntry[],
): CardRarity {
  if (scansSinceLastHighRarity(existingEntries) >= PITY_THRESHOLD) {
    return maxRarity(floor, 'R');
  }
  return floor;
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
  const floor = applyPityFloor(
    getRarityFloor(params.scanNo, params.scannedAt),
    params.existingEntries,
  );
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
