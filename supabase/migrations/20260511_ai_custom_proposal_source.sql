alter table if exists public.contact_requests
  drop constraint if exists contact_requests_source_check;

alter table if exists public.contact_requests
  add constraint contact_requests_source_check
  check (source in ('audit_result', 'contact_section', 'ai_navrh_na_mieru'));
