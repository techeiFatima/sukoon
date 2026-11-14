-- Row Level Security tests. Run with scripts/test-rls.sh.
\set ON_ERROR_STOP on
\pset tuples_only on
\o /dev/null
\set A '''aaaaaaaa-0000-0000-0000-000000000001'''
\set B '''bbbbbbbb-0000-0000-0000-000000000002'''

insert into auth.users (id, email) values (:A, 'a@example.test'), (:B, 'b@example.test');

create or replace function pg_temp.expect_fail(sql text, label text) returns void language plpgsql as $$
begin
  begin
    execute sql;
  exception when others then
    raise notice 'PASS  %', label;
    return;
  end;
  raise exception 'FAIL  % (statement succeeded but should have been rejected)', label;
end $$;

create or replace function pg_temp.expect_eq(actual bigint, expected bigint, label text) returns void language plpgsql as $$
begin
  if actual is distinct from expected then
    raise exception 'FAIL  % (expected %, got %)', label, expected, actual;
  end if;
  raise notice 'PASS  %', label;
end $$;

-- ── As user A ──
set role authenticated;
select set_config('request.jwt.claim.sub', :A, false);
insert into public.profiles (id, experience) values (:A, 'islamic');
insert into public.reflections (kind, date, body) values ('journal', current_date, 'A private thought');
insert into public.knowledge_notes (title) values ('Linear algebra'), ('Neural networks');
insert into public.personal_values (name) values ('Knowledge');
select pg_temp.expect_eq((select count(*) from public.reflections), 1, 'A sees own reflection');
select pg_temp.expect_eq((select count(*) from public.reflections where user_id = :A), 1, 'user_id defaulted to auth.uid()');
select pg_temp.expect_fail(format('insert into public.reflections (user_id, kind, date, body) values (%L, ''journal'', current_date, ''forged'')', :B), 'A cannot insert rows as B');
select pg_temp.expect_fail(format('insert into public.profiles (id) values (%L)', :B), 'A cannot create B''s profile');
select pg_temp.expect_fail('update public.profiles set ai_mode = ''cloud''', 'cloud AI requires recorded consent');
insert into public.saved_lectures (video_id, title, channel_id, channel_name)
  select 'AbCdEfGhIj' || g, 'Lecture ' || g, 'UCaaaaaaaaaaaaaaaaaaaaaa', 'Teacher' from generate_series(1, 5) g;
select pg_temp.expect_fail('insert into public.saved_lectures (video_id, title, channel_id, channel_name) values (''AbCdEfGhIj6'', ''Sixth'', ''UCaaaaaaaaaaaaaaaaaaaaaa'', ''Teacher'')', 'watch list capped at 5');
update public.saved_lectures set status = 'watched' where video_id = 'AbCdEfGhIj1';
insert into public.saved_lectures (video_id, title, channel_id, channel_name) values ('AbCdEfGhIj6', 'Sixth', 'UCaaaaaaaaaaaaaaaaaaaaaa', 'Teacher');
select pg_temp.expect_eq((select count(*) from public.saved_lectures where status = 'to_watch'), 5, 'watching one frees a slot');
select pg_temp.expect_fail('insert into public.lecture_sources (channel_id, name) values (''not-a-channel'', ''x'')', 'lecture source requires a valid channel ID');

reset role;
select id as a_note from public.knowledge_notes where title = 'Linear algebra' \gset
set role authenticated;

-- ── As user B ──
select set_config('request.jwt.claim.sub', :B, false);
select pg_temp.expect_eq((select count(*) from public.reflections), 0, 'B cannot read A''s reflections');
select pg_temp.expect_eq((select count(*) from public.profiles), 0, 'B cannot read A''s profile');
select pg_temp.expect_eq((select count(*) from public.knowledge_notes), 0, 'B cannot read A''s notes');
select pg_temp.expect_eq((select count(*) from public.saved_lectures), 0, 'B cannot read A''s watch list');
insert into public.saved_lectures (video_id, title, channel_id, channel_name) values ('AbCdEfGhIj7', 'B lecture', 'UCaaaaaaaaaaaaaaaaaaaaaa', 'Teacher');
select pg_temp.expect_eq((select count(*) from public.saved_lectures), 1, 'B''s watch-list cap is independent of A''s');
update public.reflections set body = 'tampered';
delete from public.reflections;
insert into public.knowledge_notes (title) values ('B note');
select pg_temp.expect_fail(
  format('insert into public.knowledge_connections (from_note_id, to_note_id) select id, %L::uuid from public.knowledge_notes where title = ''B note''', :'a_note'),
  'B cannot connect their note to A''s note');
reset role;

-- B's update/delete must not have touched A's row.
select pg_temp.expect_eq((select count(*) from public.reflections where body = 'A private thought'), 1, 'A''s reflection untouched by B''s update/delete');

-- ── Anonymous ──
set role anon;
select pg_temp.expect_fail('select count(*) from public.reflections', 'anon has no access to reflections');
select pg_temp.expect_fail('select public.delete_my_account()', 'anon cannot call delete_my_account');
reset role;

-- ── Account deletion ──
set role authenticated;
select set_config('request.jwt.claim.sub', :A, false);
-- A cannot re-own a row to B
select pg_temp.expect_fail(format('update public.reflections set user_id = %L', :B), 'A cannot transfer a row to B');
select public.delete_my_account();
reset role;
select pg_temp.expect_eq((select count(*) from auth.users where id = :A), 0, 'delete_my_account removes the caller');
select pg_temp.expect_eq((select count(*) from auth.users where id = :B), 1, 'delete_my_account leaves others intact');
select pg_temp.expect_eq((select count(*) from public.reflections where user_id = :A), 0, 'A''s data cascaded away');
select pg_temp.expect_eq((select count(*) from public.knowledge_notes where user_id = :B), 1, 'B''s data intact');
\echo 'All RLS tests passed.'
