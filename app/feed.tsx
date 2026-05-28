import { getAvatarSkin } from '@/services/avatarService';
import { getPigeonCollection } from '@/services/collectionService';
import { PoppoStampBar } from '@/components/PoppoStampBar';
import { getFeedPosts, postStamp } from '@/services/feedService';
import type { FeedPost, StampId } from '@/types/feed';
import type { PigeonEntry } from '@/types/collection';
import { useFocusEffect, useRouter } from 'expo-router';
import * as React from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function formatTime(iso: string): string {
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

function FeedCard({ post }: { post: FeedPost }) {
  const avatar = getAvatarSkin(post.avatarId);
  return (
    <View style={[styles.card, post.isMine && styles.cardMine]}>
      <View style={styles.cardHeader}>
        <Image source={avatar.image} style={styles.cardAvatar} />
        <View style={styles.cardMeta}>
          <Text style={styles.cardAuthor}>{post.authorName}</Text>
          <Text style={styles.cardTime}>{formatTime(post.createdAt)}</Text>
        </View>
      </View>
      <Text style={styles.stampText}>{post.stampLabel}</Text>
      {post.breed && (
        <Text style={styles.cardContext} numberOfLines={2}>
          {post.breed}
          {post.nickname ? ` · ${post.nickname}` : ''}
        </Text>
      )}
      {post.imageUri && (
        <Image source={{ uri: post.imageUri }} style={styles.cardImage} />
      )}
    </View>
  );
}

export default function FeedScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = React.useState(true);
  const [posts, setPosts] = React.useState<FeedPost[]>([]);
  const [entries, setEntries] = React.useState<PigeonEntry[]>([]);
  const [posting, setPosting] = React.useState(false);

  const load = React.useCallback(async () => {
    const [feed, collection] = await Promise.all([getFeedPosts(), getPigeonCollection()]);
    setPosts(feed);
    setEntries(collection);
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
      try {
        setPosting(true);
        void hapticLight();
        await postStamp(stampId, entries);
        await load();
      } finally {
        setPosting(false);
      }
    },
    [entries, load, posting],
  );

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backLabel}>← 戻る</Text>
        </Pressable>
        <Text style={styles.title}>ぽっぽフィード</Text>
        <View style={styles.headerSpacer} />
      </View>

      <Text style={styles.hint}>テキスト禁止。ぽっぽ語スタンプだけで会話する。</Text>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color="#c9d6ee" />
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingBottom: insets.bottom + 120,
          }}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          renderItem={({ item }) => <FeedCard post={item} />}
          ListEmptyComponent={
            <Text style={styles.empty}>下のスタンプをタップして、最初の一声を送ろう。</Text>
          }
        />
      )}

      <View style={[styles.stampBar, { paddingBottom: Math.max(insets.bottom, 12) + 8 }]}>
        <PoppoStampBar onStamp={onStamp} busy={posting} />
        {entries.length === 0 && (
          <Text style={styles.stampNote}>スキャン後はハト情報つきで投稿されます。</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0a0a0f' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: { minWidth: 72 },
  backLabel: { color: '#7CB8FF', fontSize: 16, fontWeight: '700' },
  title: {
    flex: 1,
    textAlign: 'center',
    color: '#F4F7FA',
    fontSize: 18,
    fontWeight: '800',
  },
  headerSpacer: { minWidth: 72 },
  hint: {
    color: 'rgba(201,214,238,0.55)',
    fontSize: 12,
    textAlign: 'center',
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  separator: { height: 10 },
  card: {
    padding: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(13,17,26,0.92)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.12)',
    gap: 8,
  },
  cardMine: {
    borderColor: 'rgba(124,184,255,0.45)',
    backgroundColor: 'rgba(124,184,255,0.08)',
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cardAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff',
  },
  cardMeta: { flex: 1, gap: 2 },
  cardAuthor: { color: '#F4F7FA', fontSize: 14, fontWeight: '700' },
  cardTime: { color: 'rgba(201,214,238,0.5)', fontSize: 11 },
  stampText: {
    color: '#ffd98a',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 1,
  },
  cardContext: {
    color: 'rgba(244,247,250,0.75)',
    fontSize: 13,
    lineHeight: 18,
  },
  cardImage: {
    width: '100%',
    height: 160,
    borderRadius: 10,
    backgroundColor: '#1a1a22',
  },
  empty: {
    color: 'rgba(244,247,250,0.6)',
    textAlign: 'center',
    paddingVertical: 40,
    fontSize: 14,
    lineHeight: 21,
  },
  stampBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 10,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(10,10,15,0.96)',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.12)',
    gap: 8,
  },
  stampNote: {
    color: 'rgba(201,214,238,0.45)',
    fontSize: 10,
    textAlign: 'center',
  },
  pressed: { opacity: 0.88 },
});
