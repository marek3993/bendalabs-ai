export const MAX_FEEDBACK_BYTES = 12_000;
export const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type LessonFeedback = {
  chapterId: string;
  lang: "sk" | "en";
  rating: number | null;
  suggestion: string;
  submissionId: string;
};

export function validateFeedback(value: unknown, chapterIds: ReadonlySet<string>): LessonFeedback | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const input = value as Record<string, unknown>;
  if (typeof input.chapterId !== "string" || !chapterIds.has(input.chapterId)) return null;
  if (input.lang !== "sk" && input.lang !== "en") return null;
  if (input.rating !== null && (!Number.isInteger(input.rating) || Number(input.rating) < 1 || Number(input.rating) > 5)) return null;
  if (typeof input.suggestion !== "string" || input.suggestion.length > 2000) return null;
  const suggestion = input.suggestion.trim();
  if (suggestion.length > 0 && suggestion.length < 10) return null;
  if (input.rating === null && suggestion.length < 10) return null;
  if (typeof input.submissionId !== "string" || !UUID_PATTERN.test(input.submissionId)) return null;
  if (input.website !== "") return null;
  return { chapterId: input.chapterId, lang: input.lang, rating: input.rating as number | null, suggestion, submissionId: input.submissionId.toLowerCase() };
}

export function isSameOriginRequest(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin || request.headers.get("sec-fetch-site") === "cross-site") return false;
  try { return new URL(origin).origin === new URL(request.url).origin; } catch { return false; }
}

export async function readBoundedBody(request: Request, maxBytes = MAX_FEEDBACK_BYTES): Promise<string | null> {
  const declaredLength = request.headers.get("content-length");
  if (declaredLength && (!/^\d+$/.test(declaredLength) || Number(declaredLength) > maxBytes)) return null;
  if (!request.body) return null;
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) { await reader.cancel(); return null; }
      chunks.push(value);
    }
    const body = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) { body.set(chunk, offset); offset += chunk.byteLength; }
    return new TextDecoder("utf-8", { fatal: true }).decode(body);
  } catch { return null; }
}
