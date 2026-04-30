import type { SiteAudit } from "@/lib/site-audit/schema";
import type { AuditErrorType } from "@/lib/site-audit/error";
import { getClientIp, getNormalizedDomain, hashLeadIdentifier, matchesLeadStatus } from "@/lib/leads/domain";
import { sendHotLeadAlert } from "@/lib/leads/alert";
import { isLeadStorageConfigured, parseCountHeader, supabaseRestFetch } from "@/lib/leads/supabase";
import type {
  AuditFailureInsert,
  AuditFailureRecord,
  AuditInsert,
  AuditRecord,
  ContactRequestInsert,
  ContactRequestRecord,
  DomainLeadSnapshot,
  LeadRollup,
  LeadSort,
  LeadStatusFilter,
} from "@/lib/leads/types";

type LeadDashboardQuery = {
  query?: string;
  sort?: LeadSort;
  status?: LeadStatusFilter;
};

type RecentAuditQuery = {
  query?: string;
  limit?: number;
};

type SnapshotAuditRecord = {
  created_at: string;
  fit_score: number;
};

type RecentAuditFailureListItem = Pick<
  AuditFailureRecord,
  | "id"
  | "created_at"
  | "input_url"
  | "normalized_domain"
  | "reason"
  | "classification"
  | "http_status"
  | "referrer"
>;

type RecentAuditListItem = Pick<
  AuditRecord,
  | "id"
  | "created_at"
  | "input_url"
  | "normalized_domain"
  | "fit_score"
  | "is_good_fit"
  | "site_type"
  | "recommended_ai_type"
  | "summary"
  | "referrer"
>;

type RecentContactRequestListItem = Pick<
  ContactRequestRecord,
  | "id"
  | "created_at"
  | "name"
  | "email"
  | "website"
  | "message"
  | "source"
  | "normalized_domain"
  | "linked_audit_domain"
  | "referrer"
>;

function asRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function safeText(value: unknown, fallback = "") {
  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  return fallback;
}

function safeNullableText(value: unknown) {
  return typeof value === "string" ? value : null;
}

function safeNumber(value: unknown, fallback = 0) {
  const parsed =
    typeof value === "number" ? value : typeof value === "string" ? Number(value) : Number.NaN;

  return Number.isFinite(parsed) ? parsed : fallback;
}

function safeBoolean(value: unknown, fallback = false) {
  if (typeof value === "boolean") {
    return value;
  }

  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  return fallback;
}

function safeArray<T>(value: unknown, mapItem?: (item: unknown, index: number) => T) {
  if (!Array.isArray(value)) {
    return [] as T[];
  }

  if (!mapItem) {
    return value as T[];
  }

  return value.map((item, index) => mapItem(item, index));
}

