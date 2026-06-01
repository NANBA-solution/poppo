export { STAMP_IDS, getLocalizedStamps, localizeStampLabel } from '@/constants/feedStamps';

import { isSupabaseConfigured } from '@/lib/supabaseConfig';
import {
  getFeedPostsLocal,
  hasPostedTodayLocal,
  getTodayBestPostLocal,
  postStampLocal,
  toggleFeedLikeLocal,
} from '@/services/feedService.local';
import {
  getFeedPostsRemote,
  hasPostedTodayRemote,
  getTodayBestPostRemote,
  postStampRemote,
  toggleFeedLikeRemote,
} from '@/services/feedService.remote';
import type { PigeonEntry } from '@/types/collection';
import type { FeedPost, StampId } from '@/types/feed';

export function isFeedCloudEnabled(): boolean {
  return isSupabaseConfigured();
}

export async function getFeedPosts(): Promise<FeedPost[]> {
  if (isFeedCloudEnabled()) {
    return getFeedPostsRemote();
  }
  return getFeedPostsLocal();
}

export async function postStamp(
  stampId: StampId,
  entries: PigeonEntry[],
  options?: { entryId?: string },
): Promise<FeedPost> {
  if (isFeedCloudEnabled()) {
    return postStampRemote(stampId, entries, options);
  }
  return postStampLocal(stampId, entries, options);
}

export async function toggleFeedLike(postId: string): Promise<void> {
  if (isFeedCloudEnabled()) {
    return toggleFeedLikeRemote(postId);
  }
  return toggleFeedLikeLocal(postId);
}

export async function getTodayBestPost(): Promise<FeedPost | null> {
  if (isFeedCloudEnabled()) {
    return getTodayBestPostRemote();
  }
  return getTodayBestPostLocal();
}

export async function hasPostedToday(): Promise<boolean> {
  if (isFeedCloudEnabled()) {
    return hasPostedTodayRemote();
  }
  return hasPostedTodayLocal();
}
