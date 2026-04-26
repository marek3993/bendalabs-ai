import type { SiteAudit } from "@/lib/site-audit/schema";

export type ExampleUserFlowRecord = SiteAudit["example_user_flows"][number];

export type AuditInsert = {
  inputUrl: string;
  normalizedDomain: string;
  fitScore: number;
  isGoodFit: boolean;
  siteType: string;
  recommendedAiType: string[];
  summary: string;
  frictionPoints: string[];
  upsellOpportunities: string[];
  phaseOnePlan: string[];
  exampleUserFlows: ExampleUserFlowRecord[];
  userAgent: string | null;
  ipHash: string | null;
  referrer: string | null;
};

export type AuditRecord = {
  id: string;
  created_at: string;
  input_url: string;
  normalized_domain: string;
  fit_score: number;
  is_good_fit: boolean;
  site_type: string;
  recommended_ai_type: string[];
  summary: string;
  friction_points: string[];
  upsell_opportunities: string[];
  phase_one_plan: string[];
  example_user_flows: ExampleUserFlowRecord[];
  user_agent: string | null;
  ip_hash: string | null;
  referrer: string | null;
};

export type LeadRollup = {
  normalized_domain: string;
  audit_count: number;
  last_seen: string;
  last_fit_score: number;
  last_site_type: string;
  last_summary: string;
  last_recommended_ai_type: string[];
  is_high_fit: boolean;
  is_hot_lead: boolean;
  is_returning_interest: boolean;
};

export type LeadStatusFilter = "all" | "hot" | "high-fit" | "returning";
export type LeadSort = "last-seen" | "audit-count" | "fit-score";

export type DomainLeadSnapshot = {
  auditCount: number;
  isHotLead: boolean;
  isHighFit: boolean;
  isReturningInterest: boolean;
};

export type ContactRequestSource = "audit_result" | "contact_section";

export type ContactRequestInsert = {
  name: string;
  email: string;
  website: string;
  message: string;
  source: ContactRequestSource;
  normalizedDomain: string;
  linkedAuditDomain: string | null;
  userAgent: string | null;
  referrer: string | null;
};

export type ContactRequestRecord = {
  id: string;
  created_at: string;
  name: string;
  email: string;
  website: string;
  message: string;
  source: ContactRequestSource;
  normalized_domain: string;
  linked_audit_domain: string | null;
  user_agent: string | null;
  referrer: string | null;
};
