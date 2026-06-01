import type { AppIconProps, IconName } from '@/components/icons/types';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as React from 'react';

type IonName = React.ComponentProps<typeof Ionicons>['name'];

const ICON_MAP: Record<IconName, IonName> = {
  pigeon: 'ellipse-outline',
  camera: 'camera-outline',
  brain: 'bulb-outline',
  book: 'book-outline',
  feed: 'chatbubbles-outline',
  settings: 'settings-outline',
  trophy: 'trophy-outline',
  heart: 'heart',
  'heart-outline': 'heart-outline',
  flash: 'flash',
  'flash-auto': 'flash-outline',
  'chevron-right': 'chevron-forward',
  'chevron-left': 'chevron-back',
  instagram: 'logo-instagram',
  'x-logo': 'close',
  egg: 'egg-outline',
  bird: 'leaf-outline',
  moon: 'moon-outline',
  sparkle: 'sparkles-outline',
  search: 'search-outline',
  crown: 'ribbon-outline',
  check: 'checkmark',
  report: 'flag-outline',
  target: 'locate-outline',
  sound: 'volume-high-outline',
};

/** react-native-svg 未同梱ビルド用（Expo 同梱の Ionicons） */
export function AppIconFallback({ name, size = 24, color }: AppIconProps) {
  return <Ionicons name={ICON_MAP[name]} size={size} color={color} />;
}
