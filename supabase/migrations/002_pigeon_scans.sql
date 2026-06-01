-- 既存プロジェクト向け: コレクション（スキャン）クラウド同期
-- SQL Editor で実行（schema.sql 実行済みの人向け）

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

alter table public.pigeon_scans enable row level security;

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
