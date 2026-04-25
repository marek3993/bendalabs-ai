import { NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE,
  getAdminCookieOptions,
  getAdminSessionToken,
  isAdminProtectionConfigured,
  verifyAdminPassword,
} from "@/lib/leads/auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const redirectUrl = new URL("/admin/leads", request.url);

  if (!isAdminProtectionConfigured()) {
    redirectUrl.searchParams.set("auth", "config-missing");
    return NextResponse.redirect(redirectUrl);
  }

  const formData = await request.formData();
  const password = String(formData.get("password") ?? "");

  if (!verifyAdminPassword(password)) {
    redirectUrl.searchParams.set("auth", "failed");
    return NextResponse.redirect(redirectUrl);
  }

  const response = NextResponse.redirect(redirectUrl);
  const token = getAdminSessionToken();

  if (token) {
    response.cookies.set(ADMIN_SESSION_COOKIE, token, getAdminCookieOptions());
  }

  return response;
}
