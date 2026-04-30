import type { SiteLocale } from "@/lib/bendalabs/site-content";
import { normalizeWebsiteUrl } from "@/lib/site-audit/url";

export type AuditErrorType = "crawler_blocked" | "fetch_blocked" | "protected_site";
export type AuditFailureReason = AuditErrorType | "load_failed";

export type AuditErrorSuggestion = {
  message: string;
  actionLabel: string;
  url: string;
};

type AuditErrorCopy = {
  invalidUrl: string;
  generic: string;
  loadFailed: string;
  crawlerBlocked: string;
  bendalabsSuggestion: string;
  bendalabsSuggestionAction: string;
};

type SiteAuditErrorOptions = {
  cause?: unknown;
  statusCode?: number;
};

const BENDA_LABS_SUGGESTION_URL = "https://bendalabs.sk";
const BENDA_LABS_TYPO_HOSTS = new Set([
  "bemdalabs.sk",
  "bendalab.sk",
  "bendalabs.com",
  "bendalabs.skk",
]);

export class SiteAuditError extends Error {
  readonly reason: AuditFailureReason;
  readonly statusCode: number | null;

  constructor(reason: AuditFailureReason, message: string, options: SiteAuditErrorOptions = {}) {
    super(message, options.cause ? { cause: options.cause } : undefined);
    this.name = "SiteAuditError";
    this.reason = reason;
    this.statusCode = options.statusCode ?? null;
  }
}

function getAuditErrorCopy(locale: SiteLocale): AuditErrorCopy {
  if (locale === "cs") {
    return {
      invalidUrl:
        "Zadejte platnou webovou adresu. Sta\u010d\u00ed i dom\u00e9na jako bendalabs.cz.",
      generic: "Audit se te\u010f nepoda\u0159ilo vygenerovat.",
      loadFailed:
        "Tuto str\u00e1nku se nepoda\u0159ilo na\u010d\u00edst. Zkontrolujte, jestli je adresa napsan\u00e1 spr\u00e1vn\u011b, nebo zkuste jinou URL.",
      crawlerBlocked:
        "Tento web pravd\u011bpodobn\u011b blokuje automatick\u00e9 na\u010d\u00edt\u00e1n\u00ed. U velk\u00fdch e-shop\u016f nebo chr\u00e1n\u011bn\u00fdch web\u016f se to m\u016f\u017ee st\u00e1t. Pokud chcete, m\u016f\u017eeme p\u0159ipravit manu\u00e1ln\u00ed audit.",
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
    crawlerBlocked:
      "Tento web pravdepodobne blokuje automatick\u00e9 na\u010d\u00edtanie. Pri ve\u013ek\u00fdch e-shopoch alebo chr\u00e1nen\u00fdch weboch sa to m\u00f4\u017ee sta\u0165. Ak chcete, vieme pripravi\u0165 manu\u00e1lny audit.",
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

export function getCrawlerBlockedMessage(locale: SiteLocale) {
  return getAuditErrorCopy(locale).crawlerBlocked;
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

export function createSiteAuditError(
  reason: AuditFailureReason,
  message: string,
  options: SiteAuditErrorOptions = {},
) {
  return new SiteAuditError(reason, message, options);
}

export function getAuditErrorType(error: unknown): AuditErrorType | null {
  if (error instanceof SiteAuditError) {
    return error.reason === "load_failed" ? null : error.reason;
  }

  return null;
}

export function getAuditFailureReason(error: unknown): AuditFailureReason | null {
  if (error instanceof SiteAuditError) {
    return error.reason;
  }

  if (!(error instanceof Error)) {
    return null;
  }

  const errorText = `${error.name} ${error.message}`.toLowerCase();

  if (
    /fetch failed|failed to fetch|getaddrinfo|enotfound|eai_again|econnrefused|econnreset|timeout|timed out|nacitat|na\u010d\u00edtat|nacist|na\u010d\u00edst|html|prazdny|pr\u00e1zdn\u00fd/.test(
      errorText,
    )
  ) {
    return "load_failed";
  }

  return null;
}

export function isAuditLoadFailure(error: unknown) {
  return getAuditFailureReason(error) !== null;
}
