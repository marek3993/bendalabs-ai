import "server-only";
import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { lifeStorageOperation, isLifeStorageConfigured } from "./storage";

export const LIFE_SESSION_COOKIE = "bendalabs_life_session";
const REMEMBER_SECONDS = 365 * 24 * 60 * 60;
const SHORT_SECONDS = 12 * 60 * 60;
const RENEW_BEFORE_SECONDS = 30 * 24 * 60 * 60;
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

export class LifeAuthError extends Error {
  constructor(message = "Prihlás sa do SI For Me.", readonly status = 401) { super(message); this.name = "LifeAuthError"; }
}

function password() { return process.env.LIFE_PASSWORD?.trim() || process.env.ADMIN_LEADS_PASSWORD?.trim() || null; }
export function isLifeAuthConfigured() { return password() !== null && isLifeStorageConfigured(); }
function digest(value: string) { return createHash("sha256").update(value).digest("hex"); }
function constantEqual(left: string, right: string) {
  return timingSafeEqual(createHash("sha256").update(left).digest(), createHash("sha256").update(right).digest());
}
function credentialVersion() {
  const secret = password();
  if (!secret) return null;
  // Rotating the owner password or bridge key invalidates existing sessions.
  return createHmac("sha256", process.env.BENDALABS_LEADS_KEY || secret).update(`life-credential-v1:${secret}`).digest("hex");
}

export type LifeSession = { id: string; expiresAt: string; remember: boolean; needsRenewal: boolean };
type StoredSession = { tokenHash: string; expiresAt: string; remember: boolean; credentialVersion: string };
function publicSession(session: StoredSession): LifeSession {
  return { id: session.tokenHash, expiresAt: session.expiresAt, remember: session.remember, needsRenewal: session.remember && Date.parse(session.expiresAt) - Date.now() < RENEW_BEFORE_SECONDS * 1000 };
}
async function currentToken() {
  const value = (await cookies()).get(LIFE_SESSION_COOKIE)?.value;
  return value && TOKEN_PATTERN.test(value) ? value : null;
}
function cookieOptions(remember: boolean) {
  return { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" as const, path: "/life", ...(remember ? { maxAge: REMEMBER_SECONDS } : {}) };
}

export async function getLifeSession(): Promise<LifeSession | null> {
  const token = await currentToken(), credential = credentialVersion();
  if (!token || !credential) return null;
  const session = await lifeStorageOperation<StoredSession | null>("load_session", { tokenHash: digest(token) });
  if (!session || !Number.isFinite(Date.parse(session.expiresAt)) || Date.parse(session.expiresAt) <= Date.now() || !constantEqual(session.credentialVersion, credential)) return null;
  return publicSession(session);
}
export async function requireLifeSession() {
  const session = await getLifeSession();
  if (!session) throw new LifeAuthError();
  return session;
}

// Browser writes must come from this exact origin. Missing Origin is rejected too.
export function assertLifeSameOrigin(request: Request) {
  const raw = request.headers.get("origin");
  try {
    if (!raw || raw === "null") throw new Error();
    const origin = new URL(raw), target = new URL(request.url);
    if (origin.origin !== raw) throw new Error();
    const productionOrigins = new Set(["https://bendalabs.sk", "https://www.bendalabs.sk"]);
    if (process.env.LIFE_ALLOWED_ORIGIN) productionOrigins.add(new URL(process.env.LIFE_ALLOWED_ORIGIN).origin);
    if (process.env.VERCEL_URL) productionOrigins.add(`https://${process.env.VERCEL_URL}`);
    if (process.env.NODE_ENV === "production" && !productionOrigins.has(origin.origin)) throw new Error();
    // Next's Node adapter can construct request.url from an internal listening
    // address. In that case use the public Host, still bounded by the production
    // allowlist above. Never accept an arbitrary Origin via forwarded headers.
    if (origin.origin !== target.origin) {
      const host = request.headers.get("host");
      const forwardedHost = process.env.VERCEL === "1" ? request.headers.get("x-forwarded-host") : null;
      if (process.env.NODE_ENV !== "production" || (host !== origin.host && forwardedHost !== origin.host)) throw new Error();
    }
    if (request.headers.get("sec-fetch-site") === "cross-site") throw new Error();
  } catch { throw new LifeAuthError("Požiadavka nepochádza z tejto stránky.", 403); }
}

export type LifeLoginResult = { ok: true; session: LifeSession } | { ok: false; reason: "invalid_password" | "rate_limited" | "unavailable"; retryAfter?: number };
export async function createLifeSession(candidate: string, remember: boolean, request: Request): Promise<LifeLoginResult> {
  assertLifeSameOrigin(request);
  const expected = password(), credential = credentialVersion();
  if (!expected || !credential || !isLifeStorageConfigured()) return { ok: false, reason: "unavailable" };
  try {
    // Vercel supplies forwarding headers; global DB throttling also limits attempts
    // when a client address is missing or an upstream cannot be trusted.
    const address = (request.headers.get("x-vercel-forwarded-for") || request.headers.get("x-forwarded-for") || "unknown").split(",")[0].trim().slice(0, 256);
    const key = createHmac("sha256", process.env.BENDALABS_LEADS_KEY || expected).update(`life-login:${address}`).digest("hex");
    const rate = await lifeStorageOperation<{ allowed: boolean; retryAfter: number }>("claim_login", { key });
    if (!rate.allowed) return { ok: false, reason: "rate_limited", retryAfter: rate.retryAfter };
    if (typeof candidate !== "string" || candidate.length > 1024 || !constantEqual(candidate, expected)) return { ok: false, reason: "invalid_password" };
    const token = randomBytes(32).toString("base64url");
    const session = await lifeStorageOperation<StoredSession>("create_session", { tokenHash: digest(token), credentialVersion: credential, remember, ttlSeconds: remember ? REMEMBER_SECONDS : SHORT_SECONDS });
    (await cookies()).set(LIFE_SESSION_COOKIE, token, cookieOptions(remember));
    return { ok: true, session: publicSession(session) };
  } catch { return { ok: false, reason: "unavailable" }; }
}

// Call from an authenticated route handler, never during Server Component render.
export async function renewLifeSession(): Promise<LifeSession> {
  const session = await requireLifeSession();
  if (!session.needsRenewal) return session;
  const token = await currentToken();
  if (!token) throw new LifeAuthError();
  const renewed = await lifeStorageOperation<StoredSession | null>("renew_session", { tokenHash: digest(token) });
  if (!renewed) throw new LifeAuthError();
  (await cookies()).set(LIFE_SESSION_COOKIE, token, cookieOptions(true));
  return publicSession(renewed);
}

export async function deleteLifeSession(all = false): Promise<void> {
  const token = await currentToken();
  if (all) await requireLifeSession();
  if (token) await lifeStorageOperation(all ? "delete_sessions" : "delete_session", { tokenHash: digest(token) });
  (await cookies()).set(LIFE_SESSION_COOKIE, "", { ...cookieOptions(false), maxAge: 0 });
}
