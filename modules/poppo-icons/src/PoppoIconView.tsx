import { requireNativeView } from 'expo';
import * as React from 'react';

import type { PoppoIconViewProps } from './PoppoIcon.types';

let nativeView: React.ComponentType<PoppoIconViewProps> | null | undefined;

function getNativeView(): React.ComponentType<PoppoIconViewProps> | null {
  if (nativeView !== undefined) {
    return nativeView ?? null;
  }
  try {
    nativeView = requireNativeView<PoppoIconViewProps>('PoppoIcons', 'PoppoIcon');
  } catch {
    nativeView = null;
  }
  return nativeView ?? null;
}

export default function PoppoIconView({ name, size = 24, color = '#FFFFFF', style }: PoppoIconViewProps) {
  const Native = getNativeView();
  if (!Native) {
    return null;
  }
  return (
    <Native
      name={name}
      size={size}
      color={color}
      style={[{ width: size, height: size }, style]}
    />
  );
}
