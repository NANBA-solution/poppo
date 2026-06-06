import { AppIcon, type IconName } from '@/components/icons/AppIcon';
import { borders, colors, radii, shadow } from '@/theme/tokens';
import * as React from 'react';
import {
  Image,
  type ImageSourcePropType,
  type ImageStyle,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

type FloatingPillProps = {
  label: string;
  onPress?: () => void;
  active?: boolean;
  badge?: string | number;
  icon?: IconName;
  imageIcon?: ImageSourcePropType;
  /** カメラ上など暗い背景用 */
  variant?: 'paper' | 'dark';
};

export function FloatingPill({
  label,
  onPress,
  active,
  badge,
  icon,
  imageIcon,
  variant = 'paper',
}: FloatingPillProps) {
  const isDark = variant === 'dark';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.pill,
        isDark ? styles.pillDark : styles.pillPaper,
        active && (isDark ? styles.pillDarkActive : styles.pillPaperActive),
        pressed && styles.pressed,
        Platform.OS === 'web' && styles.webHover,
      ]}
    >
      {imageIcon ? (
        <Image source={imageIcon} style={imageIconStyle} resizeMode="cover" />
      ) : icon ? (
        <AppIcon
          name={icon}
          size={18}
          color={isDark ? colors.onAccent : active ? colors.ink : colors.ink}
        />
      ) : null}
      <Text
        style={[
          styles.label,
          isDark ? styles.labelDark : styles.labelPaper,
          active && !isDark && styles.labelActive,
        ]}
      >
        {label}
      </Text>
      {badge != null ? (
        <View style={[styles.badge, isDark && styles.badgeDark]}>
          <Text style={[styles.badgeText, isDark && styles.badgeTextDark]}>{badge}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const imageIconStyle: ImageStyle = {
  width: 24,
  height: 24,
  borderRadius: 8,
};

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radii.pill,
    borderWidth: borders.thin,
    ...shadow.subtle,
    ...(Platform.OS === 'web' ? { cursor: 'pointer' as const } : {}),
  },
  pillPaper: {
    backgroundColor: colors.surfaceSolid,
    borderColor: colors.border,
  },
  pillPaperActive: {
    backgroundColor: colors.accentSoft,
    borderColor: colors.borderStrong,
  },
  pillDark: {
    backgroundColor: 'rgba(26,26,26,0.88)',
    borderColor: 'rgba(255,255,255,0.12)',
  },
  pillDarkActive: {
    backgroundColor: '#2A2A2A',
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
  },
  labelPaper: {
    color: colors.ink,
  },
  labelDark: {
    color: colors.onAccent,
  },
  labelActive: {
    color: colors.ink,
  },
  badge: {
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.ink,
  },
  badgeDark: {
    backgroundColor: colors.onAccent,
  },
  badgeText: {
    color: colors.onAccent,
    fontSize: 11,
    fontWeight: '800',
  },
  badgeTextDark: {
    color: colors.ink,
  },
  pressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.94,
  },
  webHover: {
    // @ts-expect-error web-only
    transition: 'transform 120ms ease',
  },
});
