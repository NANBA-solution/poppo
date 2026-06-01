import AsyncStorage from '@react-native-async-storage/async-storage';

import { stampLabel } from '@/constants/feedStamps';
import { getSelectedAvatarId } from '@/services/avatarService';
import type { PigeonEntry } from '@/types/collection';
import type { FeedPost, StampId } from '@/types/feed';

const FEED_KEY = '@poppo/feed/v1';
const FEED_SEEDED_KEY = '@poppo/feed/seeded/v1';
const FEED_LIKES_KEY = '@poppo/feed/likes/v1';
const FEED_POSTED_DAY_KEY = '@poppo/feed/posted-day/v1';

const WORLD_AUTHORS = [
  '公園のハトA',
  '屋根のぽっぽ',
  '銅像の上の子',
  'パン屋前の観察者',
  '実質ハトさん',
] as const;

function isFeedPost(value: unknown): value is FeedPost {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.id === 'string' &&
    typeof v.stampId === 'string' &&
    typeof v.stampLabel === 'string' &&
    typeof v.authorName === 'string' &&
    typeof v.createdAt === 'string'
  );
}

async function readPosts(): Promise<FeedPost[]> {
  const raw = await AsyncStorage.getItem(FEED_KEY);
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isFeedPost);
  } catch {
    return [];
  }
}

async function writePosts(posts: FeedPost[]): Promise<void> {
  await AsyncStorage.setItem(FEED_KEY, JSON.stringify(posts));
}

type LocalLikeMap = Record<string, boolean>;

async function readLikeMap(): Promise<LocalLikeMap> {
  const raw = await AsyncStorage.getItem(FEED_LIKES_KEY);
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as LocalLikeMap;
    return parsed ?? {};
  } catch {
    return {};
  }
}

async function writeLikeMap(map: LocalLikeMap): Promise<void> {
  await AsyncStorage.setItem(FEED_LIKES_KEY, JSON.stringify(map));
}

function withLikes(posts: FeedPost[], likeMap: LocalLikeMap): FeedPost[] {
  return posts.map((post) => {
    const likedByMe = Boolean(likeMap[post.id]);
    return {
      ...post,
      likedByMe,
      likeCount: likedByMe ? 1 : 0,
    };
  });
}

function seedWorldPosts(): FeedPost[] {
  const stamps: StampId[] = ['kuruppo', 'hohoho', 'gerogero', 'peewee', 'bododo', 'gugu'];
  const now = Date.now();
  return stamps.map((stampId, i) => ({
    id: `seed-${stampId}`,
    stampId,
    stampLabel: stampLabel(stampId),
    authorName: WORLD_AUTHORS[i % WORLD_AUTHORS.length],
    avatarId: ['jk', 'salaryman', 'gyaru', 'yankee', 'student'][i % 5],
    breed: ['ドバト', 'カワラバト', 'ニシオジロバト'][i % 3],
    nickname: ['パン屑ハンター', '屋根の君主', '実質ハト'][i % 3],
    imageUri: null,
    createdAt: new Date(now - (i + 1) * 3600_000).toISOString(),
    isMine: false,
    likedByMe: false,
    likeCount: 0,
  }));
}

export async function ensureFeedSeeded(): Promise<void> {
  const seeded = await AsyncStorage.getItem(FEED_SEEDED_KEY);
  if (seeded === '1') return;
  await writePosts(seedWorldPosts());
  await AsyncStorage.setItem(FEED_SEEDED_KEY, '1');
}

export async function getFeedPostsLocal(): Promise<FeedPost[]> {
  await ensureFeedSeeded();
  const [posts, likeMap] = await Promise.all([readPosts(), readLikeMap()]);
  const merged = withLikes(posts, likeMap);
  return [...merged].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export async function postStampLocal(
  stampId: StampId,
  entries: PigeonEntry[],
  options?: { entryId?: string },
): Promise<FeedPost> {
  const postedToday = await hasPostedTodayLocal();
  if (postedToday) {
    throw new Error('フィード投稿は1日1回までです');
  }

  const avatarId = await getSelectedAvatarId(entries);
  const entry = options?.entryId
    ? entries.find((e) => e.id === options.entryId)
    : entries[0];

  const post: FeedPost = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    stampId,
    stampLabel: stampLabel(stampId),
    authorName: 'あなた',
    avatarId,
    breed: entry?.breed ?? null,
    nickname: entry?.nickname ?? null,
    imageUri: entry?.imageUri ?? null,
    createdAt: new Date().toISOString(),
    isMine: true,
    likedByMe: false,
    likeCount: 0,
  };

  const existing = await readPosts();
  await writePosts([post, ...existing]);
  await AsyncStorage.setItem(FEED_POSTED_DAY_KEY, new Date().toISOString().slice(0, 10));
  return post;
}

export async function toggleFeedLikeLocal(postId: string): Promise<void> {
  const map = await readLikeMap();
  if (map[postId]) {
    delete map[postId];
  } else {
    map[postId] = true;
  }
  await writeLikeMap(map);
}

export async function getTodayBestPostLocal(): Promise<FeedPost | null> {
  const posts = await getFeedPostsLocal();
  if (posts.length === 0) return null;
  const today = new Date().toDateString();
  const todayPosts = posts.filter((p) => new Date(p.createdAt).toDateString() === today);
  const target = todayPosts.length > 0 ? todayPosts : posts;
  return [...target].sort((a, b) => b.likeCount - a.likeCount)[0] ?? null;
}

export async function hasPostedTodayLocal(): Promise<boolean> {
  const day = await AsyncStorage.getItem(FEED_POSTED_DAY_KEY);
  const today = new Date().toISOString().slice(0, 10);
  return day === today;
}
