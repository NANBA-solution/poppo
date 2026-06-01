import { colors, radii, shadow, typography } from '@/theme/tokens';
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
      <View style={styles.primaryShine} />
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
    gap: 6,
    alignSelf: 'center',
  },
  progressSeg: {
    height: 4,
    width: 28,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  progressSegActive: {
    backgroundColor: colors.accent,
    width: 40,
  },
  primary: {
    backgroundColor: colors.accent,
    paddingVertical: 17,
    borderRadius: radii.pill,
    alignItems: 'center',
    overflow: 'hidden',
    ...shadow.floating,
    ...(Platform.OS === 'web' ? { cursor: 'pointer' as const } : {}),
  },
  primaryShine: {
    position: 'absolute',
    top: 0,
    left: 24,
    right: 24,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.35)',
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
    transform: [{ scale: 0.985 }],
  },
});
