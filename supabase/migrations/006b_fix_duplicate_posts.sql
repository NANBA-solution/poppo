-- 006 でインデックス作成に失敗した場合だけ実行
-- 同日の重複投稿を1件に整理してからユニークインデックスを作る

with ranked as (
  select
    fp.id,
    row_number() over (
      partition by fp.user_id, ((fp.created_at at time zone 'utc')::date)
      order by
        coalesce((
          select count(*)::int
          from public.feed_likes fl
          where fl.post_id = fp.id
        ), 0) desc,
        fp.created_at desc
    ) as rn
  from public.feed_posts fp
)
delete from public.feed_posts fp
using ranked r
where fp.id = r.id
  and r.rn > 1;

drop index if exists public.feed_posts_user_daily_unique_idx;

create unique index if not exists feed_posts_user_daily_unique_idx
  on public.feed_posts (user_id, ((created_at at time zone 'utc')::date));
