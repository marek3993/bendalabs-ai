import "server-only";
import { callFeedbackService } from "@/lib/university-feedback/server";
import type { StudentSupport } from "./validation";

export type SupportError = "invalid" | "rate_limited" | "unavailable";
export type SupportRow = { submission_id: string; kind: "question" | "project"; lang: "sk" | "en"; name: string; email: string; project_url: string; message: string; created_at: string; status: "new" | "reviewed" };
export type SupportDashboard = { rows: SupportRow[]; total: number };

export async function submitStudentSupport(support: StudentSupport, actorHash: string): Promise<{ ok: true } | { error: SupportError }> {
  const result = await callFeedbackService({ action: "support-submit", support, actorHash });
  if (result?.status === 200 && result.data.ok === true) return { ok: true };
  if (result?.status === 429) return { error: "rate_limited" };
  if (result?.status === 400 || result?.status === 409) return { error: "invalid" };
  return { error: "unavailable" };
}

export async function getSupportDashboard(filters: { kind: string; status: string; page: number }): Promise<SupportDashboard | null> {
  const result = await callFeedbackService({ action: "support-list", ...filters });
  if (result?.status !== 200 || !Array.isArray(result.data.rows) || typeof result.data.total !== "number") return null;
  return result.data as SupportDashboard;
}

export async function reviewSupport(submissionId: string): Promise<boolean> {
  const result = await callFeedbackService({ action: "support-review", submissionId });
  return result?.status === 200 && result.data.ok === true;
}
