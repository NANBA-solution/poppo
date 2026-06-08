import { useI18n } from '@/i18n/I18nProvider';
import { borders, colors, radii, shadow } from '@/theme/tokens';
import * as React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

type ScanResultCardProps = {
  phase: 'loading' | 'success' | 'error';
  headline?: string;
  error?: string | null;
  errorTitle?: string;
  subtitle?: string;
  showEyebrow?: boolean;
  /** UGC 向けの大きめカード */
  variant?: 'default' | 'ugc';
  eyebrow?: string;
};

export function ScanResultCard({
  phase,
  headline,
  error,
  errorTitle,
  subtitle,
  showEyebrow = true,
  variant = 'default',
  eyebrow,
}: ScanResultCardProps) {
  const { t } = useI18n();
  const isUgc = variant === 'ugc';

  if (phase === 'loading') {
    return (
      <View style={[styles.card, styles.cardRow]}>
        <ActivityIndicator color={colors.ink} />
        <Text style={styles.cardHint}>{t.scan.recognizing}</Text>
      </View>
    );
  }

  if (phase === 'success') {
    const eyebrowText = eyebrow ?? (isUgc ? t.profile.scanEntryEyebrow : t.scan.eyebrow);
    return (
      <View style={[styles.card, isUgc && styles.cardUgc]}>
        {showEyebrow ? (
          <Text style={[styles.cardEyebrow, isUgc && styles.cardEyebrowUgc]}>{eyebrowText}</Text>
        ) : null}
        {headline ? (
          <Text style={[styles.cardHeadline, isUgc && styles.cardHeadlineUgc]}>{headline}</Text>
        ) : null}
        <Text
          style={[
            headline ? styles.cardSubtitle : styles.cardHeadline,
            isUgc && styles.cardSubtitleUgc,
          ]}
        >
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
  cardHeadline: {
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
  cardUgc: {
    borderRadius: radii.xl,
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: 'rgba(255,255,255,0.94)',
    borderColor: 'rgba(26,26,26,0.06)',
    ...shadow.floating,
  },
  cardEyebrowUgc: {
    color: colors.accentPurple,
    letterSpacing: 2.4,
    fontSize: 10,
  },
  cardHeadlineUgc: {
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: -0.6,
  },
  cardSubtitleUgc: {
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
});
