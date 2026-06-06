import { getPigeonCollection } from '@/services/collectionService';
import { AppIcon } from '@/components/icons/AppIcon';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { formatMessage } from '@/i18n/format';
import { useI18n } from '@/i18n/I18nProvider';
import { borders, colors } from '@/theme/tokens';
import { formatShortDateTime } from '@/utils/formatDate';
import { getPlayerTitle } from '@/services/titleService';
import { getDexCompletion } from '@/services/dexService';
import type { PigeonEntry } from '@/types/collection';
import { hapticLight } from '@/utils/haptics';
import { useTabRouter } from '@/hooks/useTabRouter';
import { useFocusEffect } from 'expo-router';
import * as React from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type SortMode = 'newest' | 'oldest';

function sortEntries(entries: PigeonEntry[], sort: SortMode): PigeonEntry[] {
  if (sort === 'oldest') return [...entries].reverse();
  return [...entries];
}

export default function ProfileScreen() {
  const router = useTabRouter();
  const insets = useSafeAreaInsets();
  const { t, locale } = useI18n();

  const sortLabels: Record<SortMode, string> = React.useMemo(
    () => ({
      newest: t.profile.sortNewest,
      oldest: t.profile.sortOldest,
    }),
    [t.profile.sortNewest, t.profile.sortOldest],
  );
  const [entries, setEntries] = React.useState<PigeonEntry[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [sort, setSort] = React.useState<SortMode>('newest');

  const loadEntries = React.useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    const data = await getPigeonCollection();
    setEntries(data);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      void loadEntries();
    }, [loadEntries]),
  );

  const cycleSort = React.useCallback(() => {
    void hapticLight();
    setSort((current) => {
      const modes: SortMode[] = ['newest', 'oldest'];
      const idx = modes.indexOf(current);
      return modes[(idx + 1) % modes.length];
    });
  }, []);

  const dexCompletion = React.useMemo(() => getDexCompletion(entries), [entries]);
  const playerTitle = getPlayerTitle(entries.length, t);
  const visibleEntries = React.useMemo(
    () => sortEntries(entries, sort),
    [entries, sort],
  );
  const listHeader = (
    <>
      <View style={styles.hero}>
        <View style={styles.iconRing}>
          <Image
            source={require('../assets/brand-icon.png')}
            style={styles.brandIcon}
            resizeMode="cover"
          />
        </View>
        <Text style={styles.stageLabel}>{playerTitle.title}</Text>
        <Text style={styles.subtitleLabel}>{playerTitle.subtitle}</Text>
        {playerTitle.progressLabel ? (
          <Text style={styles.progressLabel}>{playerTitle.progressLabel}</Text>
        ) : null}
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statChip}>
          <Text style={styles.statValue}>{entries.length}</Text>
          <Text style={styles.statLabel}>{t.profile.totalScans}</Text>
        </View>
        <View style={styles.statChip}>
          <Text style={styles.statValue}>
            {dexCompletion.current}/{dexCompletion.goal}
          </Text>
          <Text style={styles.statLabel}>{t.profile.collectionGoal}</Text>
        </View>
        <View style={styles.statChip}>
          <Text style={styles.statValue}>{dexCompletion.percent}%</Text>
          <Text style={styles.statLabel}>{t.profile.collectionProgress}</Text>
        </View>
      </View>

      <View style={styles.quickNav}>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/collection')}
          style={({ pressed }) => [styles.quickNavBtn, pressed && styles.pressed]}
        >
          <AppIcon name="book" size={18} color={colors.accent} />
          <Text style={styles.quickNavLabel}>{t.profile.collectionNav}</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/quests')}
          style={({ pressed }) => [styles.quickNavBtn, pressed && styles.pressed]}
        >
          <AppIcon name="target" size={18} color={colors.accent} />
          <Text style={styles.quickNavLabel}>{t.profile.quests}</Text>
        </Pressable>
      </View>

      {entries.length > 0 && (
        <View style={styles.tools}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${sortLabels[sort]}`}
            onPress={cycleSort}
            style={({ pressed }) => [styles.sortBtn, pressed && styles.pressed]}
          >
            <Text style={styles.sortBtnLabel}>{sortLabels[sort]}</Text>
          </Pressable>
        </View>
      )}
    </>
  );

  return (
    <Screen edges={false}>
      <View style={{ paddingTop: insets.top }}>
        <ScreenHeader
          title={t.profile.title}
          right={
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t.common.settings}
              onPress={() => router.push('/settings')}
              style={({ pressed }) => [styles.settingsBtn, pressed && styles.pressed]}
            >
              <AppIcon name="settings" size={22} color={colors.accent} />
            </Pressable>
          }
        />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : entries.length === 0 ? (
        <>
          {listHeader}
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>{t.profile.emptyTitle}</Text>
            <Text style={styles.emptyBody}>{t.profile.emptyBody}</Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.replace('/camera')}
              style={({ pressed }) => [styles.scanBtn, pressed && styles.pressed]}
            >
              <AppIcon name="camera" size={18} color={colors.onAccent} />
              <Text style={styles.scanBtnLabel}>{t.profile.scanCta}</Text>
            </Pressable>
          </View>
        </>
      ) : (
        <FlatList
          data={visibleEntries}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={listHeader}
          contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 20) }}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          style={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadEntries(true)}
              tintColor={colors.accent}
            />
          }
          renderItem={({ item, index }) => (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={formatMessage(t.profile.scanEntry, {
                n: visibleEntries.length - index,
              })}
              onPress={() => router.push({ pathname: '/entry/[id]', params: { id: item.id } })}
              style={({ pressed }) => [styles.card, pressed && styles.pressed]}
            >
              <Image source={{ uri: item.imageUri }} style={styles.thumb} />
              <View style={styles.cardBody}>
                <Text style={styles.cardBreed}>
                  {formatMessage(t.profile.scanEntry, { n: visibleEntries.length - index })}
                </Text>
                <Text style={styles.cardDate}>
                  {formatShortDateTime(item.scannedAt, locale)}
                </Text>
              </View>
              <AppIcon name="chevron-right" size={20} color={colors.textMuted} />
            </Pressable>
          )}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  settingsBtn: {
    minWidth: 72,
    alignItems: 'flex-end',
    paddingVertical: 6,
    paddingLeft: 12,
  },
  pressed: {
    opacity: 0.85,
  },
  hero: {
    alignItems: 'center',
    paddingVertical: 20,
    gap: 4,
  },
  iconRing: {
    width: 108,
    height: 108,
    borderRadius: 54,
    backgroundColor: colors.surfaceSolid,
    borderWidth: borders.thin,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    overflow: 'hidden',
    shadowColor: '#1A1A1A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
  },
  brandIcon: {
    width: 108,
    height: 108,
    borderRadius: 54,
  },
  stageLabel: {
    color: colors.accent,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  subtitleLabel: {
    color: colors.textMuted,
    fontSize: 13,
    textAlign: 'center',
  },
  progressLabel: {
    color: colors.gold,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  statChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: colors.surfaceSolid,
    borderWidth: borders.thin,
    borderColor: colors.border,
    gap: 2,
    shadowColor: '#1A1A1A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 1,
  },
  statValue: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
  },
  statLabel: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
  },
  quickNav: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  quickNavBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.surfaceSolid,
    borderWidth: borders.thin,
    borderColor: colors.border,
    shadowColor: '#1A1A1A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 1,
  },
  quickNavLabel: {
    color: colors.accent,
    fontSize: 15,
    fontWeight: '800',
  },
  tools: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },
  sortBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: colors.accentSoft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderStrong,
  },
  sortBtnLabel: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: '700',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 12,
    alignItems: 'center',
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'center',
  },
  emptyBody: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
  scanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 999,
    backgroundColor: colors.accent,
  },
  scanBtnLabel: {
    color: colors.onAccent,
    fontSize: 15,
    fontWeight: '800',
  },
  list: {
    paddingHorizontal: 16,
  },
  separator: {
    height: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 18,
    backgroundColor: colors.surfaceSolid,
    borderWidth: borders.thin,
    borderColor: colors.border,
    shadowColor: '#1A1A1A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 1,
  },
  thumb: {
    width: 72,
    height: 72,
    borderRadius: 10,
    backgroundColor: colors.bgElevated,
  },
  cardBody: {
    flex: 1,
    justifyContent: 'center',
    gap: 4,
  },
  cardBreed: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  cardDate: {
    color: colors.textMuted,
    fontSize: 12,
  },
});
