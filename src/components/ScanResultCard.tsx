import * as React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

type ScanResultCardProps = {
  phase: 'loading' | 'success' | 'error';
  breed?: string;
  nickname?: string;
  error?: string | null;
  subtitle?: string;
};

export function ScanResultCard({
  phase,
  breed,
  nickname,
  error,
  subtitle,
}: ScanResultCardProps) {
  if (phase === 'loading') {
    return (
      <View style={[styles.card, styles.cardRow]}>
        <ActivityIndicator color="#c9d6ee" />
        <Text style={styles.cardHint}>Claude がハトを判定中…</Text>
      </View>
    );
  }

  if (phase === 'success' && breed && nickname) {
    return (
      <View style={styles.card}>
        <Text style={styles.cardEyebrow}>POPPO SCAN</Text>
        <Text style={styles.cardBreed}>{breed}</Text>
        <Text style={styles.cardNickname}>{nickname}</Text>
        {subtitle ? <Text style={styles.cardSubtitle}>{subtitle}</Text> : null}
      </View>
    );
  }

  if (phase === 'error') {
    return (
      <View style={[styles.card, styles.cardError]}>
        <Text style={styles.cardErrorTitle}>判定できませんでした</Text>
        <Text style={styles.cardErrorBody}>{error ?? '時間をおいて再試行してください。'}</Text>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    backgroundColor: 'rgba(13,17,26,0.9)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.15)',
    gap: 6,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardHint: {
    flex: 1,
    color: 'rgba(244,247,250,0.85)',
    fontSize: 14,
    fontWeight: '600',
  },
  cardEyebrow: {
    color: 'rgba(201,214,238,0.75)',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 3,
  },
  cardBreed: {
    color: '#F4F7FA',
    fontSize: 20,
    fontWeight: '800',
  },
  cardNickname: {
    color: 'rgba(244,247,250,0.92)',
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600',
  },
  cardSubtitle: {
    color: 'rgba(201,214,238,0.55)',
    fontSize: 12,
    marginTop: 4,
  },
  cardError: {
    borderColor: 'rgba(255,120,120,0.35)',
  },
  cardErrorTitle: {
    color: '#ffb4b4',
    fontSize: 15,
    fontWeight: '800',
  },
  cardErrorBody: {
    color: 'rgba(244,247,250,0.78)',
    fontSize: 13,
    lineHeight: 19,
  },
});
