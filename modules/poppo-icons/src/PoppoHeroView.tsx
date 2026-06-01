import { requireNativeView } from 'expo';
import * as React from 'react';
import { type StyleProp, type ViewStyle } from 'react-native';

export type PoppoHeroScene = 'scan' | 'ai' | 'collection' | 'welcome';

export type PoppoHeroViewProps = {
  scene: PoppoHeroScene;
  accentColor?: string;
  style?: StyleProp<ViewStyle>;
};

let nativeView: React.ComponentType<PoppoHeroViewProps> | null | undefined;

function getNativeView(): React.ComponentType<PoppoHeroViewProps> | null {
  if (nativeView !== undefined) {
    return nativeView ?? null;
  }
  try {
    nativeView = requireNativeView<PoppoHeroViewProps>('PoppoIcons', 'PoppoHero');
  } catch {
    nativeView = null;
  }
  return nativeView ?? null;
}

export default function PoppoHeroView({
  scene,
  accentColor = '#a78bfa',
  style,
}: PoppoHeroViewProps) {
  const Native = getNativeView();
  if (!Native) {
    return null;
  }
  return <Native scene={scene} accentColor={accentColor} style={[{ width: 280, height: 280 }, style]} />;
}
