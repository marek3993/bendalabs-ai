export const MAX_SUPPORT_BYTES = 32_000;
export const MAX_SUPPORT_MESSAGE = 4000;
export const SUPPORT_CONSENT_VERSION = "2026-10-v1";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CONTROL = /[\u0000-\u001f\u007f]/;

export type StudentSupport = { submissionId: string; kind: "question" | "project"; lang: "sk" | "en"; name: string; email: string; projectUrl: string; message: string; consent: true };

export function validProjectUrl(value: string): boolean {
  if (value === "") return true;
  if (value.length > 2000 || CONTROL.test(value)) return false;
  try { const url = new URL(value); return url.protocol === "https:" && !url.username && !url.password && !!url.hostname && url.toString().length <= 2000; } catch { return false; }
}

export function validateStudentSupport(value: unknown): StudentSupport | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const input = value as Record<string, unknown>;
  if (typeof input.submissionId !== "string" || !UUID.test(input.submissionId)
    || (input.kind !== "question" && input.kind !== "project") || (input.lang !== "sk" && input.lang !== "en")
    || typeof input.name !== "string" || input.name.length > 100 || CONTROL.test(input.name)
    || typeof input.email !== "string" || input.email.length > 254 || CONTROL.test(input.email) || !EMAIL.test(input.email.trim())
    || typeof input.projectUrl !== "string" || !validProjectUrl(input.projectUrl.trim())
    || typeof input.message !== "string" || input.message.length > MAX_SUPPORT_MESSAGE || input.message.trim().length < 20 || /\u0000/.test(input.message)
    || input.consent !== true || input.website !== "") return null;
  return { submissionId: input.submissionId.toLowerCase(), kind: input.kind as StudentSupport["kind"], lang: input.lang as StudentSupport["lang"], name: input.name.trim(), email: input.email.trim(), projectUrl: input.projectUrl.trim() ? new URL(input.projectUrl.trim()).toString() : "", message: input.message.trim(), consent: true };
}
