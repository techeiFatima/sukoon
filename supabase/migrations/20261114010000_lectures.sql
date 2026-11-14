-- Lecture library: the person's own trusted sources and their (small) watch list.
-- Vetted sources ship in code (src/content/lectures.ts), not in the database.

create table public.lecture_sources (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  channel_id  text not null check (channel_id ~ '^UC[A-Za-z0-9_-]{22}$'),
  name        text not null check (char_length(name) between 1 and 120),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (user_id, channel_id)
);

create table public.saved_lectures (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users (id) on delete cascade,
  video_id      text not null check (video_id ~ '^[A-Za-z0-9_-]{11}$'),
  title         text not null check (char_length(title) between 1 and 300),
  channel_id    text not null,
  channel_name  text not null,
  published_at  timestamptz,
  topic_slug    text,
  status        text not null default 'to_watch' check (status in ('to_watch', 'watched')),
  takeaway      text check (char_length(takeaway) <= 2000),
  watched_at    timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (user_id, video_id)
);

do $$
declare t text;
begin
  foreach t in array array['lecture_sources', 'saved_lectures'] loop
    execute format('create trigger %1$s_updated_at before update on public.%1$I for each row execute function public.set_updated_at()', t);
    execute format('alter table public.%I enable row level security', t);
    execute format('alter table public.%I force row level security', t);
    execute format('create policy "owner can select" on public.%I for select to authenticated using (user_id = (select auth.uid()))', t);
    execute format('create policy "owner can insert" on public.%I for insert to authenticated with check (user_id = (select auth.uid()))', t);
    execute format('create policy "owner can update" on public.%I for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()))', t);
    execute format('create policy "owner can delete" on public.%I for delete to authenticated using (user_id = (select auth.uid()))', t);
    execute format('revoke all on public.%I from anon', t);
    execute format('create index if not exists %1$s_user_id_idx on public.%1$I (user_id)', t);
  end loop;
end $$;

-- Keep the watch list small at the database level too (mirrors WATCHLIST_LIMIT).
create or replace function public.check_watchlist_limit()
returns trigger language plpgsql security invoker as $$
begin
  if new.status = 'to_watch' and (
    select count(*) from public.saved_lectures
    where user_id = new.user_id and status = 'to_watch' and id <> new.id
  ) >= 5 then
    raise exception 'Your watch list is full. Watch or remove a lecture first.';
  end if;
  return new;
end $$;
create trigger saved_lectures_limit before insert or update on public.saved_lectures
  for each row execute function public.check_watchlist_limit();
