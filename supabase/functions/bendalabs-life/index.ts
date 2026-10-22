// Only the BendaLabs server can call this private, operation-scoped bridge.
declare const Deno: { env: { get(name: string): string | undefined }; serve(handler: (request: Request) => Promise<Response>): unknown };
const EXPECTED_KEY_SHA256 = "23f9e79238b05f0d1b4d1f04de04c21fa7029cf11f9ec97a1513d7a23973adc2";
const MAX_BYTES = 2_100_000;
const HASH = /^[0-9a-f]{64}$/;
const reply = (error: string, status: number) => Response.json({ error }, { status, headers: { "cache-control": "no-store" } });

export async function authorized(key: string | null, expectedHash = EXPECTED_KEY_SHA256) {
  if (!key || key.length < 32 || key.length > 256 || !HASH.test(expectedHash)) return false;
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(key)));
  const actual = Array.from(digest, byte => byte.toString(16).padStart(2, "0")).join("");
  let difference = 0;
  for (let i = 0; i < 64; i++) difference |= actual.charCodeAt(i) ^ expectedHash.charCodeAt(i);
  return difference === 0;
}

function object(value: unknown): value is Record<string, unknown> { return Boolean(value) && typeof value === "object" && !Array.isArray(value); }
function onlyKeys(value: Record<string, unknown>, allowed: string[]) { return Object.keys(value).every(key => allowed.includes(key)) && allowed.every(key => Object.hasOwn(value, key)); }
export function validInput(input: unknown): input is { operation: string; payload: Record<string, unknown> } {
  if (!object(input) || !onlyKeys(input, ["operation", "payload"]) || typeof input.operation !== "string" || !object(input.payload)) return false;
  const p = input.payload;
  if (input.operation === "load_state") return Object.keys(p).length === 0;
  if (input.operation === "save_state") return onlyKeys(p, ["state", "expectedVersion"]) && object(p.state) && Number.isSafeInteger(p.expectedVersion) && (p.expectedVersion as number) >= 0 && (p.expectedVersion as number) <= 999_999_999_999_999;
  if (input.operation === "claim_login") return onlyKeys(p, ["key"]) && typeof p.key === "string" && HASH.test(p.key);
  if (input.operation === "claim_ai") return onlyKeys(p, ["tokenHash", "kind", "leaseId"]) && typeof p.tokenHash === "string" && HASH.test(p.tokenHash) && ["chat", "import"].includes(p.kind as string) && typeof p.leaseId === "string" && /^[0-9a-f]{32}$/.test(p.leaseId);
  if (input.operation === "release_ai") return onlyKeys(p, ["leaseId"]) && typeof p.leaseId === "string" && /^[0-9a-f]{32}$/.test(p.leaseId);
  if (input.operation === "create_session") return onlyKeys(p, ["tokenHash", "credentialVersion", "remember", "ttlSeconds"]) && typeof p.tokenHash === "string" && HASH.test(p.tokenHash) && typeof p.credentialVersion === "string" && HASH.test(p.credentialVersion) && typeof p.remember === "boolean" && p.ttlSeconds === (p.remember ? 31_536_000 : 43_200);
  return ["load_session", "renew_session", "delete_session", "delete_sessions"].includes(input.operation) && onlyKeys(p, ["tokenHash"]) && typeof p.tokenHash === "string" && HASH.test(p.tokenHash);
}

async function boundedText(request: Request) {
  if (Number(request.headers.get("content-length") || 0) > MAX_BYTES) return null;
  const reader = request.body?.getReader();
  if (!reader) return "";
  const decoder = new TextDecoder();
  let bytes = 0, text = "";
  while (true) {
    const part = await reader.read();
    if (part.done) break;
    bytes += part.value.byteLength;
    if (bytes > MAX_BYTES) { await reader.cancel(); return null; }
    text += decoder.decode(part.value, { stream: true });
  }
  return text + decoder.decode();
}

export async function handler(request: Request): Promise<Response> {
  if (!await authorized(request.headers.get("x-bendalabs-key"))) return reply("unauthorized", 401);
  if (request.method !== "POST") return reply("invalid", 405);
  try {
    const text = await boundedText(request);
    if (text === null) return reply("invalid", 413);
    let input: unknown;
    try { input = JSON.parse(text); } catch { return reply("invalid", 400); }
    if (!validInput(input)) return reply("invalid", 400);
    const base = Deno.env.get("SUPABASE_URL"), key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!base || !key) return reply("unavailable", 503);
    const response = await fetch(new URL("/rest/v1/rpc/bendalabs_life_rpc", base), {
      method: "POST",
      headers: { apikey: key, authorization: `Bearer ${key}`, "content-type": "application/json" },
      body: JSON.stringify({ p_operation: input.operation, p_payload: input.payload }),
      signal: AbortSignal.timeout(12_000),
    });
    if (!response.ok) return reply("unavailable", 503);
    const result = await response.json();
    if (result?.error) return reply(result.error === "conflict" ? "conflict" : result.error === "unauthorized" ? "unauthorized" : "invalid", result.error === "conflict" ? 409 : result.error === "unauthorized" ? 401 : 400);
    return Response.json(result, { headers: { "cache-control": "no-store" } });
  } catch { return reply("unavailable", 503); }
}
if (typeof Deno !== "undefined") Deno.serve(handler);
