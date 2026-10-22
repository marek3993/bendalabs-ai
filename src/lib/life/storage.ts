import "server-only";
import { randomBytes } from "node:crypto";

export class LifeStorageError extends Error {
  readonly status = 503;
  constructor() { super("Súkromné úložisko je dočasne nedostupné."); this.name = "LifeStorageError"; }
}
export class LifeConflictError extends Error {
  readonly status = 409;
  constructor() { super("Dáta sa medzitým zmenili. Obnov prehľad a skús to znovu."); this.name = "LifeConflictError"; }
}

function storageConfig() {
  const key = process.env.BENDALABS_LEADS_KEY?.trim();
  const source = process.env.LIFE_STORAGE_URL?.trim() || process.env.BENDALABS_LEADS_URL?.trim();
  if (!source || !key) return null;
  try {
    const url = new URL(source);
    if (!process.env.LIFE_STORAGE_URL) {
      if (!/\/bendalabs-leads\/?$/.test(url.pathname)) return null;
      url.pathname = url.pathname.replace(/\/bendalabs-leads\/?$/, "/bendalabs-life");
    }
    if (url.protocol !== "https:" || url.username || url.password || url.search || url.hash) return null;
    return { url: url.href, key };
  } catch { return null; }
}

export function isLifeStorageConfigured() { return storageConfig() !== null; }

type Operation = "load_state" | "save_state" | "claim_login" | "claim_ai" | "release_ai" | "create_session" | "load_session" | "renew_session" | "delete_session" | "delete_sessions";

// This module is server-only. The browser cannot choose a table, SQL query, or RPC.
export async function lifeStorageOperation<T>(operation: Operation, payload: Record<string, unknown> = {}): Promise<T> {
  const config = storageConfig();
  if (!config) throw new LifeStorageError();
  try {
    const response = await fetch(config.url, {
      method: "POST", cache: "no-store",
      headers: { "content-type": "application/json", "x-bendalabs-key": config.key },
      body: JSON.stringify({ operation, payload }),
      signal: AbortSignal.timeout(15_000),
    });
    if (response.status === 409) throw new LifeConflictError();
    if (!response.ok) throw new LifeStorageError();
    return await response.json() as T;
  } catch (error) {
    if (error instanceof LifeConflictError || error instanceof LifeStorageError) throw error;
    throw new LifeStorageError();
  }
}

export type StoredLifeState = { state: unknown; version: number };
export async function loadLifeState(): Promise<StoredLifeState | null> {
  return lifeStorageOperation<StoredLifeState | null>("load_state");
}
export async function saveLifeState(state: unknown, expectedVersion: number): Promise<StoredLifeState> {
  if (!Number.isSafeInteger(expectedVersion) || expectedVersion < 0 || !state || typeof state !== "object" || Array.isArray(state)) throw new LifeStorageError();
  return lifeStorageOperation<StoredLifeState>("save_state", { state, expectedVersion });
}

export type LifeAiUsageClaim = { allowed: boolean; retryAfter: number; leaseId?: string };
export async function claimLifeAiUsage(sessionId: string, kind: "chat" | "import"): Promise<LifeAiUsageClaim> {
  const leaseId = randomBytes(16).toString("hex");
  return lifeStorageOperation<LifeAiUsageClaim>("claim_ai", { tokenHash: sessionId, kind, leaseId });
}
export async function releaseLifeAiUsage(leaseId: string): Promise<void> {
  await lifeStorageOperation("release_ai", { leaseId });
}
