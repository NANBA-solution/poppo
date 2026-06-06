import { useI18n } from '@/i18n/I18nProvider';
import type { AppLocale } from '@/services/localeService';
import { borders, colors, radii } from '@/theme/tokens';
import { hapticLight } from '@/utils/haptics';
import * as React from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

type LanguagePillsProps = {
  compact?: boolean;
};

export function LanguagePills({ compact = false }: LanguagePillsProps) {
  const { t, locale, setLocale } = useI18n();

  const setLanguage = React.useCallback(
    (next: AppLocale) => {
      if (next === locale) return;
      void hapticLight();
      void setLocale(next);
    },
    [locale, setLocale],
  );

  return (
    <View style={[styles.row, compact && styles.rowCompact]}>
      {(['ja', 'en'] as const).map((code) => {
        const active = locale === code;
        const label = code === 'ja' ? t.settings.languageJa : t.settings.languageEn;
        return (
          <Pressable
            key={code}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            onPress={() => setLanguage(code)}
            style={({ pressed }) => [
              styles.pill,
              compact && styles.pillCompact,
              active && styles.pillActive,
              pressed && styles.pressed,
            ]}
          >
            <Text style={[styles.label, active && styles.labelActive]}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  rowCompact: {
    gap: 6,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radii.pill,
    borderWidth: borders.thin,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surfaceSolid,
    ...(Platform.OS === 'web' ? { cursor: 'pointer' as const } : {}),
  },
  pillCompact: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  pillActive: {
    backgroundColor: colors.ink,
    borderColor: colors.ink,
  },
  label: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '700',
  },
  labelActive: {
    color: colors.onAccent,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
});
