import { colors, radii } from '@/theme/tokens';
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
        <ActivityIndicator color={variant === 'primary' ? colors.onAccent : colors.accent} />
      ) : (
        <Text style={labelStyle}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.bgElevated,
    gap: 10,
  },
  btn: {
    paddingVertical: 16,
    borderRadius: radii.md,
    alignItems: 'center',
    minHeight: 52,
    justifyContent: 'center',
  },
  primaryBtn: {
    backgroundColor: colors.accent,
  },
  primaryLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.onAccent,
  },
  secondaryBtn: {
    backgroundColor: colors.accentSoft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderStrong,
  },
  secondaryLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.gold,
  },
  dangerBtn: {
    backgroundColor: colors.dangerSoft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,120,120,0.35)',
    paddingHorizontal: 24,
  },
  dangerLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.danger,
  },
  ghostBtn: {
    backgroundColor: colors.text,
  },
  ghostLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111',
  },
  pressed: { opacity: 0.9 },
  disabled: { opacity: 0.45 },
});
