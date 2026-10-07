import curriculum from "@/components/robotics-university/lib/curriculum.json";
import courseLessons from "@/components/robotics-university/lib/course-lessons.json";
import { feedbackActorHash, submitFeedback } from "@/lib/university-feedback/server";
import { isSameOriginRequest, readBoundedBody, validateFeedback } from "@/lib/university-feedback/validation";

export const runtime = "nodejs";
const chapterIds = new Set([...curriculum, ...courseLessons].map(lesson => lesson.id));
const response = (data: object, status: number) => Response.json(data, { status, headers: { "cache-control": "no-store", ...(status === 429 ? { "retry-after": "3600" } : {}) } });

export async function POST(request: Request) {
  if (!isSameOriginRequest(request) || request.headers.get("content-type")?.split(";")[0].trim() !== "application/json") return response({ error: "invalid" }, 400);
  const body = await readBoundedBody(request);
  if (body === null) return response({ error: "invalid" }, 400);
  let parsed: unknown;
  try { parsed = JSON.parse(body); } catch { return response({ error: "invalid" }, 400); }
  const feedback = validateFeedback(parsed, chapterIds);
  if (!feedback) return response({ error: "invalid" }, 400);
  const actorHash = feedbackActorHash(request);
  if (!actorHash) return response({ error: "unavailable" }, 503);
  const result = await submitFeedback(feedback, actorHash);
  return response(result, "ok" in result ? 200 : result.error === "rate_limited" ? 429 : result.error === "invalid" ? 400 : 503);
}
