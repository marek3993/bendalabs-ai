import { z } from "zod";
import { token } from "@/lib/workspace/auth";
import { validRedirect } from "@/lib/workspace/oauth";
import { rpc, WorkspaceError } from "@/lib/workspace/storage";
import { boundedBody, errorResponse, json } from "@/lib/workspace/http";
const schema = z.object({
  client_name: z.string().min(1).max(150),
  redirect_uris: z
    .array(z.string().max(2000).refine(validRedirect))
    .min(1)
    .max(10),
  token_endpoint_auth_method: z.literal("none").default("none"),
  grant_types: z
    .array(z.enum(["authorization_code", "refresh_token"]))
    .optional(),
  response_types: z.array(z.literal("code")).optional(),
});
export async function POST(req: Request) {
  try {
    const rate = await rpc<{ allowed: boolean }>("rate_limit", {
      key: "workspace-oauth-registration",
      limit: 60,
    });
    if (!rate.allowed) throw new WorkspaceError("rate_limited", 429);
    let input: unknown;
    try {
      input = JSON.parse(await boundedBody(req, 16000));
    } catch (e) {
      if (e instanceof WorkspaceError) throw e;
      throw new WorkspaceError("invalid_input", 400);
    }
    const data = schema.safeParse(input);
    if (!data.success) throw new WorkspaceError("invalid_input", 400);
    const id = token();
    await rpc("register_client", {
      id,
      name: data.data.client_name,
      redirect_uris: data.data.redirect_uris,
    });
    return json(
      {
        client_id: id,
        client_name: data.data.client_name,
        redirect_uris: data.data.redirect_uris,
        token_endpoint_auth_method: "none",
        grant_types: ["authorization_code", "refresh_token"],
        response_types: ["code"],
      },
      201,
    );
  } catch (e) {
    return errorResponse(e);
  }
}
