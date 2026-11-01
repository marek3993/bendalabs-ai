export class ApiError extends Error {
  constructor(
    message: string,
    readonly code: string,
    readonly currentRevision?: number,
  ) {
    super(message);
  }
}
export async function api<T = Record<string, unknown>>(
  operation: string,
  payload: unknown = {},
): Promise<T> {
  const response = await fetch(`/workspace/api/${operation}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    cache: "no-store",
  });
  const body = await response.json();
  if (!response.ok)
    throw new ApiError(
      body.message || "Požiadavku sa nepodarilo dokončiť.",
      body.error,
      body.current_revision,
    );
  return body;
}
export const date = (value: string) =>
  new Intl.DateTimeFormat("sk-SK", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
export const message = (error: unknown) =>
  error instanceof Error ? error.message : "Požiadavku sa nepodarilo dokončiť.";
