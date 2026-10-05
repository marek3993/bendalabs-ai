import { NextResponse, type NextRequest } from "next/server";
import { localeFromPath } from "@/lib/bendalabs/localization";
export function proxy(request: NextRequest) {
  const headers = new Headers(request.headers);
  headers.set("x-site-locale", localeFromPath(request.nextUrl.pathname));
  return NextResponse.next({ request: { headers } });
}
export const config = { matcher: ["/((?!api|_next|share-image|favicon.ico|icon.png|apple-touch-icon.png|robots.txt|sitemap.xml|projects|brand).*)"] };
