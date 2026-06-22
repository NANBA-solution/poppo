import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { PigeonCard } from '@/components/PigeonCard';
import { formatMessage } from '@/i18n/format';
import { useI18n } from '@/i18n/I18nProvider';
import { useTabRouter } from '@/hooks/useTabRouter';
import { getPigeonCollection } from '@/services/collectionService';
import { useCollectionGoal } from '@/hooks/useCollectionGoal';
import { getDexCompletion } from '@/services/dexService';
import { getPlayerTitle } from '@/services/titleService';
import { colors, spacing } from '@/theme/tokens';
import { isHighRarity } from '@/services/rarityService';
import type { PigeonEntry } from '@/types/collection';
import { useFocusEffect } from 'expo-router';
import * as React from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function CollectionScreen() {
  const router = useTabRouter();
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

  const collectionGoal = useCollectionGoal(entries.length);
  const completion = getDexCompletion(entries, collectionGoal);
  const playerTitle = getPlayerTitle(entries.length, t);
  const rareCount = entries.filter(
    (entry) => entry.rarity && isHighRarity(entry.rarity),
  ).length;

  return (
    <Screen edges={false} pigeons={false}>
      <View style={{ paddingTop: insets.top }}>
        <ScreenHeader title={t.profile.collectionTitle} />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : (
        <FlatList
          data={entries}
          keyExtractor={(item) => item.id}
          numColumns={2}
          showsVerticalScrollIndicator={false}
          columnWrapperStyle={entries.length > 0 ? styles.row : undefined}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + 24 },
          ]}
          ListHeaderComponent={
            <View style={styles.hero}>
              <Text style={styles.heroTitle}>{playerTitle.title}</Text>
              <Text style={styles.heroSub}>{playerTitle.subtitle}</Text>
              <Text style={styles.heroProgress}>
                {formatMessage(t.profile.collectionStatus, {
                  current: completion.current,
                  goal: completion.goal,
                  percent: completion.percent,
                })}
              </Text>
              {entries.length > 0 ? (
                <Text style={styles.heroRare}>
                  {formatMessage(t.profile.rareSummary, {
                    count: String(rareCount),
                  })}
                </Text>
              ) : null}
            </View>
          }
          ListEmptyComponent={
            <Text style={styles.empty}>{t.profile.collectionEmpty}</Text>
          }
          renderItem={({ item, index }) => {
            const scanNo = entries.length - index;
            const rarity = item.rarity ?? 'N';
            const flavorIndex = item.flavorIndex ?? 0;
            return (
              <View style={styles.cardCell}>
                <PigeonCard
                  imageUri={item.imageUri}
                  scanNo={scanNo}
                  rarity={rarity}
                  flavorIndex={flavorIndex}
                  entryId={item.id}
                  imageFraming={item.imageFraming}
                  size="grid"
                  onPress={() =>
                    router.push({ pathname: '/entry/[id]', params: { id: item.id } })
                  }
                />
              </View>
            );
          }}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    gap: spacing.md,
  },
  row: {
    gap: spacing.sm,
  },
  hero: {
    marginBottom: spacing.sm,
    gap: 6,
    paddingHorizontal: spacing.xs,
  },
  heroTitle: { color: colors.ink, fontSize: 20, fontWeight: '900' },
  heroSub: { color: colors.textMuted, fontSize: 14 },
  heroProgress: {
    color: colors.accentBright,
    fontSize: 13,
    fontWeight: '800',
    marginTop: 4,
  },
  heroRare: {
    color: colors.accentPurple,
    fontSize: 12,
    fontWeight: '800',
  },
  empty: {
    color: colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: 24,
    fontSize: 14,
    lineHeight: 21,
  },
  cardCell: {
    flex: 1,
    maxWidth: '50%',
    paddingHorizontal: 2,
  },
});
