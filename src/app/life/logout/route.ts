import { NextResponse } from "next/server";
import { assertLifeSameOrigin, deleteLifeSession, requireLifeSession } from "@/lib/life/auth";
import { lifeError } from "@/lib/life/api";
export async function POST(request: Request) {
  try {
    assertLifeSameOrigin(request);
    await requireLifeSession();
    const form = await request.formData();
    await deleteLifeSession(form.get("all") === "true");
    const response = NextResponse.redirect(new URL("/life", request.url), 303);
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch (error) { return lifeError(error); }
}
