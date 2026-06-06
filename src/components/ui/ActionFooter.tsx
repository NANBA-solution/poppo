import { borders, colors, radii, shadow } from '@/theme/tokens';
import * as React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type ActionFooterProps = {
  children: React.ReactNode;
  style?: ViewStyle;
};

export function ActionFooter({ children, style }: ActionFooterProps) {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        styles.footer,
        { paddingBottom: Math.max(insets.bottom, 16) },
        style,
      ]}
    >
      {children}
    </View>
  );
}

type FooterButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  flex?: number;
  accessibilityLabel?: string;
};

export function FooterButton({
  label,
  onPress,
  disabled,
  loading,
  variant = 'primary',
  flex = 1,
  accessibilityLabel,
}: FooterButtonProps) {
  const variantStyle =
    variant === 'primary'
      ? styles.primaryBtn
      : variant === 'danger'
        ? styles.dangerBtn
        : variant === 'ghost'
          ? styles.ghostBtn
          : styles.secondaryBtn;

  const labelStyle =
    variant === 'primary'
      ? styles.primaryLabel
      : variant === 'danger'
        ? styles.dangerLabel
        : variant === 'ghost'
          ? styles.ghostLabel
          : styles.secondaryLabel;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.btn,
        variantStyle,
        { flex },
        pressed && styles.pressed,
        (disabled || loading) && styles.disabled,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? colors.onAccent : colors.ink} />
      ) : (
        <Text style={labelStyle}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  footer: {
    paddingHorizontal: 20,
    paddingTop: 14,
    borderTopWidth: borders.thin,
    borderTopColor: colors.border,
    backgroundColor: colors.surfaceSolid,
    gap: 10,
    ...shadow.subtle,
  },
  btn: {
    paddingVertical: 16,
    borderRadius: radii.pill,
    alignItems: 'center',
    minHeight: 52,
    justifyContent: 'center',
    borderWidth: borders.thin,
  },
  primaryBtn: {
    backgroundColor: colors.ink,
    borderColor: colors.ink,
    ...shadow.floating,
  },
  primaryLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.onAccent,
    letterSpacing: 0.2,
  },
  secondaryBtn: {
    backgroundColor: colors.surfaceSolid,
    borderColor: colors.borderStrong,
  },
  secondaryLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.ink,
  },
  dangerBtn: {
    backgroundColor: colors.dangerSoft,
    borderColor: colors.danger,
  },
  dangerLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.danger,
  },
  ghostBtn: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
  },
  ghostLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textMuted,
  },
  pressed: { opacity: 0.92, transform: [{ scale: 0.99 }] },
  disabled: { opacity: 0.45 },
});
