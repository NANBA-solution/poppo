import { stampLabel } from '@/constants/feedStamps';
import { uploadLocalImage } from '@/lib/storageUpload';
import { getSupabase } from '@/lib/supabase';
import { ensureSupabaseSession, getCurrentUserId, getMyProfile, syncProfile } from '@/services/authService';
import { getSelectedAvatarId } from '@/services/avatarService';
import type { PigeonEntry } from '@/types/collection';
import type { FeedPost, StampId } from '@/types/feed';

const FEED_LIMIT = 80;

let warnedMissingDailyBestRpc = false;

type ProfileRow = {
  display_name: string;
  avatar_id: string;
};

type FeedRow = {
  id: string;
  user_id: string;
  stamp_id: string;
  stamp_label: string;
  breed: string | null;
  nickname: string | null;
  image_url: string | null;
  created_at: string;
  profiles: ProfileRow | ProfileRow[] | null;
  feed_likes?: { user_id: string }[] | null;
};

function getUtcDayWindow(date = new Date()): { start: string; end: string; day: string } {
  const y = date.getUTCFullYear();
  const m = date.getUTCMonth();
  const d = date.getUTCDate();
  const start = new Date(Date.UTC(y, m, d, 0, 0, 0, 0));
  const end = new Date(Date.UTC(y, m, d + 1, 0, 0, 0, 0));
  return {
    start: start.toISOString(),
    end: end.toISOString(),
    day: start.toISOString().slice(0, 10),
  };
}

function profileFromRow(row: FeedRow): ProfileRow {
  const p = row.profiles;
  if (Array.isArray(p)) return p[0] ?? { display_name: 'ぽっぽ野郎', avatar_id: 'jk' };
  return p ?? { display_name: 'ぽっぽ野郎', avatar_id: 'jk' };
}

function mapRow(row: FeedRow, myUserId: string | null): FeedPost {
  const profile = profileFromRow(row);
  const likes = Array.isArray(row.feed_likes) ? row.feed_likes : [];
  return {
    id: row.id,
    stampId: row.stamp_id as StampId,
    stampLabel: row.stamp_label,
    authorName: profile.display_name,
    avatarId: profile.avatar_id,
    breed: row.breed,
    nickname: row.nickname,
    imageUri: row.image_url,
    createdAt: row.created_at,
    isMine: myUserId !== null && row.user_id === myUserId,
    likeCount: likes.length,
    likedByMe: myUserId ? likes.some((like) => like.user_id === myUserId) : false,
  };
}

export async function getFeedPostsRemote(): Promise<FeedPost[]> {
  const supabase = getSupabase();
  if (!supabase) return [];

  await ensureSupabaseSession();
  const myUserId = await getCurrentUserId();

  const { data, error } = await supabase
    .from('feed_posts')
    .select(
      `
      id,
      user_id,
      stamp_id,
      stamp_label,
      breed,
      nickname,
      image_url,
      created_at,
      profiles ( display_name, avatar_id ),
      feed_likes ( user_id )
    `,
    )
    .order('created_at', { ascending: false })
    .limit(FEED_LIMIT);

  if (error) {
    console.warn('[feed] fetch failed:', error.message);
    throw new Error(error.message);
  }

  return (data as FeedRow[]).map((row) => mapRow(row, myUserId));
}

