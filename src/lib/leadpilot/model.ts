import { z } from "zod";

export const leadStatuses = ["new", "review", "proposal", "sent", "won", "lost", "archived"] as const;
export type LeadStatus = (typeof leadStatuses)[number];
export const statusLabels: Record<LeadStatus, string> = {
  new: "Nový dopyt", review: "Na preverenie", proposal: "Ponuka pripravená",
  sent: "Odpovedané", won: "Získaná zákazka", lost: "Neúspešné", archived: "Archív",
};
export const categoryLabels = {
  documents: "Dokumenty a údaje", email: "E-maily a podpora", crm: "CRM a obchod",
  integrations: "Prepojenie systémov", reporting: "Reporty a tabuľky", other: "Iná automatizácia",
};
export const analysisSchema = z.object({
  is_paid_demand: z.boolean(),
  is_closed: z.boolean(),
  title: z.string(),
  summary: z.string(),
  category: z.enum(["documents", "email", "crm", "integrations", "reporting", "other"]),
  demand_excerpt: z.string(),
  budget_text: z.string().nullable(),
  budget_excerpt: z.string().nullable(),
  region: z.string().nullable(),
  requirements: z.array(z.string()),
  solution: z.string(),
  assumptions: z.array(z.string()),
  exclusions: z.array(z.string()),
  questions: z.array(z.string()),
  hours_min: z.number(),
  hours_max: z.number(),
  days_min: z.number(),
  days_max: z.number(),
  recurring_costs: z.string(),
  reply_body: z.string(),
  reply_language: z.enum(["sk", "cs", "en"]),
});
export type DemandAnalysis = z.infer<typeof analysisSchema>;
export type Proposal = Pick<DemandAnalysis, "requirements" | "solution" | "assumptions" | "exclusions" | "questions" | "hours_min" | "hours_max" | "days_min" | "days_max" | "recurring_costs" | "reply_body" | "reply_language"> & { hourly_rate: number };
export type Opportunity = {
  id: string; created_at: string; source_url: string; title: string; summary: string;
  category: keyof typeof categoryLabels; region: string | null; budget_text: string | null;
  published_at: string | null; publication_evidence: string | null;
  fetched_at: string; source_text: string; demand_excerpt: string;
  verification: "verified" | "review" | "blocked" | "closed";
  status: LeadStatus; score: number; proposal: Proposal | null;
};
export type ScoutRun = {
  id: string; run_key: string; created_at: string; finished_at: string | null;
  status: "running" | "completed" | "partial" | "failed";
  found: number; saved: number; skipped: number; errors: string[];
};
export const FRESH_DAYS = 14;
export function isFresh(date: string | null, now = Date.now(), days = FRESH_DAYS) {
  if (!date) return false;
  const timestamp = Date.parse(date);
  return Number.isFinite(timestamp) && timestamp <= now + 60_000 && timestamp >= now - days * 86_400_000;
}
export function isActiveOpportunity(lead: Opportunity, now = Date.now()) {
  return !["review", "won", "lost", "archived"].includes(lead.status)
    && lead.verification === "verified" && isFresh(lead.published_at, now)
    && isFresh(lead.fetched_at, now, 3);
}
export function isTechnicalTest(email: string) {
  const value = email.trim().toLowerCase();
  return /@(example\.(com|org|net)|bendalabs\.invalid)$/.test(value)
    || /^(form-check-|intake-check-|test[-+]|automation-check-)/.test(value);
}
export function euro(value: number) {
  return new Intl.NumberFormat("sk-SK", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(value);
}
export function quotedReply(proposal: Proposal) {
  const amount = `${euro(proposal.hours_min * proposal.hourly_rate)} – ${euro(proposal.hours_max * proposal.hourly_rate)}`;
  const days = `${proposal.days_min} – ${proposal.days_max}`;
  const terms = proposal.reply_language === "en"
    ? `Indicative implementation price: ${amount}.\nEstimated delivery: ${days} working days after receiving access and sample materials, subject to available capacity.\nThis is a preliminary estimate. Third-party software costs are separate. I will confirm the fixed price and schedule after reviewing your materials.`
    : proposal.reply_language === "cs"
      ? `Orientační cena realizace: ${amount}.\nOdhad dodání: ${days} pracovních dní od dodání přístupů a podkladů, podle dostupné kapacity.\nJde o předběžný odhad. Provozní náklady jsou samostatné. Pevnou cenu a termín potvrdím po prověření podkladů.`
      : `Orientačná cena realizácie: ${amount}.\nOdhad dodania: ${days} pracovných dní od dodania prístupov a podkladov, podľa dostupnej kapacity.\nIde o predbežný odhad. Prevádzkové náklady sú samostatné. Pevnú cenu a termín potvrdím po preverení podkladov.`;
  return `${proposal.reply_body}\n\n${terms}\n\nMarek Benda\nBendaLabs · https://bendalabs.sk`;
}

export function groundedAnalysis(analysis: DemandAnalysis, sourceText: string) {
  const normalize = (s: string) => s.replace(/\s+/g, " ").trim().toLowerCase();
  const source = normalize(sourceText);
  const excerpt = normalize(analysis.demand_excerpt);
  // Search snippets, forum replies and provider advertisements cannot prove buying intent.
  if (!analysis.is_paid_demand || analysis.is_closed || excerpt.length < 25 || !source.includes(excerpt)) return null;
  if (/\[for hire\]|available for hire|my services|i offer automation/i.test(analysis.title)) return null;
  if (![analysis.hours_min, analysis.hours_max, analysis.days_min, analysis.days_max].every(Number.isFinite)
    || analysis.hours_min <= 0 || analysis.hours_max < analysis.hours_min || analysis.hours_max > 320
    || analysis.days_min < 1 || analysis.days_max < analysis.days_min || analysis.days_max > 90) return null;
  const budget = analysis.budget_text && analysis.budget_excerpt && source.includes(normalize(analysis.budget_excerpt))
    ? analysis.budget_excerpt : null;
  const region = analysis.region && source.includes(normalize(analysis.region)) ? analysis.region : null;
  return { ...analysis, budget_text: budget, region };
}
