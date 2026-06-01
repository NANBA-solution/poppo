-- フィードのいいね
create table if not exists public.feed_likes (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.feed_posts (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (post_id, user_id)
);

create index if not exists feed_likes_post_idx on public.feed_likes (post_id);
create index if not exists feed_likes_user_idx on public.feed_likes (user_id);

alter table public.feed_likes enable row level security;

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
