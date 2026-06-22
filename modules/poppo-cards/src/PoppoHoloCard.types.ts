import type { StyleProp, ViewStyle } from 'react-native';

export type HoloCardRarity = 'common' | 'rare' | 'legendary';

export type HoloCardLayout = 'single' | 'trio';

export type PoppoHoloCardViewProps = {
  imageUri?: string;
  leftImageUri?: string;
  centerImageUri?: string;
  rightImageUri?: string;
  rarity?: HoloCardRarity;
  leftRarity?: HoloCardRarity;
  centerRarity?: HoloCardRarity;
  rightRarity?: HoloCardRarity;
  layout?: HoloCardLayout;
  cardName?: string;
  rarityLabel?: string;
  serial?: string;
  starCount?: number;
  move1Name?: string;
  move1Damage?: string;
  move2Name?: string;
  move2Damage?: string;
  moveDescription?: string;
  flavor?: string;
  showMove2?: boolean;
  showMoveDesc?: boolean;
  style?: StyleProp<ViewStyle>;
};
