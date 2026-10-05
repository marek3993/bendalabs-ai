// Only the BendaLabs server can use this narrowly scoped storage bridge.
declare const Deno: { env: { get(name: string): string | undefined }; serve(handler: (request: Request) => Promise<Response>): unknown };
const EXPECTED_KEY_SHA256 = "23f9e79238b05f0d1b4d1f04de04c21fa7029cf11f9ec97a1513d7a23973adc2";
const tables = new Set(["contact_requests", "site_audits", "audit_failures", "audit_lead_rollups"]);
const reply = (error: string, status: number) => Response.json({ error }, { status, headers: { "cache-control": "no-store" } });

export async function authorized(key: string | null, expectedHash = EXPECTED_KEY_SHA256) {
  if (!key || key.length < 32 || key.length > 256 || !/^[0-9a-f]{64}$/.test(expectedHash)) return false;
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(key)));
  const actual = Array.from(digest, byte => byte.toString(16).padStart(2, "0")).join("");
  let difference = 0;
  for (let i = 0; i < 64; i++) difference |= actual.charCodeAt(i) ^ expectedHash.charCodeAt(i);
  return difference === 0;
}

export async function handler(request: Request): Promise<Response> {
  if (!await authorized(request.headers.get("x-bendalabs-key"))) return reply("unauthorized", 401);
  if (request.method !== "POST") return reply("invalid", 405);
  try {
    if (Number(request.headers.get("content-length") || 0) > 100_000) return reply("invalid", 413);
    const text = await request.text();
    if (new TextEncoder().encode(text).length > 100_000) return reply("invalid", 413);
    const input = JSON.parse(text);
    if (!input || !tables.has(input.table) || !["GET", "POST"].includes(input.method)
      || typeof input.query !== "string" || input.query.length > 4000
      || typeof input.prefer !== "string" || !["", "count=exact", "return=representation"].includes(input.prefer)
      || (input.method === "POST" && (input.table === "audit_lead_rollups" || !input.body || typeof input.body !== "object" || Array.isArray(input.body)))) return reply("invalid", 400);
    const base = Deno.env.get("SUPABASE_URL"), key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!base || !key) return reply("unavailable", 503);
    const url = new URL(`/rest/v1/bendalabs_${input.table}`, base);
    url.search = input.query;
    const response = await fetch(url, {
      method: input.method,
      headers: { apikey: key, authorization: `Bearer ${key}`, "content-type": "application/json", prefer: input.prefer },
      ...(input.method === "POST" ? { body: JSON.stringify(input.body) } : {}),
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) return reply("unavailable", 503);
    const headers = new Headers({ "content-type": "application/json", "cache-control": "no-store" });
    const count = response.headers.get("content-range");
    if (count) headers.set("content-range", count);
    return new Response(response.body, { status: response.status, headers });
  } catch { return reply("unavailable", 503); }
}
if (typeof Deno !== "undefined") Deno.serve(handler);
