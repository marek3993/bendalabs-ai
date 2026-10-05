import type { SiteLocale } from "./site-content";

export const siteLocales = ["sk", "cs", "en"] as const;
export const routeGroups = {
  home: { sk: "/", cs: "/cs", en: "/en" },
  labs: { sk: "/labs", cs: "/cs/labs", en: "/en/labs" },
  robotics: { sk: "/robotics", cs: "/cs/robotics", en: "/en/robotics" },
  university: { sk: "/roboticka-univerzita", en: "/en/robotics-university" },
  audit: { sk: "/ai-audit-webu", cs: "/cs/ai-audit-webu", en: "/en/ai-website-audit" },
  proposal: { sk: "/ai-navrh-na-mieru", en: "/en/custom-ai-proposal" },
  finance: { sk: "/ai-vrstva-pre-financne-a-poistne-weby", cs: "/cs/ai-vrstva-pro-financni-a-pojistne-weby", en: "/en/ai-layer-for-finance-and-insurance" },
  marketplace: { sk: "/ai-vrstva-pre-marketplace-a-rental-weby", cs: "/cs/ai-vrstva-pro-marketplace-a-rental-weby", en: "/en/ai-layer-for-marketplaces-and-rentals" },
  success: { sk: "/dakujem", cs: "/cs/dekujeme", en: "/en/thank-you" },
  failure: { sk: "/odoslanie-zlyhalo", cs: "/cs/odeslani-selhalo", en: "/en/submission-failed" },
} as const;
export type PageKey = keyof typeof routeGroups;
export function localeFromPath(path: string): SiteLocale {
  return /^\/en(?:\/|$)/.test(path) ? "en" : /^\/cs(?:\/|$)/.test(path) ? "cs" : "sk";
}
export function pagePath(page: PageKey, locale: SiteLocale): string {
  const group: Partial<Record<SiteLocale, string>> = routeGroups[page];
  return group[locale] ?? routeGroups.home[locale];
}
export function equivalentPath(path: string, locale: SiteLocale): string {
  const pathname = path.split(/[?#]/)[0].replace(/\/$/, "") || "/";
  const group = Object.values(routeGroups).find(group => Object.values(group).some(value => value === pathname)) as Partial<Record<SiteLocale, string>> | undefined;
  return group?.[locale] ?? routeGroups.home[locale];
}
