import { GlassCard } from '@/components/ui/GlassCard';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { formatMessage } from '@/i18n/format';
import { formatScanLabel } from '@/utils/scanLabel';
import { useI18n } from '@/i18n/I18nProvider';
import { useTabRouter } from '@/hooks/useTabRouter';
import { getPigeonCollection } from '@/services/collectionService';
import { useCollectionGoal } from '@/hooks/useCollectionGoal';
import { getDexCompletion } from '@/services/dexService';
import { getPlayerTitle } from '@/services/titleService';
import { colors, radii, spacing } from '@/theme/tokens';
import { formatShortDateTime } from '@/utils/formatDate';
import type { PigeonEntry } from '@/types/collection';
import { useFocusEffect } from 'expo-router';
import * as React from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function CollectionScreen() {
  const router = useTabRouter();
  const insets = useSafeAreaInsets();
  const { t, locale } = useI18n();
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

  const collectionGoal = useCollectionGoal(entries.length);
  const completion = getDexCompletion(entries, collectionGoal);
  const playerTitle = getPlayerTitle(entries.length, t);

  return (
    <Screen edges={false}>
      <View style={{ paddingTop: insets.top }}>
        <ScreenHeader title={t.profile.collectionTitle} />
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
              {formatMessage(t.profile.collectionStatus, {
                current: completion.current,
                goal: completion.goal,
                percent: completion.percent,
              })}
            </Text>
          </GlassCard>

          {entries.length === 0 ? (
            <Text style={styles.empty}>{t.profile.collectionEmpty}</Text>
          ) : (
            entries.map((item, index) => {
              const scanNo = entries.length - index;
              return (
                <Pressable
                  key={item.id}
                  accessibilityRole="button"
                  onPress={() =>
                    router.push({ pathname: '/entry/[id]', params: { id: item.id } })
                  }
                >
                  <GlassCard style={styles.card}>
                    <Image source={{ uri: item.imageUri }} style={styles.thumb} />
                    <View style={styles.cardBody}>
                      <Text style={styles.scanNo}>
                        {formatScanLabel(scanNo, t)}
                      </Text>
                      <Text style={styles.meta}>
                        {formatShortDateTime(item.scannedAt, locale)}
                      </Text>
                    </View>
                  </GlassCard>
                </Pressable>
              );
            })
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
  heroTitle: { color: colors.ink, fontSize: 20, fontWeight: '900' },
  heroSub: { color: colors.textMuted, fontSize: 14 },
  heroProgress: { color: colors.accentBright, fontSize: 13, fontWeight: '800', marginTop: 4 },
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
  scanNo: { color: colors.text, fontSize: 16, fontWeight: '800' },
  meta: { color: colors.textMuted, fontSize: 12 },
});
