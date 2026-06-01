-- 匿名ユーザー -> Appleログイン時のデータ引き継ぎ
-- 呼び出し: select public.migrate_user_data('<from_uuid>', '<to_uuid>');

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

  if to_regclass('public.feed_likes') is not null then
    delete from public.feed_likes l
    using public.feed_likes keep
    where l.user_id = from_user
      and keep.user_id = to_user
      and keep.post_id = l.post_id;

    update public.feed_likes
    set user_id = to_user
    where user_id = from_user;
  end if;

  if to_regclass('public.feed_daily_winners') is not null then
    update public.feed_daily_winners
    set user_id = to_user
    where user_id = from_user;
  end if;

  update public.pigeon_scans
  set user_id = to_user
  where user_id = from_user;

  if to_regclass('public.feed_reports') is not null then
    delete from public.feed_reports r
    using public.feed_reports keep
    where r.reporter_id = from_user
      and keep.reporter_id = to_user
      and keep.post_id = r.post_id;

    update public.feed_reports
    set reporter_id = to_user
    where reporter_id = from_user;
  end if;

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
