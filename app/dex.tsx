import { GlassCard } from '@/components/ui/GlassCard';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { formatMessage } from '@/i18n/format';
import { useI18n } from '@/i18n/I18nProvider';
import { getPigeonCollection } from '@/services/collectionService';
import { buildDex, getDexCompletion } from '@/services/dexService';
import { getPlayerTitle } from '@/services/titleService';
import { colors, radii, spacing } from '@/theme/tokens';
import type { PigeonEntry } from '@/types/collection';
import { useFocusEffect } from 'expo-router';
import * as React from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function DexScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useI18n();
  const [loading, setLoading] = React.useState(true);
  const [entries, setEntries] = React.useState<PigeonEntry[]>([]);

  useFocusEffect(
    React.useCallback(() => {
      let active = true;
      setLoading(true);
      void getPigeonCollection().then((data) => {
        if (!active) return;
        setEntries(data);
        setLoading(false);
      });
      return () => {
        active = false;
      };
    }, []),
  );

  const dex = React.useMemo(() => buildDex(entries), [entries]);
  const completion = getDexCompletion(entries);
  const playerTitle = getPlayerTitle(entries.length, 0, t);

  return (
    <Screen edges={false}>
      <View style={{ paddingTop: insets.top }}>
        <ScreenHeader title={t.profile.dexTitle} />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}>
          <GlassCard style={styles.hero} highlighted>
            <Text style={styles.heroTitle}>{playerTitle.title}</Text>
            <Text style={styles.heroSub}>{playerTitle.subtitle}</Text>
            <Text style={styles.heroProgress}>
              {formatMessage(t.profile.dexProgress, {
                discovered: completion.discovered,
                goal: completion.goal,
                percent: completion.percent,
              })}
            </Text>
          </GlassCard>

          {dex.length === 0 ? (
            <Text style={styles.empty}>{t.profile.dexEmpty}</Text>
          ) : (
            dex.map((item) => (
              <GlassCard key={item.breed} style={styles.card}>
                <Image source={{ uri: item.sampleImageUri }} style={styles.thumb} />
                <View style={styles.cardBody}>
                  <Text style={styles.breed}>{item.breed}</Text>
                  <Text style={styles.nickname} numberOfLines={2}>
                    {item.latestNickname}
                  </Text>
                  <Text style={styles.meta}>
                    {formatMessage(t.profile.dexCount, { count: item.count })} ·{' '}
                    {t.profile.dexFirstSeen}
                  </Text>
                </View>
              </GlassCard>
            ))
          )}
        </ScrollView>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  hero: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    gap: 6,
  },
  heroTitle: { color: colors.gold, fontSize: 20, fontWeight: '800' },
  heroSub: { color: colors.textMuted, fontSize: 14 },
  heroProgress: { color: colors.accent, fontSize: 13, fontWeight: '700', marginTop: 4 },
  empty: {
    color: colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: 24,
    fontSize: 14,
    lineHeight: 21,
  },
  card: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    gap: 12,
    padding: 12,
  },
  thumb: {
    width: 72,
    height: 72,
    borderRadius: radii.sm,
    backgroundColor: colors.bgElevated,
  },
  cardBody: { flex: 1, justifyContent: 'center', gap: 4 },
  breed: { color: colors.text, fontSize: 16, fontWeight: '800' },
  nickname: { color: colors.text, fontSize: 13, lineHeight: 18, opacity: 0.85 },
  meta: { color: colors.textMuted, fontSize: 12 },
});
