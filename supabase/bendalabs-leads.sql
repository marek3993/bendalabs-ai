begin;
create extension if not exists pgcrypto;

create table if not exists public.bendalabs_site_audits (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default timezone('utc', now()),
  input_url text not null,
  normalized_domain text not null,
  fit_score smallint not null check (fit_score between 1 and 10),
  is_good_fit boolean not null,
  site_type text not null,
  recommended_ai_type text[] not null default '{}',
  summary text not null,
  friction_points text[] not null default '{}',
  upsell_opportunities text[] not null default '{}',
  phase_one_plan text[] not null default '{}',
  example_user_flows jsonb not null default '[]'::jsonb,
  user_agent text,
  ip_hash text,
  referrer text
);

create index if not exists bendalabs_site_audits_created_at_idx
  on public.bendalabs_site_audits (created_at desc);

create index if not exists bendalabs_site_audits_normalized_domain_idx
  on public.bendalabs_site_audits (normalized_domain, created_at desc);

drop view if exists public.bendalabs_audit_lead_rollups;

create view public.bendalabs_audit_lead_rollups with (security_invoker = true) as
with ranked_audits as (
  select
    id,
    normalized_domain,
    created_at,
    fit_score,
    site_type,
    summary,
    recommended_ai_type,
    row_number() over (
      partition by normalized_domain
      order by created_at desc, id desc
    ) as row_num
  from public.bendalabs_site_audits
),
domain_rollups as (
  select
    normalized_domain,
    count(*)::int as audit_count,
    max(created_at) as last_seen,
    count(*) >= 3 as is_hot_lead,
    count(*) filter (where created_at >= now() - interval '7 days') >= 2 as is_returning_interest
  from public.bendalabs_site_audits
  group by normalized_domain
)
select
  domain_rollups.normalized_domain,
  domain_rollups.audit_count,
  domain_rollups.last_seen,
  ranked_audits.fit_score as last_fit_score,
  ranked_audits.site_type as last_site_type,
  ranked_audits.summary as last_summary,
  ranked_audits.recommended_ai_type as last_recommended_ai_type,
  ranked_audits.fit_score >= 8 as is_high_fit,
  domain_rollups.is_hot_lead,
  domain_rollups.is_returning_interest
from domain_rollups
join ranked_audits
  on ranked_audits.normalized_domain = domain_rollups.normalized_domain
 and ranked_audits.row_num = 1;

create table if not exists public.bendalabs_contact_requests (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default timezone('utc', now()),
  name text not null,
  email text not null,
  website text not null,
  message text not null,
  source text not null check (source in ('audit_result', 'contact_section')),
  normalized_domain text not null,
  linked_audit_domain text,
  referrer text,
  user_agent text
);

create index if not exists bendalabs_contact_requests_created_at_idx
  on public.bendalabs_contact_requests (created_at desc);

create index if not exists bendalabs_contact_requests_normalized_domain_idx
  on public.bendalabs_contact_requests (normalized_domain, created_at desc);

create index if not exists bendalabs_contact_requests_linked_audit_domain_idx
  on public.bendalabs_contact_requests (linked_audit_domain, created_at desc);

create table if not exists public.bendalabs_audit_failures (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default timezone('utc', now()),
  input_url text not null,
  normalized_domain text not null,
  reason text not null check (reason in ('crawler_blocked', 'load_failed')),
  classification text check (classification in ('crawler_blocked', 'fetch_blocked', 'protected_site')),
  http_status integer,
  technical_message text not null,
  user_agent text,
  ip_hash text,
  referrer text
);

create index if not exists bendalabs_audit_failures_created_at_idx
  on public.bendalabs_audit_failures (created_at desc);

create index if not exists bendalabs_audit_failures_normalized_domain_idx
  on public.bendalabs_audit_failures (normalized_domain, created_at desc);

alter table if exists public.bendalabs_contact_requests
  drop constraint if exists bendalabs_contact_requests_source_check;

alter table if exists public.bendalabs_contact_requests
  add constraint bendalabs_contact_requests_source_check
  check (source in ('audit_result', 'contact_section', 'ai_navrh_na_mieru'));

alter table public.bendalabs_site_audits enable row level security;
alter table public.bendalabs_contact_requests enable row level security;
alter table public.bendalabs_audit_failures enable row level security;
revoke all on public.bendalabs_site_audits, public.bendalabs_contact_requests, public.bendalabs_audit_failures, public.bendalabs_audit_lead_rollups from public, anon, authenticated;
grant select, insert on public.bendalabs_site_audits, public.bendalabs_contact_requests, public.bendalabs_audit_failures to service_role;
grant select on public.bendalabs_audit_lead_rollups to service_role;

commit;
