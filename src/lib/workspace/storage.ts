import "server-only";
import { createHash, createHmac } from "node:crypto";

export class WorkspaceError extends Error {
  constructor(
    readonly code: string,
    readonly status: number,
    readonly details: Record<string, unknown> = {},
  ) {
    super(
      (
        {
          unauthorized: "Prihlás sa do pracovného priestoru.",
          forbidden: "Na túto zmenu nemáš oprávnenie.",
          not_found: "Záznam nie je dostupný.",
          conflict:
            "Záznam sa medzitým zmenil. Načítaj novú verziu; tvoja úprava zostala v editore.",
          claimed: "Na úlohe už pracuje iné pripojenie.",
          idempotency_conflict:
            "Tento identifikátor zápisu už patrí inej zmene.",
          invalid_input: "Skontroluj zadané údaje.",
          unavailable: "Pracovný priestor je dočasne nedostupný.",
          rate_limited: "Príliš veľa pokusov. Skús to neskôr.",
        } as Record<string, string>
      )[code] || "Požiadavku sa nepodarilo dokončiť.",
    );
  }
}
export const hash = (value: string) =>
  createHash("sha256").update(value).digest("hex");
export const ownerPassword = () =>
  process.env.WORKSPACE_OWNER_PASSWORD?.trim() ||
  process.env.ADMIN_LEADS_PASSWORD?.trim();
export const credentialVersion = () =>
  createHmac(
    "sha256",
    process.env.BENDALABS_LEADS_KEY || ownerPassword() || "unconfigured",
  )
    .update(`workspace:${ownerPassword()}`)
    .digest("hex");
export function config() {
  const source =
    process.env.WORKSPACE_STORAGE_URL || process.env.BENDALABS_LEADS_URL;
  const key = process.env.BENDALABS_LEADS_KEY;
  if (!source || !key) throw new WorkspaceError("unavailable", 503);
  const url = new URL(source);
  if (!process.env.WORKSPACE_STORAGE_URL)
    url.pathname = url.pathname.replace(
      /\/bendalabs-leads\/?$/,
      "/bendalabs-workspace",
    );
  const localTest =
    !process.env.VERCEL &&
    Boolean(process.env.WORKSPACE_STORAGE_URL) &&
    url.protocol === "http:" &&
    url.hostname === "127.0.0.1";
  if (
    (url.protocol !== "https:" && !localTest) ||
    url.search ||
    url.hash ||
    url.username ||
    url.password
  )
    throw new WorkspaceError("unavailable", 503);
  return { url: url.href, key };
}
export async function rpc<T = Record<string, unknown>>(
  operation: string,
  payload: Record<string, unknown> = {},
  token?: string,
): Promise<T> {
  const { url, key } = config();
  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      cache: "no-store",
      headers: { "content-type": "application/json", "x-bendalabs-key": key },
      body: JSON.stringify({
        operation,
        payload,
        token_hash: token ? hash(token) : null,
        credential_version: credentialVersion(),
        resource: `${(process.env.WORKSPACE_ORIGIN || (process.env.VERCEL_ENV === "preview" && process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://bendalabs.sk")).replace(/\/$/, "")}/workspace/mcp`,
      }),
      signal: AbortSignal.timeout(25000),
    });
  } catch {
    throw new WorkspaceError("unavailable", 503);
  }
  const result = await response.json().catch(() => ({ error: "unavailable" }));
  if (!response.ok || result?.error) {
    const code = result.error || "unavailable";
    throw new WorkspaceError(
      code,
      (
        {
          unauthorized: 401,
          forbidden: 403,
          not_found: 404,
          conflict: 409,
          claimed: 409,
          idempotency_conflict: 409,
          invalid_input: 400,
          invalid_grant: 400,
          rate_limited: 429,
        } as Record<string, number>
      )[code] || 503,
      result,
    );
  }
  return result as T;
}
