import { createHash, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const ADMIN_SESSION_COOKIE = "bendalabs_admin_leads";

function getAdminPassword() {
  const password = process.env.ADMIN_LEADS_PASSWORD?.trim();
  return password ? password : null;
}

function getSessionToken(password: string) {
  return createHash("sha256").update(`bendalabs-admin:${password}`).digest("hex");
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

export function isAdminProtectionConfigured() {
  return getAdminPassword() !== null;
}

export function verifyAdminPassword(candidate: string) {
  const password = getAdminPassword();

  if (!password) {
    return false;
  }

  return safeEqual(candidate, password);
}

export function getAdminSessionToken() {
  const password = getAdminPassword();
  return password ? getSessionToken(password) : null;
}

export async function isAdminAuthenticated() {
  const expectedToken = getAdminSessionToken();

  if (!expectedToken) {
    return false;
  }

  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;

  if (!sessionCookie) {
    return false;
  }

  return safeEqual(sessionCookie, expectedToken);
}

export function getAdminCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  };
}
