import { colors, radii, shadow } from '@/theme/tokens';
import * as React from 'react';
import { Platform, Pressable, StyleSheet, View, type ViewStyle } from 'react-native';

type GlassCardProps = {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  highlighted?: boolean;
};

export function GlassCard({ children, onPress, style, highlighted }: GlassCardProps) {
  const cardStyle = [
    styles.card,
    highlighted && styles.cardHighlighted,
    style,
  ];

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [cardStyle, pressed && styles.pressed]}
      >
        {children}
      </Pressable>
    );
  }

  return <View style={cardStyle}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSolid,
    padding: 14,
    ...shadow.card,
  },
  cardHighlighted: {
    borderColor: colors.borderStrong,
    backgroundColor: '#1a2438',
  },
  pressed: {
    transform: [{ scale: 0.985 }],
    backgroundColor: colors.surfaceHoverSolid,
  },
});
