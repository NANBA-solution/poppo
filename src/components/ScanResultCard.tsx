import { useI18n } from '@/i18n/I18nProvider';
import { colors, radii } from '@/theme/tokens';
import * as React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

type ScanResultCardProps = {
  phase: 'loading' | 'success' | 'error';
  breed?: string;
  nickname?: string;
  error?: string | null;
  subtitle?: string;
  showEyebrow?: boolean;
};

export function ScanResultCard({
  phase,
  breed,
  nickname,
  error,
  subtitle,
  showEyebrow = true,
}: ScanResultCardProps) {
  const { t } = useI18n();

  if (phase === 'loading') {
    return (
      <View style={[styles.card, styles.cardRow]}>
        <ActivityIndicator color={colors.accent} />
        <Text style={styles.cardHint}>{t.scan.loading}</Text>
      </View>
    );
  }

  if (phase === 'success' && breed && nickname) {
    return (
      <View style={styles.card}>
        {showEyebrow ? <Text style={styles.cardEyebrow}>{t.scan.eyebrow}</Text> : null}
        <Text style={styles.cardBreed}>{breed}</Text>
        <Text style={styles.cardNickname}>{nickname}</Text>
        {subtitle ? <Text style={styles.cardSubtitle}>{subtitle}</Text> : null}
      </View>
    );
  }

  if (phase === 'error') {
    return (
      <View style={[styles.card, styles.cardError]}>
        <Text style={styles.cardErrorTitle}>{t.scan.errorTitle}</Text>
        <Text style={styles.cardErrorBody}>{error ?? t.scan.errorFallback}</Text>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.lg,
    padding: 16,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    gap: 6,
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
    fontWeight: '600',
    opacity: 0.85,
  },
  cardEyebrow: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 3,
  },
  cardBreed: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
  },
  cardNickname: {
    color: colors.text,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600',
    opacity: 0.92,
  },
  cardSubtitle: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 4,
  },
  cardError: {
    borderColor: 'rgba(255,120,120,0.35)',
  },
  cardErrorTitle: {
    color: colors.danger,
    fontSize: 15,
    fontWeight: '800',
  },
  cardErrorBody: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 19,
  },
});
