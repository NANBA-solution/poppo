import { AppIcon, type IconName } from '@/components/icons/AppIcon';
import { colors, radii, shadow } from '@/theme/tokens';
import * as React from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

type FloatingPillProps = {
  label: string;
  onPress?: () => void;
  active?: boolean;
  badge?: string | number;
  icon?: IconName;
};

export function FloatingPill({ label, onPress, active, badge, icon }: FloatingPillProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.pill,
        active && styles.pillActive,
        pressed && styles.pressed,
        Platform.OS === 'web' && styles.webHover,
      ]}
    >
      {icon ? (
        <AppIcon name={icon} size={18} color={active ? colors.accent : colors.text} />
      ) : null}
      <Text style={[styles.label, active && styles.labelActive]}>{label}</Text>
      {badge != null ? <Text style={styles.badge}>{badge}</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radii.pill,
    backgroundColor: colors.pillSolid,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    ...shadow.floating,
    ...(Platform.OS === 'web' ? { cursor: 'pointer' as const } : {}),
  },
  pillActive: {
    borderColor: colors.borderStrong,
    backgroundColor: colors.accentSoft,
  },
  label: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  labelActive: {
    color: colors.accent,
  },
  badge: {
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    borderRadius: 10,
    overflow: 'hidden',
    textAlign: 'center',
    textAlignVertical: 'center',
    backgroundColor: colors.accent,
    color: colors.onAccent,
    fontSize: 11,
    fontWeight: '800',
  },
  pressed: {
    transform: [{ scale: 0.97 }],
  },
  webHover: {
    // @ts-expect-error web-only
    transition: 'transform 120ms ease',
  },
});
