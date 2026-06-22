import type { CardRarity } from '@/types/collection';
import type { HoloCardRarity } from 'poppo-cards';

export function toHoloCardRarity(rarity: CardRarity): HoloCardRarity {
  switch (rarity) {
    case 'R':
      return 'rare';
    case 'SR':
    case 'UR':
    case 'SECRET':
      return 'legendary';
    default:
      return 'common';
  }
}
