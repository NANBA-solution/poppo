import { useI18n } from '@/i18n/I18nProvider';
import { borders, colors, radii, shadow } from '@/theme/tokens';
import * as React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

type ScanResultCardProps = {
  phase: 'loading' | 'success' | 'error';
  breed?: string;
  error?: string | null;
  errorTitle?: string;
  subtitle?: string;
  showEyebrow?: boolean;
};

export function ScanResultCard({
  phase,
  breed,
  error,
  errorTitle,
  subtitle,
  showEyebrow = true,
}: ScanResultCardProps) {
  const { t } = useI18n();

  if (phase === 'loading') {
    return (
      <View style={[styles.card, styles.cardRow]}>
        <ActivityIndicator color={colors.ink} />
        <Text style={styles.cardHint}>{t.scan.recognizing}</Text>
      </View>
    );
  }

  if (phase === 'success') {
    return (
      <View style={styles.card}>
        {showEyebrow ? <Text style={styles.cardEyebrow}>{t.scan.eyebrow}</Text> : null}
        {breed ? <Text style={styles.cardBreed}>{breed}</Text> : null}
        <Text style={breed ? styles.cardSubtitle : styles.cardBreed}>
          {subtitle ?? t.scan.saved}
        </Text>
      </View>
    );
  }

  if (phase === 'error') {
    return (
      <View style={[styles.card, styles.cardError]}>
        <Text style={styles.cardErrorTitle}>{errorTitle ?? t.scan.errorTitle}</Text>
        <Text style={styles.cardErrorBody}>{error ?? t.scan.errorFallback}</Text>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.lg,
    padding: 18,
    backgroundColor: colors.surfaceSolid,
    borderWidth: borders.thin,
    borderColor: colors.border,
    gap: 6,
    ...shadow.card,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardHint: {
    flex: 1,
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  cardEyebrow: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 3,
  },
  cardBreed: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.2,
  },
  cardSubtitle: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 4,
    fontWeight: '600',
  },
  cardError: {
    borderColor: colors.danger,
    backgroundColor: colors.dangerSoft,
  },
  cardErrorTitle: {
    color: colors.danger,
    fontSize: 15,
    fontWeight: '900',
  },
  cardErrorBody: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 19,
  },
});
