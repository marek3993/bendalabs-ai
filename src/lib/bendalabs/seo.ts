import type { Metadata } from "next";
import { routeGroups, localeFromPath } from "./localization";

// Confirmed in src/lib/site-audit/error.ts and against the live Vercel site.
// Never derive canonical URLs from a request Host header or a preview URL.
export function resolveSiteOrigin(value = process.env.SITE_URL): URL {
  const url = new URL(value ?? "https://bendalabs.sk");
  if (url.protocol !== "https:" || url.username || url.password ||
      url.pathname !== "/" || url.search || url.hash) {
    throw new Error("SITE_URL must be an HTTPS origin without credentials, path, query, or fragment.");
  }
  return new URL(url.origin);
}

export const siteOrigin = resolveSiteOrigin();
export const isIndexableDeployment = process.env.NODE_ENV === "production" &&
  (!process.env.VERCEL_ENV || process.env.VERCEL_ENV === "production");

// Only real public pages: no redirects, anchors, APIs, admin, or form results.
export const localizedRoutes = Object.entries(routeGroups).filter(([key]) => key !== "success" && key !== "failure").map(([, group]) => group);
export const publicPaths: string[] = localizedRoutes.flatMap(group => Object.values(group));

export function absoluteUrl(path: string): string {
  return new URL(path, siteOrigin).href;
}

export function languageAlternates(path: string): Record<string, string> | undefined {
  const group = localizedRoutes.find(group => Object.values(group).some(value => value === path));
  return group ? { ...Object.fromEntries(Object.entries(group).map(([locale, value]) => [locale, absoluteUrl(value)])), "x-default": absoluteUrl(group.sk) } : undefined;
}

const shareImage = {
  url: absoluteUrl("/share-image"),
  width: 1200,
  height: 630,
  alt: "BendaLabs / BendaRobotics — Marek Benda",
  type: "image/png",
};

export function pageMetadata(path: string, title: string, description: string): Metadata {
  if (!publicPaths.includes(path)) throw new Error(`Unregistered public SEO route: ${path}`);
  const locale = localeFromPath(path);
  const ogLocales = { sk: "sk_SK", cs: "cs_CZ", en: "en_GB" };
  const languages = languageAlternates(path);
  return {
    title,
    description,
    alternates: { canonical: absoluteUrl(path), ...(languages ? { languages } : {}) },
    robots: { index: isIndexableDeployment, follow: true },
    openGraph: {
      type: "website",
      siteName: path.endsWith("/robotics") ? "BendaRobotics" : "BendaLabs",
      title,
      description,
      url: absoluteUrl(path),
      locale: ogLocales[locale],
      ...(languages ? { alternateLocale: Object.keys(languages).filter(key => key !== "x-default" && key !== locale).map(key => ogLocales[key as keyof typeof ogLocales]) } : {}),
      images: [shareImage],
    },
    twitter: { card: "summary_large_image", title, description, images: [shareImage] },
  };
}

export function privatePageMetadata(title: string): Metadata {
  return {
    title,
    robots: { index: false, follow: false },
    alternates: { canonical: null, languages: {} },
    openGraph: null,
    twitter: null,
  };
}
