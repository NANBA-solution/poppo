import { AppIcon } from '@/components/icons/AppIcon';
import { useI18n } from '@/i18n/I18nProvider';
import { borders, colors, radii, shadow } from '@/theme/tokens';
import { useTabRouter } from '@/hooks/useTabRouter';
import * as React from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

type ScreenHeaderProps = {
  title: string;
  right?: React.ReactNode;
  showBack?: boolean;
};

export function ScreenHeader({ title, right, showBack = true }: ScreenHeaderProps) {
  const router = useTabRouter();
  const { t } = useI18n();

  return (
    <View style={styles.row}>
      {showBack ? (
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
        >
          <AppIcon name="chevron-left" size={18} color={colors.ink} />
          <Text style={styles.backLabel}>{t.common.back}</Text>
        </Pressable>
      ) : (
        <View style={styles.backSpacer} />
      )}
      <Text style={styles.title}>{title}</Text>
      {right ?? <View style={styles.backSpacer} />}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minWidth: 72,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceSolid,
    borderWidth: borders.thin,
    borderColor: colors.border,
    ...shadow.subtle,
    ...(Platform.OS === 'web' ? { cursor: 'pointer' as const } : {}),
  },
  backSpacer: { minWidth: 72 },
  backLabel: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: '700',
  },
  title: {
    flex: 1,
    textAlign: 'center',
    color: colors.text,
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
});
