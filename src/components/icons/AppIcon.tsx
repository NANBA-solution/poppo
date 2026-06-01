import { AppIconFallback } from '@/components/icons/AppIconFallback';
import type { AppIconProps, IconName } from '@/components/icons/types';
import { colors } from '@/theme/tokens';
import { isSvgNativeAvailable } from '@/utils/nativeAvailability';
import * as React from 'react';

export type { AppIconProps, IconName };

type IconRenderer = React.ComponentType<AppIconProps>;

let svgRenderer: IconRenderer | null | undefined;

function getSvgRenderer(): IconRenderer | null {
  if (svgRenderer !== undefined) {
    return svgRenderer;
  }
  if (!isSvgNativeAvailable()) {
    svgRenderer = null;
    return svgRenderer;
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    svgRenderer = require('./AppIconSvg').AppIconSvg as IconRenderer;
  } catch {
    svgRenderer = null;
  }
  return svgRenderer;
}

/**
 * アイコン表示（Lucide 系 SVG → Ionicons フォールバック）
 */
export function AppIcon({ name, size = 24, color = colors.text }: AppIconProps) {
  const Svg = getSvgRenderer();
  if (Svg) {
    return <Svg name={name} size={size} color={color} />;
  }
  return <AppIconFallback name={name} size={size} color={color} />;
}
