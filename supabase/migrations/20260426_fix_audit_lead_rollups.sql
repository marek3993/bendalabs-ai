create or replace view public.audit_lead_rollups as
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
  from public.site_audits
),
domain_rollups as (
  select
    normalized_domain,
    count(*)::int as audit_count,
    max(created_at) as last_seen,
    count(*) >= 3 as is_hot_lead,
    count(*) filter (where created_at >= now() - interval '7 days') >= 2 as is_returning_interest
  from public.site_audits
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
