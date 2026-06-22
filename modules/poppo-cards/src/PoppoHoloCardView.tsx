import { requireNativeView } from 'expo';
import * as React from 'react';
import { Platform } from 'react-native';

import type { PoppoHoloCardViewProps } from './PoppoHoloCard.types';

let nativeView: React.ComponentType<PoppoHoloCardViewProps> | null | undefined;

function getNativeView(): React.ComponentType<PoppoHoloCardViewProps> | null {
  if (nativeView !== undefined) {
    return nativeView ?? null;
  }
  if (Platform.OS !== 'ios') {
    nativeView = null;
    return null;
  }
  try {
    nativeView = requireNativeView<PoppoHoloCardViewProps>('PoppoCards', 'PoppoHoloCard');
  } catch {
    nativeView = null;
  }
  return nativeView ?? null;
}

export default function PoppoHoloCardView({
  layout = 'single',
  rarity = 'common',
  leftRarity = 'common',
  centerRarity = 'rare',
  rightRarity = 'legendary',
  style,
  ...rest
}: PoppoHoloCardViewProps) {
  const Native = getNativeView();
  if (!Native) {
    return null;
  }

  return (
    <Native
      layout={layout}
      rarity={rarity}
      leftRarity={leftRarity}
      centerRarity={centerRarity}
      rightRarity={rightRarity}
      {...rest}
      style={[{ flex: 1, width: '100%', height: '100%' }, style]}
    />
  );
}
