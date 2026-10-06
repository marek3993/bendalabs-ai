-- Private student questions and project enquiries, isolated from lesson feedback.
create table public.university_student_support (
  submission_id uuid primary key,
  kind text not null check (kind in ('question', 'project')),
  lang text not null check (lang in ('sk', 'en')),
  name text not null default '' check (char_length(name) <= 100),
  email text not null check (char_length(email) <= 254 and email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'),
  project_url text not null default '' check (char_length(project_url) <= 2000 and (project_url = '' or project_url ~ '^https://')),
  message text not null check (char_length(btrim(message)) between 20 and 4000),
  consent_version text not null default '2026-10-v1' check (consent_version = '2026-10-v1'),
  created_at timestamptz not null default now(),
  status text not null default 'new' check (status in ('new', 'reviewed')),
  reviewed_at timestamptz
);
create index university_student_support_created_idx on public.university_student_support (created_at desc, submission_id desc);
create index university_student_support_filter_idx on public.university_student_support (status, kind, created_at desc);

create table public.university_support_rate_limits (
  actor_hash text not null check (actor_hash ~ '^[0-9a-f]{64}$'),
  window_start timestamptz not null,
  window_seconds integer not null check (window_seconds in (3600, 86400)),
  submissions integer not null default 0 check (submissions >= 0),
  primary key (actor_hash, window_start, window_seconds)
);
alter table public.university_student_support enable row level security;
alter table public.university_support_rate_limits enable row level security;
revoke all on public.university_student_support, public.university_support_rate_limits from public, anon, authenticated;
grant select, insert, update, delete on public.university_student_support, public.university_support_rate_limits to service_role;

create function public.university_submit_support(
  p_submission_id uuid, p_kind text, p_lang text, p_name text, p_email text,
  p_project_url text, p_message text, p_consent boolean, p_actor_hash text
) returns text language plpgsql security invoker set search_path = '' as $$
declare
  existing public.university_student_support%rowtype;
  hour_start timestamptz := date_trunc('hour', now(), 'UTC');
  day_start timestamptz := date_trunc('day', now(), 'UTC');
begin
  if p_submission_id is null or p_consent is distinct from true
    or p_actor_hash is null or p_actor_hash !~ '^[0-9a-f]{64}$'
    or p_kind is null or p_kind not in ('question', 'project')
    or p_lang is null or p_lang not in ('sk', 'en')
    or p_name is null or char_length(p_name) > 100 or p_name ~ '[[:cntrl:]]'
    or p_email is null or char_length(p_email) > 254 or p_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' or p_email ~ '[[:cntrl:]]'
    or p_project_url is null or char_length(p_project_url) > 2000 or (p_project_url <> '' and p_project_url !~ '^https://[^/[:space:]]+') or p_project_url ~ '[[:cntrl:]]'
    or p_message is null or char_length(btrim(p_message)) < 20 or char_length(p_message) > 4000 then return 'invalid'; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_submission_id::text, 92729));
  select * into existing from public.university_student_support where submission_id = p_submission_id;
  if found then
    if existing.kind = p_kind and existing.lang = p_lang and existing.name = p_name and existing.email = p_email
      and existing.project_url = p_project_url and existing.message = p_message then return 'duplicate'; end if;
    return 'conflict';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(p_actor_hash, 92730));
  if exists (select 1 from public.university_support_rate_limits where actor_hash = p_actor_hash and
    ((window_start = hour_start and window_seconds = 3600 and submissions >= 30)
    or (window_start = day_start and window_seconds = 86400 and submissions >= 120))) then return 'rate_limited'; end if;
  insert into public.university_student_support (submission_id, kind, lang, name, email, project_url, message)
  values (p_submission_id, p_kind, p_lang, p_name, p_email, p_project_url, p_message);
  insert into public.university_support_rate_limits (actor_hash, window_start, window_seconds, submissions)
  values (p_actor_hash, hour_start, 3600, 1), (p_actor_hash, day_start, 86400, 1)
  on conflict (actor_hash, window_start, window_seconds) do update set submissions = public.university_support_rate_limits.submissions + 1;
  delete from public.university_support_rate_limits where window_start < now() - interval '2 days';
  return 'stored';
end;
$$;
revoke all on function public.university_submit_support(uuid, text, text, text, text, text, text, boolean, text) from public, anon, authenticated;
grant execute on function public.university_submit_support(uuid, text, text, text, text, text, text, boolean, text) to service_role;
