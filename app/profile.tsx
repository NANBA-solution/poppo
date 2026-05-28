import { computeCollectionStats, getPigeonCollection } from '@/services/collectionService';
import {
  AVATAR_SKINS,
  DEFAULT_AVATAR_ID,
  getAvatarSkin,
  getSelectedAvatarId,
  getUnlockedAvatarIds,
  setSelectedAvatarId,
} from '@/services/avatarService';
import { getAchievements } from '@/services/achievementService';
import { getPlayerTitle } from '@/services/titleService';
import type { PigeonEntry } from '@/types/collection';
import { hapticLight } from '@/utils/haptics';
import { useFocusEffect, useRouter } from 'expo-router';
import * as React from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type SortMode = 'newest' | 'oldest' | 'breed';

const SORT_LABEL: Record<SortMode, string> = {
  newest: '新しい順',
  oldest: '古い順',
  breed: '品種順',
};

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat('ja-JP', {
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso));
  } catch {
    return '';
  }
}


function filterAndSort(
  entries: PigeonEntry[],
  query: string,
  sort: SortMode,
): PigeonEntry[] {
  const q = query.trim().toLowerCase();
  let list = q
    ? entries.filter(
        (entry) =>
          entry.breed.toLowerCase().includes(q) ||
          entry.nickname.toLowerCase().includes(q),
      )
    : [...entries];

  if (sort === 'oldest') {
    list = [...list].reverse();
  } else if (sort === 'breed') {
    list = [...list].sort((a, b) => a.breed.localeCompare(b.breed, 'ja'));
  }
  return list;
}

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [entries, setEntries] = React.useState<PigeonEntry[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const [sort, setSort] = React.useState<SortMode>('newest');
  const [selectedAvatarId, setSelectedAvatarIdState] = React.useState(DEFAULT_AVATAR_ID);

  const loadEntries = React.useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    const data = await getPigeonCollection();
    setEntries(data);
    const selected = await getSelectedAvatarId(data);
    setSelectedAvatarIdState(selected);
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
      const modes: SortMode[] = ['newest', 'oldest', 'breed'];
      const idx = modes.indexOf(current);
      return modes[(idx + 1) % modes.length];
    });
  }, []);

  const playerTitle = getPlayerTitle(entries.length);
  const stats = computeCollectionStats(entries);
  const achievements = getAchievements(entries);
  const unlockedAvatarIds = React.useMemo(() => getUnlockedAvatarIds(entries), [entries]);
  const selectedAvatar = getAvatarSkin(selectedAvatarId);
  const unlockedCount = achievements.filter((a) => a.unlocked).length;
  const visibleEntries = React.useMemo(
    () => filterAndSort(entries, query, sort),
    [entries, query, sort],
  );

  const onSelectAvatar = React.useCallback(
    async (id: string) => {
      if (!unlockedAvatarIds.has(id) || id === selectedAvatarId) return;
      void hapticLight();
      setSelectedAvatarIdState(id);
      await setSelectedAvatarId(id);
    },
    [selectedAvatarId, unlockedAvatarIds],
  );

  const listHeader = (
    <>
      <View style={styles.hero}>
        <View style={styles.avatarRing}>
          <Image source={selectedAvatar.image} style={styles.avatarImage} />
        </View>
        <Text style={styles.stageLabel}>{playerTitle.title}</Text>
        <Text style={styles.countLabel}>{entries.length} 羽スキャン済み</Text>
        {playerTitle.progressLabel && (
          <Text style={styles.titleProgress}>{playerTitle.progressLabel}</Text>
        )}
        <Text style={styles.avatarName}>{selectedAvatar.name}</Text>
      </View>

      <View style={styles.quickNav}>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/dex')}
          style={({ pressed }) => [styles.quickNavBtn, pressed && styles.pressed]}
        >
          <Text style={styles.quickNavLabel}>📖 図鑑</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/quests')}
          style={({ pressed }) => [styles.quickNavBtn, pressed && styles.pressed]}
        >
          <Text style={styles.quickNavLabel}>🎯 クエスト</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/feed')}
          style={({ pressed }) => [styles.quickNavBtn, pressed && styles.pressed]}
        >
          <Text style={styles.quickNavLabel}>💬 フィード</Text>
        </Pressable>
      </View>

      <View style={styles.avatarPicker}>
        {AVATAR_SKINS.map((skin) => {
          const unlocked = unlockedAvatarIds.has(skin.id);
          const selected = selectedAvatarId === skin.id;
          return (
            <Pressable
              key={skin.id}
              accessibilityRole="button"
              accessibilityLabel={`${skin.name}${unlocked ? '' : ' ロック中'}`}
              onPress={() => void onSelectAvatar(skin.id)}
              disabled={!unlocked}
              style={({ pressed }) => [
                styles.avatarChip,
                selected && styles.avatarChipSelected,
                !unlocked && styles.avatarChipLocked,
                pressed && styles.pressed,
              ]}
            >
              <Image source={skin.image} style={styles.avatarChipImage} />
              <Text
                style={[
                  styles.avatarChipName,
                  !unlocked && styles.avatarChipNameLocked,
                  selected && styles.avatarChipNameSelected,
                ]}
                numberOfLines={1}
              >
                {skin.name}
              </Text>
              {!unlocked && (
                <Text style={styles.avatarChipHint} numberOfLines={1}>
                  {skin.unlockHint}
                </Text>
              )}
            </Pressable>
          );
        })}
      </View>

      {entries.length > 0 && (
        <>
          <View style={styles.statsRow}>
            <View style={styles.statChip}>
              <Text style={styles.statValue}>{stats.total}</Text>
              <Text style={styles.statLabel}>総スキャン</Text>
            </View>
            <View style={styles.statChip}>
              <Text style={styles.statValue}>{stats.uniqueBreeds}</Text>
              <Text style={styles.statLabel}>品種数</Text>
            </View>
            {stats.latestNickname && (
              <View style={[styles.statChip, styles.statChipWide]}>
                <Text style={styles.statValueSmall} numberOfLines={1}>
                  {stats.latestNickname}
                </Text>
                <Text style={styles.statLabel}>最新の二つ名</Text>
              </View>
            )}
          </View>

          <View style={styles.achievementsSection}>
            <View style={styles.achievementsHeader}>
              <Text style={styles.achievementsTitle}>実績</Text>
              <Text style={styles.achievementsCount}>
                {unlockedCount}/{achievements.length}
              </Text>
            </View>
            <View style={styles.achievementsGrid}>
              {achievements.map((item) => (
                <View
                  key={item.id}
                  style={[styles.achievementChip, !item.unlocked && styles.achievementLocked]}
                >
                  <Text style={styles.achievementEmoji}>{item.emoji}</Text>
                  <Text
                    style={[
                      styles.achievementLabel,
                      !item.unlocked && styles.achievementLabelLocked,
                    ]}
                    numberOfLines={1}
                  >
                    {item.title}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.tools}>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="品種・二つ名で検索"
              placeholderTextColor="rgba(201,214,238,0.4)"
              style={styles.searchInput}
              clearButtonMode="while-editing"
              accessibilityLabel="コレクションを検索"
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`並び替え ${SORT_LABEL[sort]}`}
              onPress={cycleSort}
              style={({ pressed }) => [styles.sortBtn, pressed && styles.pressed]}
            >
              <Text style={styles.sortBtnLabel}>{SORT_LABEL[sort]}</Text>
            </Pressable>
          </View>
        </>
      )}
    </>
  );

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="カメラに戻る"
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
        >
          <Text style={styles.backLabel}>← カメラ</Text>
        </Pressable>
        <Text style={styles.title}>マイぽっぽ</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="設定を開く"
          onPress={() => router.push('/settings')}
          style={({ pressed }) => [styles.settingsBtn, pressed && styles.pressed]}
        >
          <Text style={styles.settingsLabel}>⚙️</Text>
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color="#c9d6ee" />
        </View>
      ) : entries.length === 0 ? (
        <>
          {listHeader}
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>まだコレクションがありません</Text>
            <Text style={styles.emptyBody}>ハトを撮影して、最初のぽっぽをゲットしよう。</Text>
          </View>
        </>
      ) : (
        <FlatList
          data={visibleEntries}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={listHeader}
          ListEmptyComponent={
            <Text style={styles.noMatch}>「{query}」に一致するぽっぽはありません。</Text>
          }
          contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 20) }}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          style={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadEntries(true)}
              tintColor="#c9d6ee"
            />
          }
          renderItem={({ item }) => (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${item.breed}、${item.nickname}の詳細を見る`}
              onPress={() => router.push({ pathname: '/entry/[id]', params: { id: item.id } })}
              style={({ pressed }) => [styles.card, pressed && styles.pressed]}
            >
              <Image source={{ uri: item.imageUri }} style={styles.thumb} />
              <View style={styles.cardBody}>
                <Text style={styles.cardBreed}>{item.breed}</Text>
                <Text style={styles.cardNickname}>{item.nickname}</Text>
                <Text style={styles.cardDate}>{formatDate(item.scannedAt)}</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0a0a0f',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    paddingVertical: 6,
    paddingRight: 12,
    minWidth: 72,
  },
  backLabel: {
    color: '#7CB8FF',
    fontSize: 16,
    fontWeight: '700',
  },
  title: {
    flex: 1,
    textAlign: 'center',
    color: '#F4F7FA',
    fontSize: 18,
    fontWeight: '800',
  },
  settingsBtn: {
    minWidth: 72,
    alignItems: 'flex-end',
    paddingVertical: 6,
    paddingLeft: 12,
  },
  settingsLabel: {
    fontSize: 20,
  },
  pressed: {
    opacity: 0.85,
  },
  hero: {
    alignItems: 'center',
    paddingVertical: 20,
    gap: 6,
  },
  avatarRing: {
    width: 108,
    height: 108,
    borderRadius: 54,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: 'rgba(124,184,255,0.45)',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  stageLabel: {
    color: '#c9d6ee',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
  },
  countLabel: {
    color: 'rgba(244,247,250,0.65)',
    fontSize: 13,
  },
  avatarName: {
    color: '#ffd98a',
    fontSize: 13,
    fontWeight: '700',
  },
  titleProgress: {
    color: 'rgba(201,214,238,0.55)',
    fontSize: 12,
    fontWeight: '600',
  },
  quickNav: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  quickNavBtn: {
    flex: 1,
    minWidth: '30%',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: 'rgba(124,184,255,0.12)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(124,184,255,0.3)',
  },
  quickNavLabel: {
    color: '#c9d6ee',
    fontSize: 14,
    fontWeight: '800',
  },
  avatarPicker: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  avatarChip: {
    width: '48%',
    minWidth: 150,
    flexGrow: 1,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(124,184,255,0.25)',
    backgroundColor: 'rgba(124,184,255,0.08)',
    paddingVertical: 8,
    paddingHorizontal: 8,
    alignItems: 'center',
    gap: 6,
  },
  avatarChipImage: {
    width: 72,
    height: 72,
    borderRadius: 10,
    backgroundColor: '#fff',
    resizeMode: 'cover',
  },
  avatarChipSelected: {
    borderColor: 'rgba(255,217,138,0.8)',
    backgroundColor: 'rgba(255,217,138,0.12)',
  },
  avatarChipLocked: {
    opacity: 0.45,
  },
  avatarChipName: {
    color: '#c9d6ee',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  avatarChipNameSelected: {
    color: '#ffd98a',
  },
  avatarChipNameLocked: {
    color: 'rgba(201,214,238,0.7)',
  },
  avatarChipHint: {
    color: 'rgba(201,214,238,0.65)',
    fontSize: 9,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  statChip: {
    flex: 1,
    minWidth: 90,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(124,184,255,0.08)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(124,184,255,0.2)',
    alignItems: 'center',
    gap: 2,
  },
  statChipWide: {
    minWidth: '100%',
  },
  statValue: {
    color: '#F4F7FA',
    fontSize: 20,
    fontWeight: '800',
  },
  statValueSmall: {
    color: '#F4F7FA',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  statLabel: {
    color: 'rgba(201,214,238,0.55)',
    fontSize: 11,
    fontWeight: '600',
  },
  achievementsSection: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },
  achievementsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  achievementsTitle: {
    color: 'rgba(201,214,238,0.75)',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1,
  },
  achievementsCount: {
    color: 'rgba(201,214,238,0.45)',
    fontSize: 12,
    fontWeight: '700',
  },
  achievementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  achievementChip: {
    width: '31%',
    minWidth: 96,
    flexGrow: 1,
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(255,200,80,0.1)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,200,80,0.35)',
    gap: 4,
  },
  achievementLocked: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderColor: 'rgba(255,255,255,0.1)',
    opacity: 0.55,
  },
  achievementEmoji: {
    fontSize: 22,
  },
  achievementLabel: {
    color: '#ffd98a',
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
  },
  achievementLabelLocked: {
    color: 'rgba(201,214,238,0.45)',
  },
  tools: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },
  searchInput: {
    backgroundColor: 'rgba(13,17,26,0.92)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#F4F7FA',
    fontSize: 15,
  },
  sortBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(124,184,255,0.12)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(124,184,255,0.3)',
  },
  sortBtnLabel: {
    color: '#c9d6ee',
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
    gap: 8,
  },
  emptyTitle: {
    color: '#F4F7FA',
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'center',
  },
  emptyBody: {
    color: 'rgba(244,247,250,0.65)',
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
  noMatch: {
    color: 'rgba(244,247,250,0.55)',
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
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
    borderRadius: 14,
    backgroundColor: 'rgba(13,17,26,0.92)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  thumb: {
    width: 72,
    height: 72,
    borderRadius: 10,
    backgroundColor: '#1a1a22',
  },
  cardBody: {
    flex: 1,
    justifyContent: 'center',
    gap: 4,
  },
  cardBreed: {
    color: '#F4F7FA',
    fontSize: 16,
    fontWeight: '800',
  },
  cardNickname: {
    color: 'rgba(244,247,250,0.88)',
    fontSize: 14,
    lineHeight: 19,
  },
  cardDate: {
    color: 'rgba(201,214,238,0.55)',
    fontSize: 12,
  },
  chevron: {
    color: 'rgba(201,214,238,0.45)',
    fontSize: 24,
    fontWeight: '300',
    paddingLeft: 4,
  },
});
