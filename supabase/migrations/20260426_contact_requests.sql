create table if not exists public.contact_requests (
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

create index if not exists contact_requests_created_at_idx
  on public.contact_requests (created_at desc);

create index if not exists contact_requests_normalized_domain_idx
  on public.contact_requests (normalized_domain, created_at desc);

create index if not exists contact_requests_linked_audit_domain_idx
  on public.contact_requests (linked_audit_domain, created_at desc);
