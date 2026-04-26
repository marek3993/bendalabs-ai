import { createHash } from "node:crypto";
import { getNormalizedDomainFromUrl } from "@/lib/leads/domain-utils";
import type { LeadRollup, LeadStatusFilter } from "@/lib/leads/types";

const DEFAULT_HASH_SALT = "bendalabs-local-dev-salt";

function getHashSalt() {
  return (
    process.env.LEAD_TRACKING_HASH_SALT ||
    process.env.ADMIN_LEADS_PASSWORD ||
    process.env.OPENAI_API_KEY ||
    DEFAULT_HASH_SALT
  );
}

export function getNormalizedDomain(inputUrl: string) {
  return getNormalizedDomainFromUrl(inputUrl);
}

export function getClientIp(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");

  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || null;
  }

  return request.headers.get("x-real-ip");
}

export function hashLeadIdentifier(value: string | null) {
  if (!value) {
    return null;
  }

  return createHash("sha256")
    .update(`${getHashSalt()}:${value}`)
    .digest("hex");
}

export function matchesLeadStatus(lead: LeadRollup, filter: LeadStatusFilter) {
  if (filter === "hot") {
    return lead.is_hot_lead;
  }

  if (filter === "high-fit") {
    return lead.is_high_fit;
  }

  if (filter === "returning") {
    return lead.is_returning_interest;
  }

  return true;
}
