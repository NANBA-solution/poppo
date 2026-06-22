export const CARD_RARITIES = ['N', 'R', 'SR', 'UR', 'SECRET'] as const;

export type CardRarity = (typeof CARD_RARITIES)[number];

export type PigeonEntry = {
  id: string;
  imageUri: string;
  breed: string;
  scannedAt: string;
  /** 保存時に確定。未設定の旧データは読み込み時に遡及計算 */
  rarity?: CardRarity;
  /** t.card.flavors[rarity] のインデックス */
  flavorIndex?: number;
};
