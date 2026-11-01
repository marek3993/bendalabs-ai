import { WorkspaceError } from "./storage";
export const PRIVATE_HEADERS = {
  "Cache-Control": "private, no-store, max-age=0",
  "X-Robots-Tag": "noindex, nofollow, noarchive",
  "Referrer-Policy": "same-origin",
  "X-Content-Type-Options": "nosniff",
};
export const json = (body: unknown, status = 200) =>
  Response.json(body, { status, headers: PRIVATE_HEADERS });
export function errorResponse(error: unknown) {
  if (error instanceof WorkspaceError)
    return json(
      { error: error.code, message: error.message, ...error.details },
      error.status,
    );
  return json(
    {
      error: "unavailable",
      message: "Pracovný priestor je dočasne nedostupný.",
    },
    503,
  );
}
export async function boundedBody(request: Request, max = 250000) {
  const reader = request.body?.getReader();
  if (!reader) throw new WorkspaceError("invalid_input", 400);
  let count = 0,
    text = "";
  const decoder = new TextDecoder();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    count += value.length;
    if (count > max) {
      await reader.cancel();
      throw new WorkspaceError("invalid_input", 413);
    }
    text += decoder.decode(value, { stream: true });
  }
  return text + decoder.decode();
}
