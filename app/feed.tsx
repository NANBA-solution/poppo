import { AppIcon } from '@/components/icons/AppIcon';
import { localizeStampLabel } from '@/constants/feedStamps';
import { GlassCard } from '@/components/ui/GlassCard';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { PoppoStampBar } from '@/components/PoppoStampBar';
import { useI18n } from '@/i18n/I18nProvider';
import { getAvatarSkin } from '@/services/avatarService';
import { getPigeonCollection } from '@/services/collectionService';
import {
  getFeedPosts,
  getTodayBestPost,
  hasPostedToday,
  isFeedCloudEnabled,
  postStamp,
  toggleFeedLike,
} from '@/services/feedService';
import { REPORT_REASONS, reportFeedPost, type ReportReasonId } from '@/services/reportService';
import { colors, radii } from '@/theme/tokens';
import { hapticLight } from '@/utils/haptics';
import type { FeedPost, StampId } from '@/types/feed';
import type { PigeonEntry } from '@/types/collection';
import { useFocusEffect } from 'expo-router';
import * as React from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function formatTime(iso: string, locale: string): string {
  try {
    return new Intl.DateTimeFormat(locale === 'en' ? 'en-US' : 'ja-JP', {
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso));
  } catch {
    return '';
  }
}

function FeedCard({
  post,
  locale,
  onReport,
  onLike,
  labels,
}: {
  post: FeedPost;
  locale: string;
  onReport: (post: FeedPost) => void;
  onLike: (post: FeedPost) => void;
  labels: {
    report: string;
    like: string;
    liked: string;
    likes: string;
    stamp: string;
  };
}) {
  const avatar = getAvatarSkin(post.avatarId);
  return (
    <GlassCard highlighted={post.isMine} style={styles.cardGap}>
      <View style={styles.cardHeader}>
        <Image source={avatar.image} style={styles.cardAvatar} />
        <View style={styles.cardMeta}>
          <Text style={styles.cardAuthor}>{post.authorName}</Text>
          <Text style={styles.cardTime}>{formatTime(post.createdAt, locale)}</Text>
        </View>
        {!post.isMine && isFeedCloudEnabled() && (
          <Pressable
            onPress={() => onReport(post)}
            style={({ pressed }) => [styles.reportBtn, pressed && styles.pressed]}
            accessibilityLabel={labels.report}
          >
            <AppIcon name="report" size={16} color={colors.textMuted} />
          </Pressable>
        )}
      </View>
      <Text style={styles.stampText}>{labels.stamp}</Text>
      {post.breed && (
        <Text style={styles.cardContext} numberOfLines={2}>
          {post.breed}
          {post.nickname ? ` · ${post.nickname}` : ''}
        </Text>
      )}
      {post.imageUri && (
        <Image source={{ uri: post.imageUri }} style={styles.cardImage} />
      )}
      <View style={styles.cardFooter}>
        <Pressable
          onPress={() => onLike(post)}
          style={({ pressed }) => [
            styles.likeBtn,
            post.likedByMe && styles.likeBtnActive,
            pressed && styles.pressed,
          ]}
        >
          <AppIcon
            name={post.likedByMe ? 'heart' : 'heart-outline'}
            size={18}
            color={post.likedByMe ? colors.danger : colors.textMuted}
          />
          <Text style={[styles.likeLabel, post.likedByMe && styles.likeLabelActive]}>
            {post.likedByMe ? labels.liked : labels.like}
          </Text>
        </Pressable>
        <Text style={styles.likeCount}>
          {post.likeCount} {labels.likes}
        </Text>
      </View>
    </GlassCard>
  );
}

