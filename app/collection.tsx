import { PigeonCard } from '@/components/PigeonCard';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { formatMessage } from '@/i18n/format';
import { useI18n } from '@/i18n/I18nProvider';
import { useTabRouter } from '@/hooks/useTabRouter';
import { getPigeonCollection } from '@/services/collectionService';
import { useCollectionGoal } from '@/hooks/useCollectionGoal';
import { getDexCompletion } from '@/services/dexService';
import { getPlayerTitle } from '@/services/titleService';
import { colors, spacing } from '@/theme/tokens';
import { isHighRarity } from '@/services/rarityService';
import type { CardRarity, PigeonEntry } from '@/types/collection';
import { useFocusEffect } from 'expo-router';
import * as React from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
  type ListRenderItem,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type CollectionRow = PigeonEntry & { scanNo: number };

function toCollectionRows(entries: PigeonEntry[]): CollectionRow[] {
  return entries.map((entry, index) => ({
    ...entry,
    scanNo: entries.length - index,
    rarity: entry.rarity ?? 'N',
  }));
}

type CollectionCardProps = {
  item: CollectionRow;
  onPressEntry: (id: string) => void;
};

const CollectionCard = React.memo(function CollectionCard({
  item,
  onPressEntry,
}: CollectionCardProps) {
  const handlePress = React.useCallback(() => {
    onPressEntry(item.id);
  }, [item.id, onPressEntry]);

  return (
    <View style={styles.cardCell}>
      <PigeonCard
        entryId={item.id}
        imageUri={item.imageUri}
        scanNo={item.scanNo}
        rarity={item.rarity as CardRarity}
        flavorIndex={item.flavorIndex ?? 0}
        imageFraming={item.imageFraming}
        size="grid"
        onPress={handlePress}
      />
    </View>
  );
});

export default function CollectionScreen() {
  const router = useTabRouter();
  const insets = useSafeAreaInsets();
  const { t } = useI18n();
  const [initialLoading, setInitialLoading] = React.useState(true);
  const [entries, setEntries] = React.useState<PigeonEntry[]>([]);
  const hasLoadedRef = React.useRef(false);

  useFocusEffect(
    React.useCallback(() => {
      let alive = true;
      void getPigeonCollection().then((data) => {
        if (!alive) return;
        setEntries(data);
        if (!hasLoadedRef.current) {
          hasLoadedRef.current = true;
          setInitialLoading(false);
        }
      });
      return () => {
        alive = false;
      };
    }, []),
  );

  const rows = React.useMemo(() => toCollectionRows(entries), [entries]);
  const collectionGoal = useCollectionGoal(entries.length);
  const completion = React.useMemo(
    () => getDexCompletion(entries, collectionGoal),
    [collectionGoal, entries],
  );
  const playerTitle = React.useMemo(
    () => getPlayerTitle(entries.length, t),
    [entries.length, t],
  );
  const rareCount = React.useMemo(
    () => entries.filter((entry) => entry.rarity && isHighRarity(entry.rarity)).length,
    [entries],
  );

  const openEntry = React.useCallback(
    (id: string) => {
      router.push({ pathname: '/entry/[id]', params: { id } });
    },
    [router],
  );

  const renderItem = React.useCallback<ListRenderItem<CollectionRow>>(
    ({ item }) => <CollectionCard item={item} onPressEntry={openEntry} />,
    [openEntry],
  );

  const listHeader = React.useMemo(
    () => (
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
    ),
    [
      completion.current,
      completion.goal,
      completion.percent,
      entries.length,
      playerTitle.subtitle,
      playerTitle.title,
      rareCount,
      t.profile.collectionStatus,
      t.profile.rareSummary,
    ],
  );

  const listEmpty = React.useMemo(
    () => <Text style={styles.empty}>{t.profile.collectionEmpty}</Text>,
    [t.profile.collectionEmpty],
  );

  return (
    <Screen edges={false} pigeons={false}>
      <View style={{ paddingTop: insets.top }}>
        <ScreenHeader title={t.profile.collectionTitle} />
      </View>

      {initialLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(item) => item.id}
          numColumns={2}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews
          initialNumToRender={4}
          maxToRenderPerBatch={2}
          windowSize={3}
          updateCellsBatchingPeriod={80}
          columnWrapperStyle={rows.length > 0 ? styles.row : undefined}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + 24 },
          ]}
          ListHeaderComponent={listHeader}
          ListEmptyComponent={listEmpty}
          renderItem={renderItem}
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
