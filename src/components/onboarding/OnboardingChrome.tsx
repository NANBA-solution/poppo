import { borders, colors, radii, shadow, typography } from '@/theme/tokens';
import * as React from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

export function OnboardingProgress({ total, index }: { total: number; index: number }) {
  return (
    <View style={styles.progressRow}>
      {Array.from({ length: total }, (_, i) => (
        <View key={i} style={[styles.progressSeg, i <= index && styles.progressSegActive]} />
      ))}
    </View>
  );
}

export function OnboardingPrimaryButton({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.primary, pressed && styles.pressed]}>
      <Text style={styles.primaryLabel}>{label}</Text>
    </Pressable>
  );
}

export function OnboardingGhostButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.ghost, pressed && styles.pressed]}>
      <Text style={styles.ghostLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  progressRow: {
    flexDirection: 'row',
    gap: 8,
    alignSelf: 'center',
  },
  progressSeg: {
    height: 4,
    width: 24,
    borderRadius: radii.pill,
    backgroundColor: colors.border,
  },
  progressSegActive: {
    backgroundColor: colors.ink,
    width: 36,
  },
  primary: {
    backgroundColor: colors.ink,
    paddingVertical: 17,
    borderRadius: radii.pill,
    alignItems: 'center',
    ...shadow.floating,
    ...(Platform.OS === 'web' ? { cursor: 'pointer' as const } : {}),
  },
  primaryLabel: {
    ...typography.button,
    color: colors.onAccent,
  },
  ghost: {
    paddingVertical: 12,
    alignItems: 'center',
    ...(Platform.OS === 'web' ? { cursor: 'pointer' as const } : {}),
  },
  ghostLabel: {
    color: colors.textMuted,
    fontSize: 15,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
});
