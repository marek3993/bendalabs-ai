create extension if not exists pgcrypto;

create table if not exists public.site_audits (
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

create index if not exists site_audits_created_at_idx
  on public.site_audits (created_at desc);

create index if not exists site_audits_normalized_domain_idx
  on public.site_audits (normalized_domain, created_at desc);

drop view if exists public.audit_lead_rollups;

create view public.audit_lead_rollups as
select
  normalized_domain,
  count(*)::int as audit_count,
  max(created_at) as last_seen,
  (array_agg(fit_score order by created_at desc, id desc))[1] as last_fit_score,
  (array_agg(site_type order by created_at desc, id desc))[1] as last_site_type,
  (array_agg(summary order by created_at desc, id desc))[1] as last_summary,
  (array_agg(recommended_ai_type order by created_at desc, id desc))[1] as last_recommended_ai_type,
  (array_agg(fit_score order by created_at desc, id desc))[1] >= 8 as is_high_fit,
  count(*) >= 3 as is_hot_lead,
  count(*) filter (where created_at >= now() - interval '7 days') >= 2 as is_returning_interest
from public.site_audits
group by normalized_domain;
