import { NextResponse } from "next/server";
import { authorization, resource } from "@/lib/workspace/oauth";
import { requestToken, token } from "@/lib/workspace/auth";
import { hash, rpc, WorkspaceError } from "@/lib/workspace/storage";
import {
  boundedBody,
  errorResponse,
  PRIVATE_HEADERS,
} from "@/lib/workspace/http";
export async function POST(req: Request) {
  try {
    const session = await requestToken(req, true);
    const form = new URLSearchParams(await boundedBody(req, 16000));
    const { params } = await authorization(Object.fromEntries(form));
    const code = token();
    const name = form.get("name")?.trim();
    if (!name || name.length > 150)
      throw new WorkspaceError("invalid_input", 400);
    await rpc(
      "authorize_client",
      {
        client_id: params.client_id,
        redirect_uri: params.redirect_uri,
        challenge: params.code_challenge,
        scope: params.scope,
        resource: resource(),
        code_hash: hash(code),
        name,
        project_ids: form.getAll("projects"),
      },
      session,
    );
    const url = new URL(params.redirect_uri);
    url.searchParams.set("code", code);
    url.searchParams.set("state", params.state);
    url.searchParams.set("iss", new URL(resource()).origin);
    return NextResponse.redirect(url, {
      status: 303,
      headers: PRIVATE_HEADERS,
    });
  } catch (e) {
    return errorResponse(e);
  }
}
