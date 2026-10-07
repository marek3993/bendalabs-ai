// This function intentionally accepts only calls from the BendaLabs server.
// Deploy with gateway JWT verification disabled; the dedicated secret below is verified first.
declare const Deno: { env: { get(name: string): string | undefined }; serve(handler: (request: Request) => Response | Promise<Response>): unknown };

const EXPECTED_KEY_SHA256 = "3411f1413194e6073724ea0298682f5871acd8a6a2e9cad33e1898ec0ce082e6";
const CHAPTERS = new Set(["loop", "frames", "timing", "vision", "imitation", "vla", "range", "calibration", "fusion", "motors", "pid", "ik", "flight", "autopilot", "failsafe", "energy", "bms", "distribution", "states", "ros", "qos", "prototype", "odometry", "validation", "sideways-parking", "robot-components", "robot-frame", "manual-sequence", "command-parameters", "time-distance", "variables", "loops", "functions", "range-input"]);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const reply = (body: object, status = 200) => Response.json(body, { status, headers: { "cache-control": "no-store" } });

export async function authorized(key: string | null, expectedHash = EXPECTED_KEY_SHA256) {
  if (!key || key.length < 32 || key.length > 256 || !/^[0-9a-f]{64}$/.test(expectedHash)) return false;
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(key)));
  const actual = Array.from(digest, byte => byte.toString(16).padStart(2, "0")).join("");
  let difference = 0;
  for (let index = 0; index < 64; index++) difference |= actual.charCodeAt(index) ^ expectedHash.charCodeAt(index);
  return difference === 0;
}

async function bodyJson(request: Request): Promise<Record<string, unknown> | null> {
  if (request.headers.get("content-type")?.split(";")[0].trim() !== "application/json") return null;
  const length = request.headers.get("content-length");
  if (length && (!/^\d+$/.test(length) || Number(length) > 32_000)) return null;
  if (!request.body) return null;
  const reader = request.body.getReader();
  let size = 0;
  const parts: Uint8Array[] = [];
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 32_000) { await reader.cancel(); return null; }
      parts.push(value);
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const part of parts) { bytes.set(part, offset); offset += part.byteLength; }
    const value = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
    return value && typeof value === "object" && !Array.isArray(value) ? value : null;
  } catch { return null; }
}

