import type { Metadata } from "next";

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
export const localizedRoutes = [
  { sk: "/", cs: "/cs" },
  { sk: "/labs", cs: "/cs/labs" },
  { sk: "/robotics", cs: "/cs/robotics" },
  { sk: "/ai-audit-webu", cs: "/cs/ai-audit-webu" },
  { sk: "/ai-vrstva-pre-financne-a-poistne-weby", cs: "/cs/ai-vrstva-pro-financni-a-pojistne-weby" },
  { sk: "/ai-vrstva-pre-marketplace-a-rental-weby", cs: "/cs/ai-vrstva-pro-marketplace-a-rental-weby" },
] as const;
export const publicPaths = [
  ...localizedRoutes.flatMap(({ sk, cs }) => [sk, cs]),
  "/ai-navrh-na-mieru",
];

export function absoluteUrl(path: string): string {
  return new URL(path, siteOrigin).href;
}

export function languageAlternates(path: string): Record<string, string> | undefined {
  const pair = localizedRoutes.find(({ sk, cs }) => path === sk || path === cs);
  return pair ? { sk: absoluteUrl(pair.sk), cs: absoluteUrl(pair.cs), "x-default": absoluteUrl(pair.sk) } : undefined;
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
  const cs = path === "/cs" || path.startsWith("/cs/");
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
      locale: cs ? "cs_CZ" : "sk_SK",
      ...(languages ? { alternateLocale: [cs ? "sk_SK" : "cs_CZ"] } : {}),
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
