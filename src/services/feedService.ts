import AsyncStorage from '@react-native-async-storage/async-storage';

import { getSelectedAvatarId } from '@/services/avatarService';
import type { PigeonEntry } from '@/types/collection';
import type { FeedPost, FeedStamp, StampId } from '@/types/feed';

const FEED_KEY = '@poppo/feed/v1';
const FEED_SEEDED_KEY = '@poppo/feed/seeded/v1';

export const POPPO_STAMPS: FeedStamp[] = [
  { id: 'kuruppo', label: 'クルッポー', sound: 'kuruppo' },
  { id: 'hohoho', label: 'ホーホー', sound: 'hohoho' },
  { id: 'gerogero', label: 'ゲロゲロ', sound: 'gerogero' },
  { id: 'peewee', label: 'ピーウィ', sound: 'peewee' },
  { id: 'bododo', label: 'ボドド', sound: 'bododo' },
  { id: 'gugu', label: 'グーグー', sound: 'gugu' },
];

const WORLD_AUTHORS = [
  '公園のハトA',
  '屋根のぽっぽ',
  '銅像の上の子',
  'パン屋前の観察者',
  '実質ハトさん',
] as const;

function stampLabel(id: StampId): string {
  return POPPO_STAMPS.find((s) => s.id === id)?.label ?? id;
}

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
  }));
}

export async function ensureFeedSeeded(): Promise<void> {
  const seeded = await AsyncStorage.getItem(FEED_SEEDED_KEY);
  if (seeded === '1') return;
  await writePosts(seedWorldPosts());
  await AsyncStorage.setItem(FEED_SEEDED_KEY, '1');
}

export async function getFeedPosts(): Promise<FeedPost[]> {
  await ensureFeedSeeded();
  const posts = await readPosts();
  return [...posts].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export async function postStamp(
  stampId: StampId,
  entries: PigeonEntry[],
  options?: { entryId?: string },
): Promise<FeedPost> {
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
  };

  const existing = await readPosts();
  await writePosts([post, ...existing]);
  return post;
}