function safeStringArray(value: unknown) {
  if (typeof value === "string") {
    const trimmed = value.trim();

    if (!trimmed) {
      return [];
    }

    try {
      const parsed = JSON.parse(trimmed);

      if (Array.isArray(parsed)) {
        return safeStringArray(parsed);
      }
    } catch {}

    return [trimmed];
  }

  return safeArray(value)
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeExampleUserFlowRecord(value: unknown): AuditRecord["example_user_flows"][number] {
  const record = asRecord(value);

  return {
    user_intent: safeText(record.user_intent),
    ai_action: safeText(record.ai_action),
    business_value: safeText(record.business_value),
  };
}

function normalizeSnapshotAuditRecord(value: unknown): SnapshotAuditRecord {
  const record = asRecord(value);

  return {
    created_at: safeText(record.created_at),
    fit_score: safeNumber(record.fit_score),
  };
}

function normalizeAuditFailureReason(value: unknown): AuditFailureRecord["reason"] {
  return value === "crawler_blocked" ? "crawler_blocked" : "load_failed";
}

function normalizeAuditFailureClassification(
  value: unknown,
): AuditFailureRecord["classification"] {
  return value === "crawler_blocked" || value === "fetch_blocked" || value === "protected_site"
    ? value
    : null;
}

export function normalizeAuditRecord(value: unknown): AuditRecord {
  const record = asRecord(value);

  return {
    id: safeText(record.id),
    created_at: safeText(record.created_at),
    input_url: safeText(record.input_url),
    normalized_domain: safeText(record.normalized_domain),
    fit_score: safeNumber(record.fit_score),
    is_good_fit: safeBoolean(record.is_good_fit),
    site_type: safeText(record.site_type),
    recommended_ai_type: safeStringArray(record.recommended_ai_type),
    summary: safeText(record.summary),
    friction_points: safeStringArray(record.friction_points),
    upsell_opportunities: safeStringArray(record.upsell_opportunities),
    phase_one_plan: safeStringArray(record.phase_one_plan),
    example_user_flows: safeArray(record.example_user_flows, normalizeExampleUserFlowRecord),
    user_agent: safeNullableText(record.user_agent),
    ip_hash: safeNullableText(record.ip_hash),
    referrer: safeNullableText(record.referrer),
  };
}

export function normalizeLeadRollupRecord(value: unknown): LeadRollup {
  const record = asRecord(value);

  return {
    normalized_domain: safeText(record.normalized_domain),
    audit_count: safeNumber(record.audit_count),
    last_seen: safeText(record.last_seen),
    last_fit_score: safeNumber(record.last_fit_score),
    last_site_type: safeText(record.last_site_type),
    last_summary: safeText(record.last_summary),
    last_recommended_ai_type: safeStringArray(record.last_recommended_ai_type),
    is_high_fit: safeBoolean(record.is_high_fit),
    is_hot_lead: safeBoolean(record.is_hot_lead),
    is_returning_interest: safeBoolean(record.is_returning_interest),
  };
}

export function normalizeRecentAuditRecord(value: unknown): RecentAuditListItem {
  const audit = normalizeAuditRecord(value);

  return {
    id: audit.id,
    created_at: audit.created_at,
    input_url: audit.input_url,
    normalized_domain: audit.normalized_domain,
    fit_score: audit.fit_score,
    is_good_fit: audit.is_good_fit,
    site_type: audit.site_type,
    recommended_ai_type: audit.recommended_ai_type,
    summary: audit.summary,
    referrer: audit.referrer ?? "",
  };
}

export function normalizeAuditFailureRecord(value: unknown): AuditFailureRecord {
  const record = asRecord(value);
  const httpStatus =
    typeof record.http_status === "number"
      ? record.http_status
      : typeof record.http_status === "string"
        ? Number(record.http_status)
        : Number.NaN;

  return {
    id: safeText(record.id),
    created_at: safeText(record.created_at),
    input_url: safeText(record.input_url),
    normalized_domain: safeText(record.normalized_domain),
    reason: normalizeAuditFailureReason(record.reason),
    classification: normalizeAuditFailureClassification(record.classification),
    http_status: Number.isFinite(httpStatus) ? httpStatus : null,
    technical_message: safeText(record.technical_message),
    user_agent: safeNullableText(record.user_agent),
    ip_hash: safeNullableText(record.ip_hash),
    referrer: safeNullableText(record.referrer),
  };
}

export function normalizeRecentAuditFailureRecord(value: unknown): RecentAuditFailureListItem {
  const failure = normalizeAuditFailureRecord(value);

  return {
    id: failure.id,
    created_at: failure.created_at,
    input_url: failure.input_url,
    normalized_domain: failure.normalized_domain,
    reason: failure.reason,
    classification: failure.classification,
    http_status: failure.http_status,
    referrer: failure.referrer ?? "",
  };
}

export function normalizeContactRequestRecord(value: unknown): ContactRequestRecord {
  const record = asRecord(value);

  return {
    id: safeText(record.id),
    created_at: safeText(record.created_at),
    name: safeText(record.name),
    email: safeText(record.email),
    website: safeText(record.website),
    message: safeText(record.message),
    source: safeText(record.source) as ContactRequestRecord["source"],
    normalized_domain: safeText(record.normalized_domain),
    linked_audit_domain: safeNullableText(record.linked_audit_domain),
    user_agent: safeNullableText(record.user_agent),
    referrer: safeNullableText(record.referrer),
  };
}

export function normalizeRecentContactRequestRecord(value: unknown): RecentContactRequestListItem {
  return normalizeContactRequestRecord(value);
}

function sanitizeSearchQuery(query: string) {
  return query.trim().replace(/\*/g, "").replace(/\s+/g, " ");
}

function getLeadRollupSort(sort: LeadSort = "last-seen") {
  if (sort === "audit-count") {
    return "audit_count.desc,last_seen.desc";
  }

  if (sort === "fit-score") {
    return "last_fit_score.desc,last_seen.desc";
  }

  return "last_seen.desc";
}

function mapAuditInsert(audit: SiteAudit, inputUrl: string, request: Request): AuditInsert | null {
  const normalizedDomain = getNormalizedDomain(inputUrl);

  if (!normalizedDomain) {
    return null;
  }

  return {
    inputUrl,
    normalizedDomain,
    fitScore: audit.score,
    isGoodFit: audit.is_good_fit,
    siteType: audit.site_type,
    recommendedAiType: audit.recommended_ai_type,
    summary: audit.summary,
    frictionPoints: audit.friction_points,
    upsellOpportunities: audit.upsell_opportunities,
    phaseOnePlan: audit.phase_one_plan,
    exampleUserFlows: audit.example_user_flows,
    userAgent: request.headers.get("user-agent"),
    ipHash: hashLeadIdentifier(getClientIp(request)),
    referrer: request.headers.get("referer") ?? request.headers.get("referrer"),
  };
}

function mapAuditFailureInsert(
  inputUrl: string,
  request: Request,
  failure: {
    reason: AuditFailureInsert["reason"];
    classification: AuditErrorType | null;
    httpStatus?: number | null;
    technicalMessage: string;
  },
): AuditFailureInsert | null {
  const normalizedDomain = getNormalizedDomain(inputUrl);

  if (!normalizedDomain) {
    return null;
  }

  return {
    inputUrl,
    normalizedDomain,
    reason: failure.reason,
    classification: failure.classification,
    httpStatus: failure.httpStatus ?? null,
    technicalMessage: failure.technicalMessage,
    userAgent: request.headers.get("user-agent"),
    ipHash: hashLeadIdentifier(getClientIp(request)),
    referrer: request.headers.get("referer") ?? request.headers.get("referrer"),
  };
}

async function insertAudit(payload: AuditInsert) {
  const response = await supabaseRestFetch("site_audits", {
    method: "POST",
    headers: {
      Prefer: "return=representation",
    },
    body: JSON.stringify({
      input_url: payload.inputUrl,
      normalized_domain: payload.normalizedDomain,
      fit_score: payload.fitScore,
      is_good_fit: payload.isGoodFit,
      site_type: payload.siteType,
      recommended_ai_type: payload.recommendedAiType,
      summary: payload.summary,
      friction_points: payload.frictionPoints,
      upsell_opportunities: payload.upsellOpportunities,
      phase_one_plan: payload.phaseOnePlan,
      example_user_flows: payload.exampleUserFlows,
      user_agent: payload.userAgent,
      ip_hash: payload.ipHash,
      referrer: payload.referrer,
    }),
  });

  const rows = safeArray(await response.json());
  return rows[0] ? normalizeAuditRecord(rows[0]) : null;
}

async function insertAuditFailure(payload: AuditFailureInsert) {
  const response = await supabaseRestFetch("audit_failures", {
    method: "POST",
    headers: {
      Prefer: "return=representation",
    },
    body: JSON.stringify({
      input_url: payload.inputUrl,
      normalized_domain: payload.normalizedDomain,
      reason: payload.reason,
      classification: payload.classification,
      http_status: payload.httpStatus,
      technical_message: payload.technicalMessage,
      user_agent: payload.userAgent,
      ip_hash: payload.ipHash,
      referrer: payload.referrer,
    }),
  });

  const rows = safeArray(await response.json());
  return rows[0] ? normalizeAuditFailureRecord(rows[0]) : null;
}

async function insertContactRequest(payload: ContactRequestInsert) {
  const response = await supabaseRestFetch("contact_requests", {
    method: "POST",
    headers: {
      Prefer: "return=representation",
    },
    body: JSON.stringify({
      name: payload.name,
      email: payload.email,
      website: payload.website,
      message: payload.message,
      source: payload.source,
      normalized_domain: payload.normalizedDomain,
      linked_audit_domain: payload.linkedAuditDomain,
      user_agent: payload.userAgent,
      referrer: payload.referrer,
    }),
  });

  const rows = safeArray(await response.json());
  return rows[0] ? normalizeContactRequestRecord(rows[0]) : null;
}

export async function getDomainLeadSnapshot(
  normalizedDomain: string,
): Promise<DomainLeadSnapshot | null> {
  if (!isLeadStorageConfigured()) {
    return null;
  }

  const searchParams = new URLSearchParams({
    select: "created_at,fit_score",
    normalized_domain: `eq.${normalizedDomain}`,
    order: "created_at.desc",
    limit: "10",
  });

  const response = await supabaseRestFetch("site_audits", {
    searchParams,
    headers: {
      Prefer: "count=exact",
    },
  });

  const audits = safeArray(await response.json(), normalizeSnapshotAuditRecord);
  const auditCount = parseCountHeader(response.headers.get("content-range"));
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const recentCount = audits.filter((audit) => {
    const createdAt = Date.parse(audit.created_at);
    return Number.isFinite(createdAt) && createdAt >= sevenDaysAgo;
  }).length;

  return {
    auditCount,
    isHotLead: auditCount >= 3,
    isHighFit: (audits[0]?.fit_score ?? 0) >= 8,
    isReturningInterest: recentCount >= 2,
  };
}

export async function persistSuccessfulAudit(request: Request, inputUrl: string, audit: SiteAudit) {
  if (!isLeadStorageConfigured()) {
    console.warn("Lead tracking preskoceny: chyba Supabase konfiguracia.");
    return null;
  }

  const payload = mapAuditInsert(audit, inputUrl, request);

  if (!payload) {
    return null;
  }

  const savedAudit = await insertAudit(payload);

  if (!savedAudit) {
    return null;
  }

  const snapshot = await getDomainLeadSnapshot(payload.normalizedDomain);

  if (snapshot && snapshot.auditCount === 3) {
    await sendHotLeadAlert({
      domain: payload.normalizedDomain,
      snapshot,
      audit: savedAudit,
    });
  }

  return savedAudit;
}

export async function persistAuditFailure(
  request: Request,
  inputUrl: string,
  failure: {
    reason: AuditFailureInsert["reason"];
    classification: AuditErrorType | null;
    httpStatus?: number | null;
    technicalMessage: string;
  },
) {
  if (!isLeadStorageConfigured()) {
    console.warn("Audit failure log preskoceny: chyba Supabase konfiguracia.");
    return null;
  }

  const payload = mapAuditFailureInsert(inputUrl, request, failure);

  if (!payload) {
    return null;
  }

  return insertAuditFailure(payload);
}

export async function persistContactRequest(
  request: Request,
  payload: Omit<ContactRequestInsert, "userAgent" | "referrer">,
) {
  if (!isLeadStorageConfigured()) {
    console.warn("Contact request save preskoceny: chyba Supabase konfiguracia.");
    return null;
  }

  return insertContactRequest({
    ...payload,
    userAgent: request.headers.get("user-agent"),
    referrer: request.headers.get("referer") ?? request.headers.get("referrer"),
  });
}

export async function getLeadRollups({
  query,
  sort = "last-seen",
  status = "all",
}: LeadDashboardQuery = {}) {
  if (!isLeadStorageConfigured()) {
    return [];
  }

  const searchParams = new URLSearchParams({
    select:
      "normalized_domain,audit_count,last_seen,last_fit_score,last_site_type,last_summary,last_recommended_ai_type,is_high_fit,is_hot_lead,is_returning_interest",
    order: getLeadRollupSort(sort),
    limit: "200",
  });

  const sanitizedQuery = query ? sanitizeSearchQuery(query) : "";

  if (sanitizedQuery) {
    searchParams.set("normalized_domain", `ilike.*${sanitizedQuery}*`);
  }

  const response = await supabaseRestFetch("audit_lead_rollups", {
    searchParams,
  });
  const leads = safeArray(await response.json(), normalizeLeadRollupRecord);

  return leads.filter((lead) => matchesLeadStatus(lead, status));
}

export async function getRecentAudits({ query, limit = 25 }: RecentAuditQuery = {}) {
  if (!isLeadStorageConfigured()) {
    return [];
  }

  const searchParams = new URLSearchParams({
    select:
      "id,created_at,input_url,normalized_domain,fit_score,is_good_fit,site_type,recommended_ai_type,summary,referrer",
    order: "created_at.desc",
    limit: String(limit),
  });

  const sanitizedQuery = query ? sanitizeSearchQuery(query) : "";

  if (sanitizedQuery) {
    searchParams.set("normalized_domain", `ilike.*${sanitizedQuery}*`);
  }

  const response = await supabaseRestFetch("site_audits", {
    searchParams,
  });

  return safeArray(await response.json(), normalizeRecentAuditRecord);
}

export async function getRecentAuditFailures({ query, limit = 25 }: RecentAuditQuery = {}) {
  if (!isLeadStorageConfigured()) {
    return [];
  }

  const searchParams = new URLSearchParams({
    select:
      "id,created_at,input_url,normalized_domain,reason,classification,http_status,referrer",
    order: "created_at.desc",
    limit: String(limit),
  });

  const sanitizedQuery = query ? sanitizeSearchQuery(query) : "";

  if (sanitizedQuery) {
    searchParams.set("normalized_domain", `ilike.*${sanitizedQuery}*`);
  }

  try {
    const response = await supabaseRestFetch("audit_failures", {
      searchParams,
    });

    return safeArray(await response.json(), normalizeRecentAuditFailureRecord);
  } catch (error) {
    console.error("Audit failure list load failed:", error);
    return [];
  }
}

export async function getRecentContactRequests({ query, limit = 25 }: RecentAuditQuery = {}) {
  if (!isLeadStorageConfigured()) {
    return [];
  }

  const searchParams = new URLSearchParams({
    select:
      "id,created_at,name,email,website,message,source,normalized_domain,linked_audit_domain,referrer",
    order: "created_at.desc",
    limit: String(limit),
  });

  const sanitizedQuery = query ? sanitizeSearchQuery(query) : "";

  if (sanitizedQuery) {
    searchParams.set(
      "or",
      `(normalized_domain.ilike.*${sanitizedQuery}*,email.ilike.*${sanitizedQuery}*,name.ilike.*${sanitizedQuery}*)`,
    );
  }

  const response = await supabaseRestFetch("contact_requests", {
    searchParams,
  });

  return safeArray(await response.json(), normalizeRecentContactRequestRecord);
}
