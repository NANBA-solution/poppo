-- 1日1投稿制限 + 今日のベストぽっぽ
-- 既に同日に複数投稿がある場合は、いいね最多（同数なら新しい方）を1件残して削除する

alter table public.profiles
  add column if not exists best_poppo_wins integer not null default 0;

alter table public.profiles
  add column if not exists last_best_poppo_at timestamptz;

-- 重複投稿を整理（インデックス作成前に必須）
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

create unique index feed_posts_user_daily_unique_idx
  on public.feed_posts (user_id, ((created_at at time zone 'utc')::date));

-- 日次ベストぽっぽ
create table if not exists public.feed_daily_winners (
  win_date date primary key,
  post_id uuid not null references public.feed_posts (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  like_count integer not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.feed_daily_winners enable row level security;

drop policy if exists feed_daily_winners_select on public.feed_daily_winners;
create policy feed_daily_winners_select
  on public.feed_daily_winners for select
  using (true);

create or replace function public.upsert_daily_best_poppo(
  target_day date,
  best_post uuid,
  best_user uuid,
  best_like_count integer
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  previous_user uuid;
begin
  select user_id into previous_user
  from public.feed_daily_winners
  where win_date = target_day;

  insert into public.feed_daily_winners (win_date, post_id, user_id, like_count, updated_at)
  values (target_day, best_post, best_user, greatest(best_like_count, 0), now())
  on conflict (win_date) do update
    set post_id = excluded.post_id,
        user_id = excluded.user_id,
        like_count = excluded.like_count,
        updated_at = now();

  if previous_user is distinct from best_user then
    if previous_user is not null then
      update public.profiles
      set best_poppo_wins = greatest(coalesce(best_poppo_wins, 0) - 1, 0),
          updated_at = now()
      where id = previous_user;
    end if;

    update public.profiles
    set best_poppo_wins = coalesce(best_poppo_wins, 0) + 1,
        last_best_poppo_at = now(),
        updated_at = now()
    where id = best_user;
  end if;
end;
$$;

grant execute on function public.upsert_daily_best_poppo(date, uuid, uuid, integer) to authenticated;
