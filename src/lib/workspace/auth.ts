import "server-only";
import { cookies } from "next/headers";
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import {
  credentialVersion,
  hash,
  ownerPassword,
  rpc,
  WorkspaceError,
} from "./storage";
import type { Identity } from "./types";
export const COOKIE = "bendalabs_workspace_session";
export const token = () => randomBytes(32).toString("base64url");
export function origin() {
  return (
    process.env.WORKSPACE_ORIGIN ||
    (process.env.VERCEL_ENV === "preview" && process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "https://bendalabs.sk")
  ).replace(/\/$/, "");
}
export function sameOrigin(req: Request) {
  const raw = req.headers.get("origin");
  const target = new URL(req.url);
  const allowed = new Set([
    origin(),
    "https://bendalabs.sk",
    "https://www.bendalabs.sk",
  ]);
  if (process.env.NODE_ENV !== "production") allowed.add(target.origin);
  if (
    !raw ||
    !allowed.has(raw) ||
    req.headers.get("sec-fetch-site") === "cross-site"
  )
    throw new WorkspaceError("forbidden", 403);
}
export async function sessionToken() {
  return (await cookies()).get(COOKIE)?.value;
}
export async function identity(raw?: string): Promise<Identity | null> {
  const value = raw ?? (await sessionToken());
  if (!value) return null;
  try {
    return await rpc<Identity>("whoami", {}, value);
  } catch (e) {
    if (e instanceof WorkspaceError && e.status === 401) return null;
    throw e;
  }
}
export async function requestToken(req: Request, write = false) {
  const auth = req.headers.get("authorization");
  if (auth !== null) {
    if (!/^Bearer [A-Za-z0-9_-]{43}$/.test(auth))
      throw new WorkspaceError("unauthorized", 401);
    return auth.slice(7);
  }
  if (write) sameOrigin(req);
  const raw = await sessionToken();
  if (!raw) throw new WorkspaceError("unauthorized", 401);
  return raw;
}
export function passwordHash(value: string) {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${scryptSync(value, salt, 64).toString("hex")}`;
}
function verify(value: string, stored: string) {
  const [salt, digest] = stored.split(":");
  if (!salt || !digest) return false;
  const expected = Buffer.from(digest, "hex");
  return (
    expected.length === 64 &&
    timingSafeEqual(scryptSync(value, salt, 64), expected)
  );
}
export async function login(req: Request, username: string, password: string) {
  sameOrigin(req);
  const global = await rpc<{ allowed: boolean }>("rate_limit", {
    key: "workspace-login-global",
    limit: 80,
  });
  const rate = await rpc<{ allowed: boolean }>("rate_limit", {
    key: `login:${hash(username.toLowerCase())}`,
    limit: 10,
  });
  if (!global.allowed || !rate.allowed)
    throw new WorkspaceError("rate_limited", 429);
  const person = await rpc<{
    id: string;
    is_owner: boolean;
    password_hash: string;
  } | null>("login_identity", { username: username.trim().toLowerCase() });
  const owner = ownerPassword();
  const valid =
    person &&
    (person.is_owner
      ? Boolean(
          owner &&
          timingSafeEqual(
            Buffer.from(hash(password)),
            Buffer.from(hash(owner)),
          ),
        )
      : verify(password, person.password_hash || ""));
  if (!valid) throw new WorkspaceError("unauthorized", 401);
  const value = token();
  await rpc("create_session", {
    person_id: person!.id,
    hash: hash(value),
    credential_version: credentialVersion(),
  });
  (await cookies()).set(COOKIE, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/workspace",
    maxAge: 43200,
  });
}