async function database(path: string, options: RequestInit = {}) {
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) throw new Error("Storage unavailable");
  const response = await fetch(`${url}/rest/v1/${path}`, {
    ...options,
    headers: { "content-type": "application/json", apikey: key, authorization: `Bearer ${key}`, ...options.headers },
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error("Storage unavailable");
  return response;
}

export async function handler(request: Request): Promise<Response> {
  // Authenticate before reading input or using privileged database credentials.
  if (!await authorized(request.headers.get("x-university-key"))) return reply({ error: "unauthorized" }, 401);
  if (request.method !== "POST") return reply({ error: "invalid" }, 405);
  const input = await bodyJson(request);
  if (!input) return reply({ error: "invalid" }, 400);
  try {
    if (input.action === "support-submit") {
      const support = input.support as Record<string, unknown> | null;
      const control = /[\u0000-\u001f\u007f]/;
      if (!support || typeof support !== "object" || Array.isArray(support)
        || typeof support.submissionId !== "string" || !UUID.test(support.submissionId)
        || (support.kind !== "question" && support.kind !== "project") || (support.lang !== "sk" && support.lang !== "en")
        || typeof support.name !== "string" || support.name.length > 100 || control.test(support.name)
        || typeof support.email !== "string" || support.email.length > 254 || control.test(support.email) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(support.email.trim())
        || typeof support.projectUrl !== "string" || support.projectUrl.length > 2000 || control.test(support.projectUrl)
        || typeof support.message !== "string" || support.message.length > 4000 || support.message.trim().length < 20 || /\u0000/.test(support.message)
        || support.consent !== true
        || typeof input.actorHash !== "string" || !/^[0-9a-f]{64}$/.test(input.actorHash)) return reply({ error: "invalid" }, 400);
      let projectUrl = support.projectUrl.trim();
      if (projectUrl) {
        let url: URL;
        try { url = new URL(projectUrl); } catch { return reply({ error: "invalid" }, 400); }
        if (url.protocol !== "https:" || url.username || url.password || !url.hostname || url.toString().length > 2000) return reply({ error: "invalid" }, 400);
        projectUrl = url.toString();
      }
      const response = await database("rpc/university_submit_support", { method: "POST", body: JSON.stringify({ p_submission_id: support.submissionId, p_kind: support.kind, p_lang: support.lang, p_name: support.name.trim(), p_email: support.email.trim(), p_project_url: projectUrl, p_message: support.message.trim(), p_consent: true, p_actor_hash: input.actorHash }) });
      const outcome: unknown = await response.json();
      if (outcome === "stored" || outcome === "duplicate") return reply({ ok: true });
      if (outcome === "rate_limited") return reply({ error: "rate_limited" }, 429);
      if (outcome === "invalid" || outcome === "conflict") return reply({ error: "invalid" }, outcome === "conflict" ? 409 : 400);
      return reply({ error: "unavailable" }, 503);
    }
    if (input.action === "support-list") {
      if (typeof input.kind !== "string" || !["all", "question", "project"].includes(input.kind) || typeof input.status !== "string" || !["all", "new", "reviewed"].includes(input.status)
        || !Number.isInteger(input.page) || Number(input.page) < 1 || Number(input.page) > 10_000) return reply({ error: "invalid" }, 400);
      const query = new URLSearchParams({ select: "submission_id,kind,lang,name,email,project_url,message,created_at,status", order: "created_at.desc,submission_id.desc", limit: "25", offset: String((Number(input.page) - 1) * 25) });
      if (input.kind !== "all") query.set("kind", `eq.${input.kind}`);
      if (input.status !== "all") query.set("status", `eq.${input.status}`);
      const response = await database(`university_student_support?${query}`, { headers: { prefer: "count=exact" } });
      const total = Number(response.headers.get("content-range")?.split("/")[1]);
      if (!Number.isFinite(total)) return reply({ error: "unavailable" }, 503);
      return reply({ rows: await response.json(), total });
    }
    if (input.action === "support-review") {
      if (typeof input.submissionId !== "string" || !UUID.test(input.submissionId)) return reply({ error: "invalid" }, 400);
      const query = new URLSearchParams({ submission_id: `eq.${input.submissionId}`, select: "submission_id" });
      const response = await database(`university_student_support?${query}`, { method: "PATCH", headers: { prefer: "return=representation" }, body: JSON.stringify({ status: "reviewed", reviewed_at: new Date().toISOString() }) });
      const rows = await response.json();
      return Array.isArray(rows) && rows.length === 1 ? reply({ ok: true }) : reply({ error: "invalid" }, 404);
    }
    if (input.action === "submit") {
      const feedback = input.feedback as Record<string, unknown> | null;
      if (!feedback || typeof feedback !== "object" || Array.isArray(feedback)
        || typeof feedback.chapterId !== "string" || !CHAPTERS.has(feedback.chapterId)
        || (feedback.lang !== "sk" && feedback.lang !== "en")
        || (feedback.rating !== null && (!Number.isInteger(feedback.rating) || Number(feedback.rating) < 1 || Number(feedback.rating) > 5))
        || typeof feedback.suggestion !== "string" || feedback.suggestion.length > 2000
        || (feedback.suggestion !== "" && feedback.suggestion.trim().length < 10)
        || (feedback.rating === null && feedback.suggestion.trim().length < 10)
        || typeof feedback.submissionId !== "string" || !UUID.test(feedback.submissionId)
        || typeof input.actorHash !== "string" || !/^[0-9a-f]{64}$/.test(input.actorHash)) return reply({ error: "invalid" }, 400);
      const stored = await database("rpc/university_submit_feedback", { method: "POST", body: JSON.stringify({ p_submission_id: feedback.submissionId, p_chapter_id: feedback.chapterId, p_lang: feedback.lang, p_rating: feedback.rating, p_suggestion: feedback.suggestion.trim(), p_actor_hash: input.actorHash }) });
      const outcome: unknown = await stored.json();
      if (outcome === "stored" || outcome === "duplicate") return reply({ ok: true });
      if (outcome === "rate_limited") return reply({ error: "rate_limited" }, 429);
      if (outcome === "invalid" || outcome === "conflict") return reply({ error: "invalid" }, outcome === "conflict" ? 409 : 400);
      return reply({ error: "unavailable" }, 503);
    }
    if (input.action === "list") {
      if (typeof input.chapter !== "string" || (input.chapter !== "" && !CHAPTERS.has(input.chapter))
        || !["all", "new", "reviewed"].includes(String(input.status))
        || !Number.isInteger(input.page) || Number(input.page) < 1 || Number(input.page) > 10_000) return reply({ error: "invalid" }, 400);
      const query = new URLSearchParams({ select: "submission_id,chapter_id,lang,rating,suggestion,created_at,status", order: "created_at.desc,submission_id.desc", limit: "25", offset: String((Number(input.page) - 1) * 25) });
      if (input.chapter) query.set("chapter_id", `eq.${input.chapter}`);
      if (input.status !== "all") query.set("status", `eq.${input.status}`);
      const [rowsResponse, summaryResponse] = await Promise.all([
        database(`university_lesson_feedback?${query}`, { headers: { prefer: "count=exact" } }),
        database("rpc/university_feedback_summary", { method: "POST", body: "{}" }),
      ]);
      const total = Number(rowsResponse.headers.get("content-range")?.split("/")[1]);
      if (!Number.isFinite(total)) return reply({ error: "unavailable" }, 503);
      return reply({ rows: await rowsResponse.json(), summaries: await summaryResponse.json(), total });
    }
    if (input.action === "review") {
      if (typeof input.submissionId !== "string" || !UUID.test(input.submissionId)) return reply({ error: "invalid" }, 400);
      const query = new URLSearchParams({ submission_id: `eq.${input.submissionId}`, select: "submission_id" });
      const response = await database(`university_lesson_feedback?${query}`, { method: "PATCH", headers: { prefer: "return=representation" }, body: JSON.stringify({ status: "reviewed", reviewed_at: new Date().toISOString() }) });
      const rows = await response.json();
      return Array.isArray(rows) && rows.length === 1 ? reply({ ok: true }) : reply({ error: "invalid" }, 404);
    }
    return reply({ error: "invalid" }, 400);
  } catch { return reply({ error: "unavailable" }, 503); }
}

Deno.serve(handler);
