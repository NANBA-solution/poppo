import { getPigeonCollection } from '@/services/collectionService';
import { AppIcon } from '@/components/icons/AppIcon';
import {
  DEFAULT_AVATAR_ID,
  getAvatarName,
  getAvatarSkin,
  getAvatarSkins,
  getSelectedAvatarId,
  getUnlockedAvatarIds,
  setSelectedAvatarId,
} from '@/services/avatarService';
import {
  DEFAULT_DISPLAY_NAME,
  getMyProfile,
  isAuthCloudEnabled,
  syncProfile,
  updateDisplayName,
} from '@/services/authService';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { formatMessage } from '@/i18n/format';
import { useI18n } from '@/i18n/I18nProvider';
import { colors } from '@/theme/tokens';
import { formatShortDateTime } from '@/utils/formatDate';
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
  const { t, locale } = useI18n();

  const sortLabels: Record<SortMode, string> = React.useMemo(
    () => ({
      newest: t.profile.sortNewest,
      oldest: t.profile.sortOldest,
      breed: t.profile.sortBreed,
    }),
    [t.profile.sortBreed, t.profile.sortNewest, t.profile.sortOldest],
  );
  const [entries, setEntries] = React.useState<PigeonEntry[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const [sort, setSort] = React.useState<SortMode>('newest');
  const [selectedAvatarId, setSelectedAvatarIdState] = React.useState(DEFAULT_AVATAR_ID);
  const [displayName, setDisplayName] = React.useState(DEFAULT_DISPLAY_NAME);
  const [savingName, setSavingName] = React.useState(false);
  const [bestPoppoWins, setBestPoppoWins] = React.useState(0);
  const [avatarExpanded, setAvatarExpanded] = React.useState(false);

  const loadEntries = React.useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    const data = await getPigeonCollection();
    setEntries(data);
    const selected = await getSelectedAvatarId(data);
    setSelectedAvatarIdState(selected);
    if (isAuthCloudEnabled()) {
      const profile = await getMyProfile();
      if (profile) {
        setDisplayName(profile.displayName);
        setBestPoppoWins(profile.bestPoppoWins);
      }
    }
    setLoading(false);
    setRefreshing(false);
  }, []);

  const onSaveDisplayName = React.useCallback(async () => {
    if (!isAuthCloudEnabled() || savingName) return;
    const trimmed = displayName.trim();
    if (!trimmed) {
      setDisplayName(DEFAULT_DISPLAY_NAME);
      return;
    }
    try {
      setSavingName(true);
      await updateDisplayName(trimmed);
      setDisplayName(trimmed);
      void hapticLight();
    } catch {
      const profile = await getMyProfile();
      if (profile) setDisplayName(profile.displayName);
    } finally {
      setSavingName(false);
    }
  }, [displayName, savingName]);

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

  const playerTitle = getPlayerTitle(entries.length, bestPoppoWins, t);
  const unlockedAvatarIds = React.useMemo(() => getUnlockedAvatarIds(entries), [entries]);
  const lockedAvatarCount = getAvatarSkins().length - unlockedAvatarIds.size;
  const selectedAvatar = getAvatarSkin(selectedAvatarId);
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
      if (isAuthCloudEnabled()) {
        await syncProfile(id);
      }
    },
    [selectedAvatarId, unlockedAvatarIds],
  );

  const onToggleAvatarPicker = React.useCallback(() => {
    void hapticLight();
    setAvatarExpanded((open) => !open);
  }, []);

  const listHeader = (
    <>
      <View style={styles.hero}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={avatarExpanded ? t.profile.avatarCollapse : t.profile.avatarChange}
          onPress={onToggleAvatarPicker}
          style={({ pressed }) => [styles.avatarRing, pressed && styles.pressed]}
        >
          <Image source={selectedAvatar.image} style={styles.avatarImage} />
        </Pressable>
        <Text style={styles.stageLabel}>{playerTitle.title}</Text>
        <Text style={styles.countLabel}>
          {entries.length} {t.profile.scans}
        </Text>
        <Text style={styles.avatarName}>{getAvatarName(selectedAvatarId, t)}</Text>
        {!avatarExpanded && (
          <Pressable
            accessibilityRole="button"
            onPress={onToggleAvatarPicker}
            style={({ pressed }) => [styles.avatarToggleBtn, pressed && styles.pressed]}
          >
            <Text style={styles.avatarToggleLabel}>{t.profile.avatarChange}</Text>
            {lockedAvatarCount > 0 && (
              <Text style={styles.avatarToggleHint}>
                {formatMessage(t.profile.avatarLockedCount, { count: lockedAvatarCount })}
              </Text>
            )}
            <AppIcon name="chevron-right" size={16} color={colors.textMuted} />
          </Pressable>
        )}
      </View>

      {isAuthCloudEnabled() && (
        <View style={styles.displayNameSection}>
          <Text style={styles.displayNameLabel}>{t.profile.feedName}</Text>
          <View style={styles.displayNameRow}>
            <TextInput
              value={displayName}
              onChangeText={setDisplayName}
              onEndEditing={() => void onSaveDisplayName()}
              onSubmitEditing={() => void onSaveDisplayName()}
              maxLength={20}
              placeholder={DEFAULT_DISPLAY_NAME}
              placeholderTextColor="rgba(201,214,238,0.35)"
              style={styles.displayNameInput}
              returnKeyType="done"
              editable={!savingName}
            />
            {savingName && <ActivityIndicator size="small" color={colors.accent} />}
          </View>
          <Text style={styles.displayNameHint}>{t.profile.feedNameHint}</Text>
        </View>
      )}

      <View style={styles.quickNav}>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/dex')}
          style={({ pressed }) => [styles.quickNavBtn, pressed && styles.pressed]}
        >
          <AppIcon name="book" size={16} color={colors.accent} />
          <Text style={styles.quickNavLabel}>{t.profile.dex}</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/quests')}
          style={({ pressed }) => [styles.quickNavBtn, pressed && styles.pressed]}
        >
          <AppIcon name="target" size={16} color={colors.accent} />
          <Text style={styles.quickNavLabel}>{t.profile.quests}</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/feed')}
          style={({ pressed }) => [styles.quickNavBtn, pressed && styles.pressed]}
        >
          <AppIcon name="feed" size={16} color={colors.accent} />
          <Text style={styles.quickNavLabel}>{t.profile.feed}</Text>
        </Pressable>
      </View>

      {avatarExpanded && (
        <View style={styles.avatarPickerSection}>
          <View style={styles.avatarPickerHeader}>
            <Text style={styles.avatarPickerTitle}>{t.profile.avatarChange}</Text>
            <Pressable
              accessibilityRole="button"
              onPress={onToggleAvatarPicker}
              style={({ pressed }) => [styles.avatarCollapseBtn, pressed && styles.pressed]}
            >
              <Text style={styles.avatarCollapseLabel}>{t.profile.avatarCollapse}</Text>
            </Pressable>
          </View>
          <View style={styles.avatarPicker}>
            {getAvatarSkins().map((skin) => {
              const unlocked = unlockedAvatarIds.has(skin.id);
              const selected = selectedAvatarId === skin.id;
              return (
                <Pressable
                  key={skin.id}
                  accessibilityRole="button"
                  accessibilityLabel={`${getAvatarName(skin.id, t)}${unlocked ? '' : ` ${t.common.locked}`}`}
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
                    {getAvatarName(skin.id, t)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      )}

      {entries.length > 0 && (
        <>
          <View style={styles.tools}>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder={t.profile.searchPlaceholder}
              placeholderTextColor={colors.textMuted}
              style={styles.searchInput}
              clearButtonMode="while-editing"
              accessibilityLabel={t.profile.searchPlaceholder}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${sortLabels[sort]}`}
              onPress={cycleSort}
              style={({ pressed }) => [styles.sortBtn, pressed && styles.pressed]}
            >
              <Text style={styles.sortBtnLabel}>{sortLabels[sort]}</Text>
            </Pressable>
          </View>
        </>
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
          </View>
        </>
      ) : (
        <FlatList
          data={visibleEntries}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={listHeader}
          ListEmptyComponent={
            <Text style={styles.noMatch}>
              {formatMessage(t.profile.noMatch, { query })}
            </Text>
          }
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
          renderItem={({ item }) => (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${item.breed}、${item.nickname}`}
              onPress={() => router.push({ pathname: '/entry/[id]', params: { id: item.id } })}
              style={({ pressed }) => [styles.card, pressed && styles.pressed]}
            >
              <Image source={{ uri: item.imageUri }} style={styles.thumb} />
              <View style={styles.cardBody}>
                <Text style={styles.cardBreed}>{item.breed}</Text>
                <Text style={styles.cardNickname}>{item.nickname}</Text>
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
    borderColor: colors.borderStrong,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  stageLabel: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
  },
  countLabel: {
    color: 'rgba(244,247,250,0.65)',
    fontSize: 13,
  },
  avatarName: {
    color: colors.gold,
    fontSize: 13,
    fontWeight: '700',
  },
  avatarToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: colors.accentSoft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderStrong,
  },
  avatarToggleLabel: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '700',
  },
  avatarToggleHint: {
    color: 'rgba(201,214,238,0.45)',
    fontSize: 10,
    fontWeight: '600',
  },
  avatarPickerSection: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },
  avatarPickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  avatarPickerTitle: {
    color: 'rgba(201,214,238,0.75)',
    fontSize: 13,
    fontWeight: '800',
  },
  avatarCollapseBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  avatarCollapseLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  displayNameSection: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 6,
  },
  displayNameLabel: {
    color: 'rgba(201,214,238,0.7)',
    fontSize: 12,
    fontWeight: '700',
  },
  displayNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  displayNameInput: {
    flex: 1,
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: colors.accentSoft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderStrong,
  },
  displayNameHint: {
    color: 'rgba(201,214,238,0.45)',
    fontSize: 11,
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
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.accentSoft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderStrong,
  },
  quickNavLabel: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: '800',
  },
  avatarPicker: {
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
    borderColor: colors.borderStrong,
    backgroundColor: colors.accentSoft,
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
    color: colors.accent,
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  avatarChipNameSelected: {
    color: colors.gold,
  },
  avatarChipNameLocked: {
    color: 'rgba(201,214,238,0.7)',
  },
  avatarChipHint: {
    color: 'rgba(201,214,238,0.65)',
    fontSize: 9,
    textAlign: 'center',
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
    color: colors.text,
    fontSize: 15,
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
    gap: 8,
  },
  emptyTitle: {
    color: colors.text,
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
