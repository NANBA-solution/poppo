import type { CardImageFraming } from '@/types/collection';

export const DEFAULT_CARD_IMAGE_FRAMING: CardImageFraming = {
  scale: 1,
  offsetX: 0,
  offsetY: 0,
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function normalizeCardImageFraming(
  raw?: Partial<CardImageFraming> | null,
): CardImageFraming {
  return {
    scale: clamp(raw?.scale ?? DEFAULT_CARD_IMAGE_FRAMING.scale, 1, 3),
    offsetX: clamp(raw?.offsetX ?? 0, -1, 1),
    offsetY: clamp(raw?.offsetY ?? 0, -1, 1),
  };
}

export function framingEquals(a: CardImageFraming, b: CardImageFraming): boolean {
  return a.scale === b.scale && a.offsetX === b.offsetX && a.offsetY === b.offsetY;
}
