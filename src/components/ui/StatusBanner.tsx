import { borders, colors, radii } from '@/theme/tokens';
import * as React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type StatusBannerVariant = 'accent' | 'gold' | 'success';

type StatusBannerProps = {
  text: string;
  variant?: StatusBannerVariant;
  onPress?: () => void;
  accessibilityLabel?: string;
};

const variantStyles: Record<
  StatusBannerVariant,
  { bg: string; border: string; text: string }
> = {
  accent: {
    bg: colors.accentSoft,
    border: colors.borderStrong,
    text: colors.text,
  },
  gold: {
    bg: colors.goldSoft,
    border: colors.gold,
    text: colors.gold,
  },
  success: {
    bg: 'rgba(45,106,79,0.1)',
    border: colors.accentBright,
    text: colors.success,
  },
};

export function StatusBanner({
  text,
  variant = 'accent',
  onPress,
  accessibilityLabel,
}: StatusBannerProps) {
  const palette = variantStyles[variant];
  const content = (
    <Text style={[styles.text, { color: palette.text }]}>{text}</Text>
  );

  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        onPress={onPress}
        style={({ pressed }) => [
          styles.wrap,
          { backgroundColor: palette.bg, borderColor: palette.border },
          pressed && styles.pressed,
        ]}
      >
        {content}
      </Pressable>
    );
  }

  return (
    <View
      style={[
        styles.wrap,
        { backgroundColor: palette.bg, borderColor: palette.border },
      ]}
    >
      <Text style={[styles.text, { color: palette.text }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: 20,
    marginBottom: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: radii.md,
    borderWidth: borders.medium,
  },
  text: {
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  pressed: { opacity: 0.9 },
});
