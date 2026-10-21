import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { assertLifeSameOrigin, requireLifeSession, renewLifeSession } from "./auth";
import { loadLifeState } from "./storage";
import { createEmptyLifeState, lifeStateSchema } from "./domain";

export function lifeJson(value: unknown, status = 200) {
  return NextResponse.json(value, { status, headers: { "Cache-Control": "private, no-store, max-age=0", "X-Robots-Tag": "noindex, nofollow", "X-Content-Type-Options": "nosniff" } });
}
export async function requireLifeRequest(request: Request, write = false) {
  if (write) assertLifeSameOrigin(request);
  const session = await requireLifeSession();
  if (session.needsRenewal) await renewLifeSession();
  return session;
}
export async function loadValidatedLifeState() {
  const stored = await loadLifeState();
  if (!stored) return { state: createEmptyLifeState(), version: 0 };
  const state = lifeStateSchema.parse(stored.state);
  return { state: { ...state, version: stored.version }, version: stored.version };
}
export const lifeCapabilities = () => ({ ai: Boolean(process.env.OPENAI_API_KEY?.trim()), push: false });
export function lifeError(error: unknown) {
  if (error instanceof ZodError) return lifeJson({ error: "Údaje nie sú platné. Skontroluj polia a skús to znova.", details: error.issues.map(issue => ({ path: issue.path.join("."), message: issue.message })).slice(0, 8) }, 400);
  const status = error && typeof error === "object" && "status" in error && typeof error.status === "number" ? error.status : 503;
  const safeStatus = [400, 401, 403, 409, 413, 429, 503].includes(status) ? status : 503;
  const messages: Record<number, string> = { 400: "Požiadavka nie je platná.", 401: "Prihlásenie vypršalo. Prihlás sa znova.", 403: "Túto požiadavku nemožno overiť.", 409: "Údaje sa medzitým zmenili. Obnov prehľad a zopakuj zmenu.", 413: "Súbor alebo požiadavka je príliš veľká.", 429: "Príliš veľa požiadaviek. Skús to o chvíľu.", 503: "Súkromné úložisko je dočasne nedostupné. Nič sa nepotvrdilo ako uložené." };
  return lifeJson({ error: messages[safeStatus] }, safeStatus);
}
export async function readLifeJson(request: Request, maxBytes = 262144): Promise<unknown> {
  const declared = Number(request.headers.get("content-length") || 0);
  if (declared > maxBytes) throw Object.assign(new Error("Payload too large"), { status: 413 });
  const body = await request.text();
  if (new TextEncoder().encode(body).length > maxBytes) throw Object.assign(new Error("Payload too large"), { status: 413 });
  try { return JSON.parse(body); } catch { throw Object.assign(new Error("Invalid JSON"), { status: 400 }); }
}