export async function postStampRemote(
  stampId: StampId,
  entries: PigeonEntry[],
  options?: { entryId?: string },
): Promise<FeedPost> {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase が未設定です');

  await ensureSupabaseSession();
  const userId = await getCurrentUserId();
  if (!userId) throw new Error('ログインに失敗しました');
  if (await hasPostedTodayRemote()) {
    throw new Error('フィード投稿は1日1回までです');
  }

  const avatarId = await getSelectedAvatarId(entries);
  const profile = await getMyProfile();
  await syncProfile(avatarId, profile?.displayName);

  const entry = options?.entryId
    ? entries.find((e) => e.id === options.entryId)
    : entries[0];

  let imageUrl: string | null = null;
  const localUri = entry?.imageUri ?? null;
  if (localUri && (localUri.startsWith('file:') || localUri.startsWith('content:'))) {
    const path = `${userId}/${Date.now()}.jpg`;
    imageUrl = await uploadLocalImage('feed-images', localUri, path);
  } else if (localUri?.startsWith('http')) {
    imageUrl = localUri;
  }

  const label = stampLabel(stampId);

  const { data, error } = await supabase
    .from('feed_posts')
    .insert({
      user_id: userId,
      stamp_id: stampId,
      stamp_label: label,
      breed: entry?.breed ?? null,
      nickname: entry?.nickname ?? null,
      image_url: imageUrl,
    })
    .select(
      `
      id,
      user_id,
      stamp_id,
      stamp_label,
      breed,
      nickname,
      image_url,
      created_at,
      profiles ( display_name, avatar_id ),
      feed_likes ( user_id )
    `,
    )
    .single();

  if (error || !data) {
    if (error?.code === '23505') {
      throw new Error('フィード投稿は1日1回までです');
    }
    throw new Error(error?.message ?? '投稿に失敗しました');
  }

  return mapRow(data as FeedRow, userId);
}

export async function toggleFeedLikeRemote(postId: string): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase が未設定です');
  await ensureSupabaseSession();
  const userId = await getCurrentUserId();
  if (!userId) throw new Error('ログインに失敗しました');

  const { data: existing, error: readError } = await supabase
    .from('feed_likes')
    .select('id')
    .eq('post_id', postId)
    .eq('user_id', userId)
    .maybeSingle();
  if (readError) throw new Error(readError.message);

  if (existing?.id) {
    const { error } = await supabase.from('feed_likes').delete().eq('id', existing.id);
    if (error) throw new Error(error.message);
    return;
  }

  const { error } = await supabase.from('feed_likes').insert({
    post_id: postId,
    user_id: userId,
  });
  if (error) throw new Error(error.message);
}

export async function getTodayBestPostRemote(): Promise<FeedPost | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  await ensureSupabaseSession();
  const myUserId = await getCurrentUserId();

  const { start, end, day } = getUtcDayWindow();
  const { data, error } = await supabase
    .from('feed_posts')
    .select(
      `
      id,
      user_id,
      stamp_id,
      stamp_label,
      breed,
      nickname,
      image_url,
      created_at,
      profiles ( display_name, avatar_id ),
      feed_likes ( user_id )
    `,
    )
    .gte('created_at', start)
    .lt('created_at', end)
    .order('created_at', { ascending: false })
    .limit(FEED_LIMIT);
  if (error) throw new Error(error.message);

  const rows = data as FeedRow[];
  const todayPosts = rows.map((row) => mapRow(row, myUserId));
  if (todayPosts.length === 0) return null;

  const best = [...todayPosts].sort((a, b) => b.likeCount - a.likeCount)[0] ?? null;
  if (!best) return null;

  const bestRow = rows.find((row) => row.id === best.id);
  if (!bestRow) return best;

  const { error: rpcError } = await supabase.rpc('upsert_daily_best_poppo', {
    target_day: day,
    best_post: best.id,
    best_user: bestRow.user_id,
    best_like_count: best.likeCount,
  });
  if (rpcError) {
    if (!warnedMissingDailyBestRpc) {
      warnedMissingDailyBestRpc = true;
      const needsMigration = rpcError.message.includes('schema cache');
      console.warn(
        needsMigration
          ? '[feed] Supabase に upsert_daily_best_poppo がありません。SQL Editor で supabase/migrations/006_daily_best_and_post_limit.sql を実行してください。'
          : `[feed] daily winner update failed: ${rpcError.message}`,
      );
    }
  }
  return best;
}

export async function hasPostedTodayRemote(): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;
  await ensureSupabaseSession();
  const userId = await getCurrentUserId();
  if (!userId) return false;

  const { start, end } = getUtcDayWindow();
  const { count, error } = await supabase
    .from('feed_posts')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', start)
    .lt('created_at', end);
  if (error) throw new Error(error.message);
  return (count ?? 0) > 0;
}
