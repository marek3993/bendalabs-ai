import { NextResponse } from "next/server";
import { login, origin } from "@/lib/workspace/auth";
import { boundedBody, PRIVATE_HEADERS } from "@/lib/workspace/http";
export async function POST(req: Request) {
  let next = "/workspace";
  try {
    const form = new URLSearchParams(await boundedBody(req, 4096));
    const requested = form.get("next");
    if (requested?.startsWith("/workspace/oauth/authorize?")) next = requested;
    await login(req, form.get("username") || "", form.get("password") || "");
    return NextResponse.redirect(new URL(next, origin()), {
      status: 303,
      headers: PRIVATE_HEADERS,
    });
  } catch {
    return NextResponse.redirect(
      new URL(
        `/workspace?login=failed&next=${encodeURIComponent(next)}`,
        origin(),
      ),
      { status: 303, headers: PRIVATE_HEADERS },
    );
  }
}
