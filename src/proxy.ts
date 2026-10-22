import { NextResponse, type NextRequest } from "next/server";
import { localeFromPath } from "@/lib/bendalabs/localization";
export function proxy(request: NextRequest) {
  const headers = new Headers(request.headers);
  headers.set("x-site-locale", localeFromPath(request.nextUrl.pathname));
  const isLife = request.nextUrl.pathname === "/life" || request.nextUrl.pathname.startsWith("/life/");
  headers.set("x-bendalabs-private-life", isLife ? "1" : "0");
  const response = NextResponse.next({ request: { headers } });
  if (isLife) {
    response.headers.set("Cache-Control", "private, no-store, max-age=0");
    response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
    // Native form POSTs use navigation mode: no-referrer makes browsers send
    // Origin: null, which our login/logout origin checks must reject. Keep the
    // origin for same-origin forms while withholding referrers from other sites.
    response.headers.set("Referrer-Policy", "same-origin");
    response.headers.set("X-Frame-Options", "DENY");
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
    response.headers.set("Content-Security-Policy", "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'");
  }
  return response;
}
export const config = { matcher: ["/((?!api|_next|share-image|favicon.ico|icon.png|apple-touch-icon.png|robots.txt|sitemap.xml|projects|brand).*)"] };
