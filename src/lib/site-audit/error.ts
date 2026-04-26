import type { SiteLocale } from "@/lib/bendalabs/site-content";
import { normalizeWebsiteUrl } from "@/lib/site-audit/url";

export type AuditErrorSuggestion = {
  message: string;
  actionLabel: string;
  url: string;
};

type AuditErrorCopy = {
  invalidUrl: string;
  generic: string;
  loadFailed: string;
  bendalabsSuggestion: string;
  bendalabsSuggestionAction: string;
};

const BENDA_LABS_SUGGESTION_URL = "https://bendalabs.sk";
const BENDA_LABS_TYPO_HOSTS = new Set([
  "bemdalabs.sk",
  "bendalab.sk",
  "bendalabs.com",
  "bendalabs.skk",
]);

function getAuditErrorCopy(locale: SiteLocale): AuditErrorCopy {
  if (locale === "cs") {
    return {
      invalidUrl:
        "Zadejte platnou webovou adresu. Sta\u010d\u00ed i dom\u00e9na jako bendalabs.cz.",
      generic: "Audit se te\u010f nepoda\u0159ilo vygenerovat.",
      loadFailed:
        "Tuto str\u00e1nku se nepoda\u0159ilo na\u010d\u00edst. Zkontrolujte, jestli je adresa napsan\u00e1 spr\u00e1vn\u011b, nebo zkuste jinou URL.",
      bendalabsSuggestion: "Nemysleli jste n\u00e1hodou bendalabs.sk?",
      bendalabsSuggestionAction: "Pou\u017e\u00edt https://bendalabs.sk",
    };
  }

  return {
    invalidUrl:
      "Zadajte platn\u00fa webov\u00fa adresu. Sta\u010d\u00ed aj dom\u00e9na ako bendalabs.sk.",
    generic: "Audit sa teraz nepodarilo vygenerova\u0165.",
    loadFailed:
      "T\u00fato str\u00e1nku sa nepodarilo na\u010d\u00edta\u0165. Skontrolujte, \u010di je adresa nap\u00edsan\u00e1 spr\u00e1vne, alebo sk\u00faste in\u00fa URL.",
    bendalabsSuggestion: "Nemysleli ste n\u00e1hodou bendalabs.sk?",
    bendalabsSuggestionAction: "Pou\u017ei\u0165 https://bendalabs.sk",
  };
}

function getHostnameFromInput(inputUrl: string) {
  const normalizedUrl = normalizeWebsiteUrl(inputUrl);
  const candidateUrl = normalizedUrl ?? inputUrl.trim();

  if (!candidateUrl) {
    return null;
  }

  const withProtocol =
    candidateUrl.startsWith("//") || /^[a-z][a-z\d+.-]*:\/\//i.test(candidateUrl)
      ? candidateUrl
      : `https://${candidateUrl}`;

  try {
    return new URL(withProtocol).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return null;
  }
}

export function getInvalidUrlMessage(locale: SiteLocale) {
  return getAuditErrorCopy(locale).invalidUrl;
}

export function getGenericAuditErrorMessage(locale: SiteLocale) {
  return getAuditErrorCopy(locale).generic;
}

export function getUrlLoadFailedMessage(locale: SiteLocale) {
  return getAuditErrorCopy(locale).loadFailed;
}

export function getBendaLabsSuggestion(
  inputUrl: string,
  locale: SiteLocale,
): AuditErrorSuggestion | null {
  const hostname = getHostnameFromInput(inputUrl);

  if (!hostname || !BENDA_LABS_TYPO_HOSTS.has(hostname)) {
    return null;
  }

  const copy = getAuditErrorCopy(locale);

  return {
    message: copy.bendalabsSuggestion,
    actionLabel: copy.bendalabsSuggestionAction,
    url: BENDA_LABS_SUGGESTION_URL,
  };
}

export function isAuditLoadFailure(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  const errorText = `${error.name} ${error.message}`.toLowerCase();

  return /fetch failed|failed to fetch|getaddrinfo|enotfound|eai_again|econnrefused|econnreset|timeout|timed out|nacitat|na\u010d\u00edtat|nacist|na\u010d\u00edst|html|prazdny|pr\u00e1zdn\u00fd/.test(
    errorText,
  );
}
