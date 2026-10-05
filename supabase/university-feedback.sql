-- Isolated storage for BendaLabs Robotics University. Existing application tables are untouched.
create table public.university_lesson_feedback (
  submission_id uuid primary key,
  chapter_id text not null check (chapter_id ~ '^[a-z0-9-]{1,64}$'),
  lang text not null check (lang in ('sk', 'en')),
  rating smallint check (rating between 1 and 5),
  suggestion text not null default '' check (char_length(suggestion) <= 2000 and (suggestion = '' or char_length(btrim(suggestion)) >= 10)),
  created_at timestamptz not null default now(),
  status text not null default 'new' check (status in ('new', 'reviewed')),
  reviewed_at timestamptz,
  check (rating is not null or char_length(btrim(suggestion)) >= 10)
);
create index university_lesson_feedback_created_idx on public.university_lesson_feedback (created_at desc, submission_id);
create index university_lesson_feedback_chapter_status_idx on public.university_lesson_feedback (chapter_id, status, created_at desc);

create table public.university_feedback_rate_limits (
  actor_hash text not null check (actor_hash ~ '^[0-9a-f]{64}$'),
  window_start timestamptz not null,
  window_seconds integer not null check (window_seconds in (3600, 86400)),
  submissions integer not null default 0 check (submissions >= 0),
  primary key (actor_hash, window_start, window_seconds)
);

alter table public.university_lesson_feedback enable row level security;
alter table public.university_feedback_rate_limits enable row level security;
revoke all on public.university_lesson_feedback, public.university_feedback_rate_limits from public, anon, authenticated;
grant select, insert, update, delete on public.university_lesson_feedback, public.university_feedback_rate_limits to service_role;

create function public.university_submit_feedback(
  p_submission_id uuid, p_chapter_id text, p_lang text, p_rating integer,
  p_suggestion text, p_actor_hash text
) returns text language plpgsql security invoker set search_path = '' as $$
declare
  existing public.university_lesson_feedback%rowtype;
  hour_start timestamptz := date_trunc('hour', now(), 'UTC');
  day_start timestamptz := date_trunc('day', now(), 'UTC');
begin
  if p_actor_hash is null or p_actor_hash !~ '^[0-9a-f]{64}$' or p_submission_id is null
    or p_chapter_id is null or p_chapter_id !~ '^[a-z0-9-]{1,64}$'
    or p_lang is null or p_lang not in ('sk', 'en')
    or (p_rating is not null and p_rating not between 1 and 5)
    or p_suggestion is null or char_length(p_suggestion) > 2000
    or (p_suggestion <> '' and char_length(btrim(p_suggestion)) < 10)
    or (p_rating is null and char_length(btrim(p_suggestion)) < 10) then return 'invalid'; end if;

  -- One transaction serializes retries of an id, then all requests from a rotating pseudonym.
  perform pg_advisory_xact_lock(hashtextextended(p_submission_id::text, 92719));
  select * into existing from public.university_lesson_feedback where submission_id = p_submission_id;
  if found then
    if existing.chapter_id = p_chapter_id and existing.lang = p_lang
      and existing.rating is not distinct from p_rating and existing.suggestion = p_suggestion then return 'duplicate'; end if;
    return 'conflict';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(p_actor_hash, 92720));
  if exists (select 1 from public.university_feedback_rate_limits where actor_hash = p_actor_hash and
    ((window_start = hour_start and window_seconds = 3600 and submissions >= 60)
    or (window_start = day_start and window_seconds = 86400 and submissions >= 240))) then return 'rate_limited'; end if;

  insert into public.university_lesson_feedback (submission_id, chapter_id, lang, rating, suggestion)
  values (p_submission_id, p_chapter_id, p_lang, p_rating, p_suggestion);
  insert into public.university_feedback_rate_limits (actor_hash, window_start, window_seconds, submissions)
  values (p_actor_hash, hour_start, 3600, 1), (p_actor_hash, day_start, 86400, 1)
  on conflict (actor_hash, window_start, window_seconds) do update set submissions = public.university_feedback_rate_limits.submissions + 1;
  delete from public.university_feedback_rate_limits where window_start < now() - interval '2 days';
  return 'stored';
end;
$$;
revoke all on function public.university_submit_feedback(uuid, text, text, integer, text, text) from public, anon, authenticated;
grant execute on function public.university_submit_feedback(uuid, text, text, integer, text, text) to service_role;

create function public.university_feedback_summary()
returns table (chapter_id text, feedback_count bigint, rating_count bigint, average_rating numeric, suggestion_count bigint, new_count bigint)
language sql stable security invoker set search_path = '' as $$
  select chapter_id, count(*), count(rating), round(avg(rating), 2),
    count(*) filter (where suggestion <> ''), count(*) filter (where status = 'new')
  from public.university_lesson_feedback group by chapter_id;
$$;
revoke all on function public.university_feedback_summary() from public, anon, authenticated;
grant execute on function public.university_feedback_summary() to service_role;
