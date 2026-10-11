-- Additive schema. Existing contacts and audit history are preserved.
create table if not exists public.bendalabs_opportunities (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  source_url text not null unique check (length(source_url) <= 2000 and source_url like 'https://%'),
  title text not null check (length(title) between 1 and 300),
  summary text not null,
  category text not null check (category in ('documents','email','crm','integrations','reporting','other')),
  region text,
  budget_text text,
  published_at timestamptz,
  publication_evidence text,
  fetched_at timestamptz not null,
  source_text text not null,
  demand_excerpt text not null check (length(demand_excerpt) >= 25),
  verification text not null check (verification in ('verified','review','blocked','closed')),
  status text not null default 'new' check (status in ('new','review','proposal','sent','won','lost','archived')),
  score smallint not null default 0 check (score between 0 and 100),
  proposal jsonb,
  check (verification <> 'verified' or (published_at is not null and publication_evidence is not null)),
  check (proposal is null or jsonb_typeof(proposal) = 'object')
);
create index if not exists bendalabs_opportunities_work_idx on public.bendalabs_opportunities(status, published_at desc);
alter table public.bendalabs_opportunities enable row level security;
revoke all on public.bendalabs_opportunities from anon, authenticated;
grant select, insert, update on public.bendalabs_opportunities to service_role;

create table if not exists public.bendalabs_leadpilot_runs (
  id uuid primary key default gen_random_uuid(),
  run_key text not null unique,
  created_at timestamptz not null default now(),
  finished_at timestamptz,
  status text not null check (status in ('running','completed','partial','failed')),
  found integer not null default 0 check (found >= 0),
  saved integer not null default 0 check (saved >= 0),
  skipped integer not null default 0 check (skipped >= 0),
  errors text[] not null default '{}'
);
create index if not exists bendalabs_leadpilot_runs_recent_idx on public.bendalabs_leadpilot_runs(created_at desc);
alter table public.bendalabs_leadpilot_runs enable row level security;
revoke all on public.bendalabs_leadpilot_runs from anon, authenticated;
grant select, insert, update on public.bendalabs_leadpilot_runs to service_role;
