import "server-only";
import { createHash } from "node:crypto";
import { z } from "zod";
import { origin, token } from "./auth";
import { hash, rpc, WorkspaceError } from "./storage";
export const resource = () => `${origin()}/workspace/mcp`;
export const protectedMetadata = () => ({
  resource: resource(),
  authorization_servers: [origin()],
  scopes_supported: ["workspace:read", "workspace:write"],
  bearer_methods_supported: ["header"],
  resource_name: "BendaLabs Workspace",
});
export const serverMetadata = () => ({
  issuer: origin(),
  authorization_endpoint: `${origin()}/workspace/oauth/authorize`,
  token_endpoint: `${origin()}/workspace/oauth/token`,
  registration_endpoint: `${origin()}/workspace/oauth/register`,
  revocation_endpoint: `${origin()}/workspace/oauth/revoke`,
  response_types_supported: ["code"],
  grant_types_supported: ["authorization_code", "refresh_token"],
  token_endpoint_auth_methods_supported: ["none"],
  code_challenge_methods_supported: ["S256"],
  authorization_response_iss_parameter_supported: true,
  scopes_supported: ["workspace:read", "workspace:write"],
});
export const authorizationSchema = z.object({
  client_id: z.string().max(300),
  redirect_uri: z.string().url().max(2000),
  response_type: z.literal("code"),
  code_challenge: z.string().regex(/^[A-Za-z0-9_-]{43}$/),
  code_challenge_method: z.literal("S256"),
  resource: z.string().refine((v) => v === resource()),
  state: z.string().min(1).max(1000),
  scope: z
    .string()
    .max(100)
    .default("workspace:read")
    .transform((v) => [...new Set(v.trim().split(/\s+/))].sort().join(" "))
    .pipe(z.enum(["workspace:read", "workspace:read workspace:write"])),
});
export async function authorization(input: unknown) {
  const p = authorizationSchema.safeParse(input);
  if (!p.success) throw new WorkspaceError("invalid_input", 400);
  const client = await rpc<{
    id: string;
    name: string;
    redirect_uris: string[];
  } | null>("get_client", { id: p.data.client_id });
  if (
    !client ||
    !client.redirect_uris.some((uri) =>
      redirectMatches(uri, p.data.redirect_uri),
    )
  )
    throw new WorkspaceError("invalid_input", 400);
  return { params: p.data, client };
}
export function redirectMatches(registered: string, requested: string) {
  if (!validRedirect(requested)) return false;
  if (registered === requested) return true;
  const a = new URL(registered),
    b = new URL(requested);
  if (
    a.protocol !== "http:" ||
    b.protocol !== "http:" ||
    !["127.0.0.1", "[::1]", "localhost"].includes(a.hostname) ||
    a.hostname !== b.hostname
  )
    return false;
  a.port = "";
  b.port = "";
  return a.href === b.href;
}
export function validRedirect(value: string) {
  try {
    const u = new URL(value);
    return (
      !u.hash &&
      !u.username &&
      !u.password &&
      (u.protocol === "https:" ||
        (u.protocol === "http:" &&
          ["127.0.0.1", "[::1]", "localhost"].includes(u.hostname)))
    );
  } catch {
    return false;
  }
}
export async function exchange(form: URLSearchParams) {
  const access = token(),
    refresh = token(),
    client_id = form.get("client_id");
  if (!client_id || form.get("resource") !== resource())
    throw new WorkspaceError("invalid_grant", 400);
  let result: { scope: string };
  if (form.get("grant_type") === "authorization_code") {
    const verifier = form.get("code_verifier") || "",
      code = form.get("code") || "";
    if (
      !/^[A-Za-z0-9._~-]{43,128}$/.test(verifier) ||
      !/^[A-Za-z0-9_-]{43}$/.test(code)
    )
      throw new WorkspaceError("invalid_grant", 400);
    result = await rpc("exchange_code", {
      client_id,
      code_hash: hash(code),
      redirect_uri: form.get("redirect_uri"),
      resource: resource(),
      challenge: createHash("sha256").update(verifier).digest("base64url"),
      access_hash: hash(access),
      refresh_hash: hash(refresh),
    });
  } else if (form.get("grant_type") === "refresh_token") {
    result = await rpc("refresh_token", {
      client_id,
      resource: resource(),
      refresh_hash: hash(form.get("refresh_token") || ""),
      access_hash: hash(access),
      next_refresh_hash: hash(refresh),
    });
  } else throw new WorkspaceError("invalid_grant", 400);
  return {
    access_token: access,
    refresh_token: refresh,
    token_type: "Bearer",
    expires_in: 3600,
    scope: result.scope,
  };
}
