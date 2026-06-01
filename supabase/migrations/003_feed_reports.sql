-- フィード投稿の通報
create table if not exists public.feed_reports (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.feed_posts (id) on delete cascade,
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  reason text not null,
  created_at timestamptz not null default now(),
  unique (post_id, reporter_id)
);

create index if not exists feed_reports_post_idx on public.feed_reports (post_id);

alter table public.feed_reports enable row level security;

drop policy if exists feed_reports_insert_own on public.feed_reports;
create policy feed_reports_insert_own
  on public.feed_reports for insert
  with check (auth.uid() = reporter_id);
