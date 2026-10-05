import "server-only";
import { createHmac } from "node:crypto";
import { isIP } from "node:net";
import type { LessonFeedback } from "./validation";

export type FeedbackError = "invalid" | "rate_limited" | "unavailable";
export type FeedbackRow = { submission_id: string; chapter_id: string; lang: "sk" | "en"; rating: number | null; suggestion: string; created_at: string; status: "new" | "reviewed" };
export type ChapterSummary = { chapter_id: string; feedback_count: number; rating_count: number; average_rating: number | null; suggestion_count: number; new_count: number };
export type FeedbackDashboard = { rows: FeedbackRow[]; summaries: ChapterSummary[]; total: number };

function getConfiguration() {
  const key = process.env.UNIVERSITY_FEEDBACK_KEY?.trim();
  const url = process.env.UNIVERSITY_FEEDBACK_URL?.trim();
  if (!key || key.length < 32 || !url) return null;
  try {
    const endpoint = new URL(url);
    if (endpoint.protocol !== "https:" || endpoint.username || endpoint.password) return null;
    return { key, url: endpoint.toString() };
  } catch { return null; }
}

async function callFeedbackService(body: Record<string, unknown>): Promise<{ status: number; data: Record<string, unknown> } | null> {
  const config = getConfiguration();
  if (!config) return null;
  try {
    const response = await fetch(config.url, { method: "POST", headers: { "content-type": "application/json", "x-university-key": config.key }, body: JSON.stringify(body), cache: "no-store", signal: AbortSignal.timeout(12_000) });
    return { status: response.status, data: await response.json() as Record<string, unknown> };
  } catch { return null; }
}

export function feedbackActorHash(request: Request): string | null {
  const config = getConfiguration();
  if (!config) return null;
  // Vercel overwrites this header at its trusted ingress. Do not trust a user-supplied x-forwarded-for.
  const suppliedIp = process.env.VERCEL === "1" ? request.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() : "127.0.0.1";
  const ip = suppliedIp && isIP(suppliedIp) ? suppliedIp : "unknown";
  const day = new Date().toISOString().slice(0, 10);
  return createHmac("sha256", config.key).update(`university-feedback:${day}:${ip}`).digest("hex");
}

export async function submitFeedback(feedback: LessonFeedback, actorHash: string): Promise<{ ok: true } | { error: FeedbackError }> {
  const response = await callFeedbackService({ action: "submit", feedback, actorHash });
  if (response?.status === 200 && response.data.ok === true) return { ok: true };
  if (response?.status === 429) return { error: "rate_limited" };
  if (response?.status === 400 || response?.status === 409) return { error: "invalid" };
  return { error: "unavailable" };
}

export async function getFeedbackDashboard(filters: { chapter: string; status: string; page: number }): Promise<FeedbackDashboard | null> {
  const response = await callFeedbackService({ action: "list", ...filters });
  if (response?.status !== 200 || !Array.isArray(response.data.rows) || !Array.isArray(response.data.summaries) || typeof response.data.total !== "number") return null;
  return response.data as FeedbackDashboard;
}

export async function reviewFeedback(submissionId: string): Promise<boolean> {
  const response = await callFeedbackService({ action: "review", submissionId });
  return response?.status === 200 && response.data.ok === true;
}
