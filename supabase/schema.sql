-- ぽっぽ Supabase スキーマ
-- Dashboard → SQL Editor でこのファイルを実行してください。
-- Auth → Providers で「Anonymous sign-ins」を有効にしてください。

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default 'ぽっぽ野郎',
  avatar_id text not null default 'jk',
  best_poppo_wins integer not null default 0,
  last_best_poppo_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- feed_posts
-- ---------------------------------------------------------------------------
create table if not exists public.feed_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  stamp_id text not null,
  stamp_label text not null,
  breed text,
  nickname text,
  image_url text,
  created_at timestamptz not null default now()
);

create index if not exists feed_posts_created_at_idx
  on public.feed_posts (created_at desc);
create unique index if not exists feed_posts_user_daily_unique_idx
  on public.feed_posts (user_id, ((created_at at time zone 'utc')::date));

-- ---------------------------------------------------------------------------
-- feed_likes（いいね）
-- ---------------------------------------------------------------------------
create table if not exists public.feed_likes (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.feed_posts (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (post_id, user_id)
);

create index if not exists feed_likes_post_idx on public.feed_likes (post_id);
create index if not exists feed_likes_user_idx on public.feed_likes (user_id);

-- ---------------------------------------------------------------------------
-- feed_daily_winners（今日のベストぽっぽ）
-- ---------------------------------------------------------------------------
create table if not exists public.feed_daily_winners (
  win_date date primary key,
  post_id uuid not null references public.feed_posts (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  like_count integer not null default 0,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- feed_reports（通報）
-- ---------------------------------------------------------------------------
create table if not exists public.feed_reports (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.feed_posts (id) on delete cascade,
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  reason text not null,
  created_at timestamptz not null default now(),
  unique (post_id, reporter_id)
);

create index if not exists feed_reports_post_idx on public.feed_reports (post_id);

-- ---------------------------------------------------------------------------
-- pigeon_scans（コレクション・端末間同期）
-- ---------------------------------------------------------------------------
create table if not exists public.pigeon_scans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  client_id text not null,
  breed text not null,
  nickname text not null,
  image_url text,
  scanned_at timestamptz not null,
  created_at timestamptz not null default now(),
  unique (user_id, client_id)
);

create index if not exists pigeon_scans_user_scanned_idx
  on public.pigeon_scans (user_id, scanned_at desc);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.feed_posts enable row level security;
alter table public.feed_likes enable row level security;
alter table public.feed_daily_winners enable row level security;
alter table public.feed_reports enable row level security;
alter table public.pigeon_scans enable row level security;

drop policy if exists profiles_select on public.profiles;
create policy profiles_select
  on public.profiles for select
  using (true);

drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own
  on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own
  on public.profiles for update
  using (auth.uid() = id);

drop policy if exists feed_select on public.feed_posts;
create policy feed_select
  on public.feed_posts for select
  using (true);

drop policy if exists feed_insert_own on public.feed_posts;
create policy feed_insert_own
  on public.feed_posts for insert
  with check (auth.uid() = user_id);

drop policy if exists feed_likes_select on public.feed_likes;
create policy feed_likes_select
  on public.feed_likes for select
  using (true);

drop policy if exists feed_likes_insert_own on public.feed_likes;
create policy feed_likes_insert_own
  on public.feed_likes for insert
  with check (auth.uid() = user_id);

drop policy if exists feed_likes_delete_own on public.feed_likes;
create policy feed_likes_delete_own
  on public.feed_likes for delete
  using (auth.uid() = user_id);

drop policy if exists feed_daily_winners_select on public.feed_daily_winners;
create policy feed_daily_winners_select
  on public.feed_daily_winners for select
  using (true);

drop policy if exists feed_reports_insert_own on public.feed_reports;
create policy feed_reports_insert_own
  on public.feed_reports for insert
  with check (auth.uid() = reporter_id);

drop policy if exists pigeon_scans_select_own on public.pigeon_scans;
create policy pigeon_scans_select_own
  on public.pigeon_scans for select
  using (auth.uid() = user_id);

drop policy if exists pigeon_scans_insert_own on public.pigeon_scans;
create policy pigeon_scans_insert_own
  on public.pigeon_scans for insert
  with check (auth.uid() = user_id);

drop policy if exists pigeon_scans_update_own on public.pigeon_scans;
create policy pigeon_scans_update_own
  on public.pigeon_scans for update
  using (auth.uid() = user_id);

drop policy if exists pigeon_scans_delete_own on public.pigeon_scans;
create policy pigeon_scans_delete_own
  on public.pigeon_scans for delete
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 新規ユーザー → profiles 自動作成
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, avatar_id)
  values (new.id, 'ぽっぽ野郎', 'jk')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- 今日のベストぽっぽ更新
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- Storage: feed-images（公開読み取り・本人フォルダのみ書き込み）
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('feed-images', 'feed-images', true)
on conflict (id) do update set public = true;

drop policy if exists feed_images_public_read on storage.objects;
create policy feed_images_public_read
  on storage.objects for select
  using (bucket_id = 'feed-images');

drop policy if exists feed_images_upload_own on storage.objects;
create policy feed_images_upload_own
  on storage.objects for insert
  with check (
    bucket_id = 'feed-images'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists feed_images_update_own on storage.objects;
create policy feed_images_update_own
  on storage.objects for update
  using (
    bucket_id = 'feed-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists feed_images_delete_own on storage.objects;
create policy feed_images_delete_own
  on storage.objects for delete
  using (
    bucket_id = 'feed-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- ---------------------------------------------------------------------------
-- Storage: scan-images（コレクション写真）
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('scan-images', 'scan-images', true)
on conflict (id) do update set public = true;

drop policy if exists scan_images_public_read on storage.objects;
create policy scan_images_public_read
  on storage.objects for select
  using (bucket_id = 'scan-images');

drop policy if exists scan_images_upload_own on storage.objects;
create policy scan_images_upload_own
  on storage.objects for insert
  with check (
    bucket_id = 'scan-images'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists scan_images_update_own on storage.objects;
create policy scan_images_update_own
  on storage.objects for update
  using (
    bucket_id = 'scan-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists scan_images_delete_own on storage.objects;
create policy scan_images_delete_own
  on storage.objects for delete
  using (
    bucket_id = 'scan-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- ---------------------------------------------------------------------------
-- 匿名ユーザー -> Appleログイン時のデータ引き継ぎ
-- ---------------------------------------------------------------------------
create or replace function public.migrate_user_data(from_user uuid, to_user uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or auth.uid() <> to_user then
    raise exception 'not allowed';
  end if;

  if from_user is null or to_user is null or from_user = to_user then
    return;
  end if;

  insert into public.profiles (id, display_name, avatar_id, updated_at)
  select to_user, p.display_name, p.avatar_id, now()
  from public.profiles p
  where p.id = from_user
  on conflict (id) do update
    set display_name = excluded.display_name,
        avatar_id = excluded.avatar_id,
        updated_at = now();

  update public.feed_posts
  set user_id = to_user
  where user_id = from_user;

  delete from public.feed_likes l
  using public.feed_likes keep
  where l.user_id = from_user
    and keep.user_id = to_user
    and keep.post_id = l.post_id;

  update public.feed_likes
  set user_id = to_user
  where user_id = from_user;

  if to_regclass('public.feed_daily_winners') is not null then
    update public.feed_daily_winners
    set user_id = to_user
    where user_id = from_user;
  end if;

  update public.pigeon_scans
  set user_id = to_user
  where user_id = from_user;

  delete from public.feed_reports r
  using public.feed_reports keep
  where r.reporter_id = from_user
    and keep.reporter_id = to_user
    and keep.post_id = r.post_id;

  update public.feed_reports
  set reporter_id = to_user
  where reporter_id = from_user;

  update public.profiles
  set best_poppo_wins = (
      select count(*)
      from public.feed_daily_winners w
      where w.user_id = to_user
    ),
    updated_at = now()
  where id = to_user;

  delete from public.profiles where id = from_user;
end;
$$;

grant execute on function public.migrate_user_data(uuid, uuid) to authenticated;
