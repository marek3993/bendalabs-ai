import { NextResponse } from "next/server";
import { assertLifeSameOrigin, createLifeSession } from "@/lib/life/auth";
export const runtime = "nodejs";
export async function POST(request: Request) {
  const destination = new URL("/life", request.url);
  try {
    assertLifeSameOrigin(request);
    if (Number(request.headers.get("content-length") || 0) > 10000) return new Response("Požiadavka je príliš veľká.", { status: 413 });
    const form = await request.formData();
    const password = form.get("password");
    if (typeof password !== "string" || password.length > 512) destination.searchParams.set("auth", "failed");
    else {
      const result = await createLifeSession(password, form.get("remember") === "on", request);
      if (!result.ok) destination.searchParams.set("auth", result.reason === "rate_limited" ? "limited" : result.reason === "unavailable" ? "unavailable" : "failed");
    }
  } catch { destination.searchParams.set("auth", "unavailable"); }
  const response = NextResponse.redirect(destination, 303);
  response.headers.set("Cache-Control", "no-store");
  return response;
}
