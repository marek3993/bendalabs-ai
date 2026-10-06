import { NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, getAdminCookieOptions, getAdminSessionToken, verifyAdminPassword } from "@/lib/leads/auth";
import { isSameOriginRequest, readBoundedBody } from "@/lib/university-feedback/validation";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isSameOriginRequest(request) || request.headers.get("content-type")?.split(";")[0] !== "application/x-www-form-urlencoded") return new Response(null, { status: 403 });
  const body = await readBoundedBody(request, 2048);
  if (body === null) return new Response(null, { status: 400 });
  const fields = new URLSearchParams(body);
  const password = fields.get("password") ?? "";
  const destination = new URL(fields.get("returnTo") === "/admin/university/questions" ? "/admin/university/questions" : "/admin/university", request.url);
  if (!verifyAdminPassword(password)) {
    destination.searchParams.set("auth", "failed");
    return NextResponse.redirect(destination, 303);
  }
  const token = getAdminSessionToken();
  const response = NextResponse.redirect(destination, 303);
  if (token) response.cookies.set(ADMIN_SESSION_COOKIE, token, getAdminCookieOptions());
  return response;
}
