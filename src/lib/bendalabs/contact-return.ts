import { localeFromPath, pagePath, routeGroups } from "./localization";
import type { SiteLocale } from "./site-content";
const contactPages = new Set<string>(Object.entries(routeGroups).filter(([key]) => !["proposal", "success", "failure"].includes(key)).flatMap(([, group]) => Object.values(group)));
export function contactReturnPath(value: string | string[] | undefined, locale: SiteLocale) {
  const fallback = pagePath("home", locale) + "#kontakt";
  if (typeof value !== "string") return fallback;
  const [path, hash, ...extra] = value.split("#");
  return contactPages.has(path) && localeFromPath(path) === locale && hash === "kontakt" && extra.length === 0 ? value : fallback;
}
