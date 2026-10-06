import { feedbackActorHash } from "@/lib/university-feedback/server";
import { isSameOriginRequest, readBoundedBody } from "@/lib/university-feedback/validation";
import { submitStudentSupport } from "@/lib/university-support/server";
import { MAX_SUPPORT_BYTES, validateStudentSupport } from "@/lib/university-support/validation";

export const runtime = "nodejs";
const reply = (data: object, status: number) => Response.json(data, { status, headers: { "cache-control": "no-store", ...(status === 429 ? { "retry-after": "3600" } : {}) } });

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return reply({ error: "invalid" }, 403);
  if (request.headers.get("content-type")?.split(";")[0].trim() !== "application/json") return reply({ error: "invalid" }, 400);
  const body = await readBoundedBody(request, MAX_SUPPORT_BYTES);
  if (body === null) return reply({ error: "invalid" }, 400);
  let input: unknown;
  try { input = JSON.parse(body); } catch { return reply({ error: "invalid" }, 400); }
  const support = validateStudentSupport(input);
  if (!support) return reply({ error: "invalid" }, 400);
  const actorHash = feedbackActorHash(request);
  if (!actorHash) return reply({ error: "unavailable" }, 503);
  const result = await submitStudentSupport(support, actorHash);
  return reply(result, "ok" in result ? 200 : result.error === "rate_limited" ? 429 : result.error === "invalid" ? 400 : 503);
}
