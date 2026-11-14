-- ════════════════════════════════════════════════════════════════════
-- Sukoon — initial schema
--
-- Principles enforced here:
--   • Every table is private to its owner via Row Level Security.
--   • user_id defaults to auth.uid() and is checked on insert/update, so a
--     client can never read or write someone else's rows.
--   • No public, shared, or aggregate tables exist. Reflections are never
--     readable by anyone other than their author (not even other users of
--     the anon key). Service-role access is limited to operators.
--   • Deleting an auth user cascades to all of their data.
--
-- "users" are Supabase's built-in auth.users; "profiles" extends them.
-- ════════════════════════════════════════════════════════════════════

create extension if not exists "pgcrypto";

-- ── Helpers ─────────────────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ── profiles ────────────────────────────────────────────────────────
create table public.profiles (
  id             uuid primary key references auth.users (id) on delete cascade,
  display_name   text check (char_length(display_name) <= 40),
  experience     text not null default 'general' check (experience in ('islamic', 'general')),
  tradition      text not null default 'unspecified' check (tradition in ('unspecified', 'sunni', 'shia', 'both')),
  motivations    text[] not null default '{}',
  change_note    text check (char_length(change_note) <= 1000),
  ai_mode        text not null default 'local' check (ai_mode in ('off', 'local', 'cloud')),
  ai_consent_at  timestamptz,
  onboarded_at   timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- Cloud reflection requires recorded consent.
alter table public.profiles add constraint ai_cloud_requires_consent
  check (ai_mode <> 'cloud' or ai_consent_at is not null);

-- ── Generic owned-row columns are repeated per table for clarity. ───

create table public.daily_intentions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  date        date not null,
  text        text not null check (char_length(text) between 1 and 300),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (user_id, date)
);

create table public.reflections (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  kind        text not null check (kind in ('daily', 'journal', 'soul', 'learning')),
  date        date not null,
  prompt      text,
  body        text not null check (char_length(body) <= 20000),
  context     text, -- topic slug (soul) or learning journey id (learning)
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index reflections_user_kind_date on public.reflections (user_id, kind, date desc);

create table public.attention_checkins (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  date        date not null,
  categories  text[] not null default '{}',
  note        text check (char_length(note) <= 2000),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index attention_user_date on public.attention_checkins (user_id, date desc);

create table public.personal_values (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name        text not null check (char_length(name) between 1 and 40),
  meaning     text check (char_length(meaning) <= 2000),
  position    int not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table public.commitments (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  date        date not null,
  title       text not null check (char_length(title) between 1 and 160),
  done        boolean not null default false,
  done_at     timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index commitments_user_date on public.commitments (user_id, date desc);

create table public.learning_journeys (
  id                     uuid primary key default gen_random_uuid(),
  user_id                uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title                  text not null check (char_length(title) between 1 and 160),
  objective              text,
  current_understanding  text,
  topics                 jsonb not null default '[]'::jsonb, -- [{id, title, done}]
  status                 text not null default 'active' check (status in ('active', 'paused', 'complete')),
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

create table public.knowledge_notes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title       text not null check (char_length(title) between 1 and 160),
  body        text check (char_length(body) <= 20000),
  tags        text[] not null default '{}',
  collection  text,
  journey_id  uuid references public.learning_journeys (id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table public.knowledge_connections (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users (id) on delete cascade,
  from_note_id  uuid not null references public.knowledge_notes (id) on delete cascade,
  to_note_id    uuid not null references public.knowledge_notes (id) on delete cascade,
  label         text check (char_length(label) <= 80),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  check (from_note_id <> to_note_id),
  unique (from_note_id, to_note_id)
);

create table public.saved_resources (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  kind        text not null check (kind in ('book', 'article', 'lecture', 'paper', 'video', 'quote')),
  title       text not null check (char_length(title) between 1 and 2000),
  author      text,
  url         text check (url is null or url ~* '^https?://'),
  note        text,
  collection  text,
  status      text not null default 'to_explore' check (status in ('to_explore', 'in_progress', 'finished')),
  journey_id  uuid references public.learning_journeys (id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table public.personal_goals (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  area        text not null check (area in ('spiritual', 'intellectual', 'personal', 'professional', 'social', 'financial')),
  title       text not null check (char_length(title) between 1 and 200),
  why         text,
  steps       jsonb not null default '[]'::jsonb, -- [{id, title, done}]
  status      text not null default 'active' check (status in ('active', 'complete', 'released')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ── Supporting tables (Mind and My Life) ────────────────────────────

create table public.diet_items (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  direction   text not null check (direction in ('more', 'less')),
  label       text not null check (char_length(label) between 1 and 80),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table public.boundaries (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title        text not null check (char_length(title) between 1 and 120),
  description  text,
  active       boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table public.focus_sessions (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null default auth.uid() references auth.users (id) on delete cascade,
  boundary_id      uuid references public.boundaries (id) on delete set null,
  intention        text,
  planned_minutes  int not null check (planned_minutes between 1 and 600),
  actual_minutes   int not null check (actual_minutes between 0 and 600),
  reflection       text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create table public.offline_actions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title       text not null check (char_length(title) between 1 and 160),
  date        date not null,
  note        text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table public.alignment_reflections (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null default auth.uid() references auth.users (id) on delete cascade,
  value_id          uuid not null references public.personal_values (id) on delete cascade,
  current_behavior  text,
  small_change      text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (user_id, value_id)
);

-- ── Triggers, RLS and policies for every table ──────────────────────
do $$
declare t text;
begin
  foreach t in array array[
    'daily_intentions', 'reflections', 'attention_checkins', 'personal_values', 'commitments',
    'learning_journeys', 'knowledge_notes', 'knowledge_connections', 'saved_resources', 'personal_goals',
    'diet_items', 'boundaries', 'focus_sessions', 'offline_actions', 'alignment_reflections'
  ] loop
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

create trigger profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();
alter table public.profiles enable row level security;
alter table public.profiles force row level security;
create policy "owner can select profile" on public.profiles for select to authenticated using (id = (select auth.uid()));
create policy "owner can insert profile" on public.profiles for insert to authenticated with check (id = (select auth.uid()));
create policy "owner can update profile" on public.profiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));
revoke all on public.profiles from anon;

-- Connections may only join two notes owned by the same user.
create or replace function public.check_connection_owner()
returns trigger language plpgsql security invoker as $$
begin
  if not exists (select 1 from public.knowledge_notes where id = new.from_note_id and user_id = new.user_id)
     or not exists (select 1 from public.knowledge_notes where id = new.to_note_id and user_id = new.user_id) then
    raise exception 'Both notes must belong to you';
  end if;
  return new;
end $$;
create trigger knowledge_connections_owner before insert or update on public.knowledge_connections
  for each row execute function public.check_connection_owner();

-- Alignment reflections may only reference the user's own values.
create or replace function public.check_alignment_owner()
returns trigger language plpgsql security invoker as $$
begin
  if not exists (select 1 from public.personal_values where id = new.value_id and user_id = new.user_id) then
    raise exception 'Value must belong to you';
  end if;
  return new;
end $$;
create trigger alignment_owner before insert or update on public.alignment_reflections
  for each row execute function public.check_alignment_owner();

-- ── Account deletion ────────────────────────────────────────────────
-- Lets a signed-in user permanently delete their own account. All rows
-- cascade from auth.users. Runs as definer (needed to touch auth.users)
-- but can only ever delete the caller.
create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;
  delete from auth.users where id = uid;
end $$;

revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
