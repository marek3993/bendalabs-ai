create table if not exists public.audit_failures (
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

create index if not exists audit_failures_created_at_idx
  on public.audit_failures (created_at desc);

create index if not exists audit_failures_normalized_domain_idx
  on public.audit_failures (normalized_domain, created_at desc);