export default function FeedScreen() {
  const insets = useSafeAreaInsets();
  const { t, locale } = useI18n();
  const [loading, setLoading] = React.useState(true);
  const [posts, setPosts] = React.useState<FeedPost[]>([]);
  const [bestPost, setBestPost] = React.useState<FeedPost | null>(null);
  const [entries, setEntries] = React.useState<PigeonEntry[]>([]);
  const [posting, setPosting] = React.useState(false);
  const [postedToday, setPostedToday] = React.useState(false);

  const reportLabels: Record<ReportReasonId, string> = {
    spam: t.feed.reportReasonSpam,
    inappropriate: t.feed.reportReasonInappropriate,
    other: t.feed.reportReasonOther,
  };

  const load = React.useCallback(async () => {
    const [feed, collection, best, posted] = await Promise.all([
      getFeedPosts(),
      getPigeonCollection(),
      getTodayBestPost(),
      hasPostedToday(),
    ]);
    setPosts(feed);
    setEntries(collection);
    setBestPost(best);
    setPostedToday(posted);
    setLoading(false);
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      setLoading(true);
      void load();
    }, [load]),
  );

  const onStamp = React.useCallback(
    async (stampId: StampId) => {
      if (posting) return;
      if (postedToday) {
        Alert.alert(t.feed.postLimitTitle, t.feed.postLimitBody);
        return;
      }
      try {
        setPosting(true);
        void hapticLight();
        await postStamp(stampId, entries);
        setPostedToday(true);
        await load();
      } finally {
        setPosting(false);
      }
    },
    [entries, load, postedToday, posting, t.feed.postLimitBody, t.feed.postLimitTitle],
  );

  const onReport = React.useCallback(
    async (post: FeedPost) => {
      if (!isFeedCloudEnabled() || post.isMine) return;
      Alert.alert(
        t.feed.reportTitle,
        t.feed.reportPrompt,
        [
          ...REPORT_REASONS.map((reason) => ({
            text: reportLabels[reason.id],
            onPress: async () => {
              try {
                await reportFeedPost(post.id, reason.id);
                Alert.alert(t.feed.reportDone);
              } catch (e) {
                Alert.alert(
                  t.feed.reportFailed,
                  e instanceof Error ? e.message : t.common.error,
                );
              }
            },
          })),
          { text: t.common.cancel, style: 'cancel' as const },
        ],
        { cancelable: true },
      );
    },
    [reportLabels, t],
  );

  const onLike = React.useCallback(
    async (post: FeedPost) => {
      try {
        void hapticLight();
        await toggleFeedLike(post.id);
        await load();
      } catch (e) {
        Alert.alert(
          t.feed.likeFailed,
          e instanceof Error ? e.message : t.common.error,
        );
      }
    },
    [load, t],
  );

  return (
    <Screen edges={false}>
      <View style={{ paddingTop: insets.top }}>
        <ScreenHeader title={t.feed.title} />
      </View>

      <Text style={styles.hint}>
        {isFeedCloudEnabled() ? t.feed.hintCloud : t.feed.hintLocal}
      </Text>

      {bestPost && (
        <GlassCard style={styles.bestCard}>
          <View style={styles.bestTitleRow}>
            <AppIcon name="trophy" size={18} color={colors.gold} />
            <Text style={styles.bestTitle}>{t.feed.bestTitle}</Text>
          </View>
          <Text style={styles.bestStamp}>
            {localizeStampLabel(bestPost.stampId, t.feed.stamps)}
          </Text>
          <Text style={styles.bestMeta}>
            {bestPost.authorName} · {bestPost.likeCount} {t.common.likes}
          </Text>
        </GlassCard>
      )}

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingBottom: insets.bottom + 150,
          }}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          renderItem={({ item }) => (
            <FeedCard
              post={item}
              locale={locale}
              onReport={onReport}
              onLike={onLike}
              labels={{
                report: t.common.report,
                like: t.common.like,
                liked: t.common.liked,
                likes: t.common.likes,
                stamp: localizeStampLabel(item.stampId, t.feed.stamps),
              }}
            />
          )}
          ListEmptyComponent={<Text style={styles.empty}>{t.feed.empty}</Text>}
        />
      )}

      <View style={[styles.floatingDock, { paddingBottom: Math.max(insets.bottom, 12) + 8 }]}>
        <PoppoStampBar
          onStamp={onStamp}
          busy={posting || postedToday}
          title={t.feed.stampSend}
        />
        {postedToday && <Text style={styles.limitNote}>{t.feed.limitNote}</Text>}
        {entries.length === 0 && <Text style={styles.stampNote}>{t.feed.stampNote}</Text>}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hint: {
    color: colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  bestCard: {
    marginHorizontal: 16,
    marginBottom: 10,
    borderColor: 'rgba(255,217,138,0.45)',
    backgroundColor: colors.goldSoft,
  },
  bestTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  bestTitle: { color: colors.gold, fontSize: 12, fontWeight: '800' },
  bestStamp: { color: '#fff1c7', fontSize: 22, fontWeight: '900' },
  bestMeta: { color: 'rgba(255,241,199,0.75)', fontSize: 12, fontWeight: '600' },
  separator: { height: 12 },
  cardGap: { gap: 8 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cardAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
  },
  cardMeta: { flex: 1, gap: 2 },
  reportBtn: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: radii.sm,
    backgroundColor: colors.dangerSoft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,120,120,0.35)',
    ...(Platform.OS === 'web' ? { cursor: 'pointer' as const } : {}),
  },
  reportLabel: {
    color: colors.danger,
    fontSize: 11,
    fontWeight: '700',
  },
  cardAuthor: { color: colors.text, fontSize: 14, fontWeight: '700' },
  cardTime: { color: colors.textMuted, fontSize: 11 },
  stampText: {
    color: colors.gold,
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  cardContext: {
    color: 'rgba(244,247,250,0.78)',
    fontSize: 13,
    lineHeight: 18,
  },
  cardImage: {
    width: '100%',
    height: 168,
    borderRadius: radii.md,
    backgroundColor: '#1a1a22',
  },
  cardFooter: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  likeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: radii.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: 'rgba(255,255,255,0.04)',
    ...(Platform.OS === 'web' ? { cursor: 'pointer' as const } : {}),
  },
  likeBtnActive: {
    borderColor: 'rgba(255,150,170,0.5)',
    backgroundColor: 'rgba(255,120,150,0.12)',
  },
  likeLabel: {
    color: 'rgba(244,247,250,0.82)',
    fontSize: 12,
    fontWeight: '700',
  },
  likeLabelActive: {
    color: '#ffb6c7',
  },
  likeCount: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  empty: {
    color: colors.textMuted,
    textAlign: 'center',
    paddingVertical: 40,
    fontSize: 14,
    lineHeight: 21,
  },
  floatingDock: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 0,
    paddingTop: 12,
    paddingHorizontal: 12,
    borderRadius: radii.xl,
    backgroundColor: colors.surfaceSolid,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 16,
  },
  stampNote: {
    color: colors.textMuted,
    fontSize: 10,
    textAlign: 'center',
  },
  limitNote: {
    color: colors.gold,
    fontSize: 11,
    textAlign: 'center',
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
});
