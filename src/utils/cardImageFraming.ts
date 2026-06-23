import type { CardImageFraming } from '@/types/collection';

export const MIN_CARD_IMAGE_SCALE = 0.35;
export const MAX_CARD_IMAGE_SCALE = 4;

export const DEFAULT_CARD_IMAGE_FRAMING: CardImageFraming = {
  scale: 1,
  offsetX: 0,
  offsetY: 0,
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function containImageSize(
  frameWidth: number,
  frameHeight: number,
  imageWidth: number,
  imageHeight: number,
): { width: number; height: number } {
  if (frameWidth <= 0 || frameHeight <= 0 || imageWidth <= 0 || imageHeight <= 0) {
    return { width: frameWidth, height: frameHeight };
  }
  const imageAspect = imageWidth / imageHeight;
  const frameAspect = frameWidth / frameHeight;
  if (imageAspect > frameAspect) {
    const width = frameWidth;
    return { width, height: width / imageAspect };
  }
  const height = frameHeight;
  return { width: height * imageAspect, height };
}

export function computeCardPhotoLayout(
  frameWidth: number,
  frameHeight: number,
  imageWidth: number,
  imageHeight: number,
  framing: CardImageFraming,
): { width: number; height: number; left: number; top: number } {
  const base = containImageSize(frameWidth, frameHeight, imageWidth, imageHeight);
  const width = base.width * framing.scale;
  const height = base.height * framing.scale;
  return {
    width,
    height,
    left: (frameWidth - width) / 2 + framing.offsetX * frameWidth * 0.5,
    top: (frameHeight - height) / 2 + framing.offsetY * frameHeight * 0.5,
  };
}

export function clampCardImageFraming(
  framing: CardImageFraming,
  frameWidth: number,
  frameHeight: number,
  imageWidth: number,
  imageHeight: number,
): CardImageFraming {
  const scale = clamp(framing.scale, MIN_CARD_IMAGE_SCALE, MAX_CARD_IMAGE_SCALE);
  const base = containImageSize(frameWidth, frameHeight, imageWidth, imageHeight);
  const displayW = base.width * scale;
  const displayH = base.height * scale;
  const maxOffsetX =
    frameWidth > 0 ? Math.abs(displayW - frameWidth) / (frameWidth * 0.5) : 1;
  const maxOffsetY =
    frameHeight > 0 ? Math.abs(displayH - frameHeight) / (frameHeight * 0.5) : 1;

  return {
    scale,
    offsetX: clamp(framing.offsetX, -maxOffsetX, maxOffsetX),
    offsetY: clamp(framing.offsetY, -maxOffsetY, maxOffsetY),
  };
}

export function normalizeCardImageFraming(
  raw?: Partial<CardImageFraming> | null,
): CardImageFraming {
  return {
    scale: clamp(raw?.scale ?? DEFAULT_CARD_IMAGE_FRAMING.scale, MIN_CARD_IMAGE_SCALE, MAX_CARD_IMAGE_SCALE),
    offsetX: raw?.offsetX ?? 0,
    offsetY: raw?.offsetY ?? 0,
  };
}

export function framingEquals(a: CardImageFraming, b: CardImageFraming): boolean {
  return a.scale === b.scale && a.offsetX === b.offsetX && a.offsetY === b.offsetY;
}
