const contactPages = new Set([
  "/", "/labs", "/robotics", "/cs", "/cs/labs", "/cs/robotics",
  "/ai-audit-webu", "/cs/ai-audit-webu",
  "/ai-vrstva-pre-financne-a-poistne-weby", "/cs/ai-vrstva-pro-financni-a-pojistne-weby",
  "/ai-vrstva-pre-marketplace-a-rental-weby", "/cs/ai-vrstva-pro-marketplace-a-rental-weby",
]);

export function contactReturnPath(value: string | string[] | undefined, locale: "sk" | "cs") {
  const fallback = locale === "cs" ? "/cs#kontakt" : "/#kontakt";
  if (typeof value !== "string") return fallback;
  const [path, hash, ...extra] = value.split("#");
  const matchesLocale = locale === "cs" ? path.startsWith("/cs") : !path.startsWith("/cs");
  return contactPages.has(path) && matchesLocale && hash === "kontakt" && extra.length === 0 ? value : fallback;
}
