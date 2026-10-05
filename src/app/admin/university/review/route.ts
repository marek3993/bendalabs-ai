import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/leads/auth";
import { reviewFeedback } from "@/lib/university-feedback/server";
import { isSameOriginRequest, readBoundedBody, UUID_PATTERN } from "@/lib/university-feedback/validation";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isSameOriginRequest(request) || !await isAdminAuthenticated()) return new Response(null, { status: 403 });
  if (request.headers.get("content-type")?.split(";")[0] !== "application/x-www-form-urlencoded") return new Response(null, { status: 400 });
  const body = await readBoundedBody(request, 2048);
  if (body === null) return new Response(null, { status: 400 });
  const fields = new URLSearchParams(body);
  const id = fields.get("submissionId") ?? "";
  if (!UUID_PATTERN.test(id)) return new Response(null, { status: 400 });
  const destination = new URL("/admin/university", request.url);
  for (const key of ["chapter", "status", "page"]) {
    const value = fields.get(key);
    if (value && value.length < 65) destination.searchParams.set(key, value);
  }
  if (!await reviewFeedback(id)) destination.searchParams.set("error", "save");
  return NextResponse.redirect(destination, 303);
}
