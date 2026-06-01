import { ICON_GLYPHS } from '@/components/icons/iconGlyphs';
import { IconSvgRenderer } from '@/components/icons/IconSvgRenderer';
import type { AppIconProps } from '@/components/icons/types';
import * as React from 'react';

export function AppIconSvg({ name, size = 24, color = '#FFFFFF' }: AppIconProps) {
  const glyph = ICON_GLYPHS[name];
  if (!glyph) {
    return null;
  }
  return <IconSvgRenderer glyph={glyph} size={size} color={color} />;
}
