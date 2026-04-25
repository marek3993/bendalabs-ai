import { NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, getAdminCookieOptions } from "@/lib/leads/auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const redirectUrl = new URL("/admin/leads", request.url);
  const response = NextResponse.redirect(redirectUrl);

  response.cookies.set(ADMIN_SESSION_COOKIE, "", {
    ...getAdminCookieOptions(),
    maxAge: 0,
  });

  return response;
}
