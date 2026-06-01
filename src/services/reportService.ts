import { getSupabase } from '@/lib/supabase';
import { isSupabaseConfigured } from '@/lib/supabaseConfig';
import { ensureSupabaseSession, getCurrentUserId } from '@/services/authService';

export type ReportReasonId = 'spam' | 'inappropriate' | 'other';

export const REPORT_REASONS: { id: ReportReasonId; label: string }[] = [
  { id: 'spam', label: 'スパム・連投' },
  { id: 'inappropriate', label: '不適切な内容' },
  { id: 'other', label: 'その他' },
];

export function isReportEnabled(): boolean {
  return isSupabaseConfigured();
}

export async function reportFeedPost(postId: string, reason: ReportReasonId): Promise<void> {
  if (!isReportEnabled()) throw new Error('クラウド未接続です');

  await ensureSupabaseSession();
  const userId = await getCurrentUserId();
  if (!userId) throw new Error('ログインに失敗しました');

  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase 未設定');

  const { error } = await supabase.from('feed_reports').insert({
    post_id: postId,
    reporter_id: userId,
    reason,
  });

  if (error) {
    if (error.code === '23505') {
      throw new Error('この投稿はすでに通報済みです');
    }
    throw new Error(error.message);
  }
}
