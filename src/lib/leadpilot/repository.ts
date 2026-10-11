import { supabaseRestFetch } from "@/lib/leads/supabase";
import type { Opportunity, ScoutRun, LeadStatus, Proposal } from "./model";

// A single server snapshot keeps freshness filters consistent during hydration.
export function dashboardSnapshotTime() { return Date.now(); }

export async function listOpportunities(): Promise<Opportunity[]> {
  const response = await supabaseRestFetch("opportunities", {
    searchParams: new URLSearchParams({ select: "id,created_at,source_url,title,summary,category,region,budget_text,published_at,publication_evidence,fetched_at,demand_excerpt,verification,status,score,proposal", order: "published_at.desc.nullslast,created_at.desc", limit: "300" }),
  });
  return response.json();
}
export async function getOpportunity(id: string): Promise<Opportunity | null> {
  const response = await supabaseRestFetch("opportunities", { searchParams: new URLSearchParams({ select: "*", id: `eq.${id}`, limit: "1" }) });
  return (await response.json())[0] ?? null;
}
export async function saveOpportunity(lead: Omit<Opportunity, "id" | "created_at">) {
  // The database unique constraint is the final arbiter for concurrent imports.
  const response = await supabaseRestFetch("opportunities", {
    method: "POST", headers: { Prefer: "return=representation" }, body: JSON.stringify(lead),
  });
  const saved = (await response.json())[0] as Opportunity | undefined;
  if (!saved?.id) throw new Error("Dopyt nebol uložený.");
  return saved;
}
export async function updateOpportunity(id: string, update: { status?: LeadStatus; proposal?: Proposal } & Partial<Pick<Opportunity, "fetched_at" | "published_at" | "publication_evidence" | "verification" | "source_text">>) {
  const response = await supabaseRestFetch("opportunities", {
    method: "PATCH", searchParams: new URLSearchParams({ id: `eq.${id}` }),
    headers: { Prefer: "return=representation" }, body: JSON.stringify(update),
  });
  const lead = (await response.json())[0] as Opportunity | undefined;
  if (!lead?.id) throw new Error("Dopyt sa nenašiel.");
  return lead;
}
export async function recentRuns(): Promise<ScoutRun[]> {
  const response = await supabaseRestFetch("leadpilot_runs", {
    searchParams: new URLSearchParams({ select: "*", order: "created_at.desc", limit: "5" }),
  });
  return response.json();
}
export async function startRun(runKey: string): Promise<ScoutRun> {
  const response = await supabaseRestFetch("leadpilot_runs", {
    method: "POST", headers: { Prefer: "return=representation" }, body: JSON.stringify({ run_key: runKey, status: "running" }),
  });
  const run = (await response.json())[0];
  if (!run?.id) throw new Error("Vyhľadávanie sa nepodarilo spustiť.");
  return run;
}
export async function finishRun(id: string, result: Pick<ScoutRun, "status" | "found" | "saved" | "skipped" | "errors">) {
  await supabaseRestFetch("leadpilot_runs", {
    method: "PATCH", searchParams: new URLSearchParams({ id: `eq.${id}` }),
    headers: { Prefer: "return=representation" }, body: JSON.stringify({ ...result, finished_at: new Date().toISOString() }),
  });
}
