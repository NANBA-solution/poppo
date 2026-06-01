import { AppIcon } from '@/components/icons/AppIcon';
import { useI18n } from '@/i18n/I18nProvider';
import { colors, radii } from '@/theme/tokens';
import { useRouter } from 'expo-router';
import * as React from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

type ScreenHeaderProps = {
  title: string;
  right?: React.ReactNode;
  showBack?: boolean;
};

export function ScreenHeader({ title, right, showBack = true }: ScreenHeaderProps) {
  const router = useRouter();
  const { t } = useI18n();

  return (
    <View style={styles.row}>
      {showBack ? (
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
        >
          <AppIcon name="chevron-left" size={18} color={colors.accent} />
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
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(255,255,255,0.06)',
    ...(Platform.OS === 'web' ? { cursor: 'pointer' as const } : {}),
  },
  backSpacer: { minWidth: 72 },
  backLabel: {
    color: colors.accent,
    fontSize: 15,
    fontWeight: '700',
  },
  title: {
    flex: 1,
    textAlign: 'center',
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
});
