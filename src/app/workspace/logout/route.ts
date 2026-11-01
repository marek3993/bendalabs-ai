import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { COOKIE, origin, requestToken } from "@/lib/workspace/auth";
import { rpc } from "@/lib/workspace/storage";
import { errorResponse, PRIVATE_HEADERS } from "@/lib/workspace/http";
export async function POST(req: Request) {
  try {
    await rpc("logout", {}, await requestToken(req, true));
    (await cookies()).set(COOKIE, "", { path: "/workspace", maxAge: 0 });
    return NextResponse.redirect(new URL("/workspace", origin()), {
      status: 303,
      headers: PRIVATE_HEADERS,
    });
  } catch (e) {
    return errorResponse(e);
  }
}
