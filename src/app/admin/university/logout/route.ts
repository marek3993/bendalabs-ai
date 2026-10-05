import { NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, getAdminCookieOptions } from "@/lib/leads/auth";
import { isSameOriginRequest } from "@/lib/university-feedback/validation";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return new Response(null, { status: 403 });
  const response = NextResponse.redirect(new URL("/admin/university", request.url), 303);
  response.cookies.set(ADMIN_SESSION_COOKIE, "", { ...getAdminCookieOptions(), maxAge: 0 });
  return response;
}
