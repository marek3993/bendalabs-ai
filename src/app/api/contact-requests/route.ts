import { NextResponse } from "next/server";
import type { SiteLocale } from "@/lib/bendalabs/site-content";
import { getLeadFormCopy } from "@/lib/bendalabs/lead-form-content";
import { getContactRequestFieldErrors, parseContactRequestSubmission } from "@/lib/leads/contact-request";
import { persistContactRequest } from "@/lib/leads/repository";
import { isLeadStorageConfigured } from "@/lib/leads/supabase";

export const runtime = "nodejs";

function normalizeLocale(input: FormDataEntryValue | null): SiteLocale {
  return input === "cs" ? "cs" : "sk";
}

function sanitizeRelativePath(input: FormDataEntryValue | null, fallback: string) {
  if (typeof input !== "string") {
    return fallback;
  }

  const trimmed = input.trim();

  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) {
    return fallback;
  }

  return trimmed;
}

function getDefaultSuccessPath(locale: SiteLocale) {
  return locale === "cs" ? "/cs/dekujeme" : "/dakujem";
}

function getDefaultErrorPath(locale: SiteLocale) {
  return locale === "cs" ? "/cs/odeslani-selhalo" : "/odoslanie-zlyhalo";
}

function getDefaultBackPath(locale: SiteLocale) {
  return locale === "cs" ? "/cs" : "/";
}

function getLocalizedMessage(
  locale: SiteLocale,
  key: "generic" | "invalid" | "storage_unavailable",
) {
  const messages = {
    sk: {
      generic: "Nepodarilo sa odoslat dopyt.",
      invalid: "Skontrolujte vyplnene udaje.",
      storage_unavailable: "Ukladanie leadov este nie je nakonfigurovane.",
    },
    cs: {
      generic: "Nepodarilo se odeslat poptavku.",
      invalid: "Zkontrolujte vyplnene udaje.",
      storage_unavailable: "Ukladani leadu jeste neni nakonfigurovane.",
    },
  } as const;

  return messages[locale][key];
}

function buildRedirectUrl(
  request: Request,
  path: string,
  params: Record<string, string | null | undefined>,
) {
  const url = new URL(path, request.url);

  for (const [key, value] of Object.entries(params)) {
    if (value) {
      url.searchParams.set(key, value);
    }
  }

  return url;
}

function getValidationDetails(locale: SiteLocale, fieldErrors: ReturnType<typeof getContactRequestFieldErrors>) {
  const validationCopy = getLeadFormCopy(locale).validation;

  return Object.values(fieldErrors)
    .map((errorCode) => validationCopy[errorCode])
    .filter(Boolean)
    .join(" ");
}

function redirectToErrorPage(
  request: Request,
  locale: SiteLocale,
  errorPath: string,
  backPath: string,
  message: string,
  details?: string,
) {
  return NextResponse.redirect(
    buildRedirectUrl(request, errorPath, {
      locale,
      back: backPath,
      message,
      details,
    }),
    { status: 303 },
  );
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const locale = normalizeLocale(formData.get("locale"));
  const successPath = sanitizeRelativePath(formData.get("successPath"), getDefaultSuccessPath(locale));
  const errorPath = sanitizeRelativePath(formData.get("errorPath"), getDefaultErrorPath(locale));
  const backPath = sanitizeRelativePath(formData.get("returnPath"), getDefaultBackPath(locale));
  const payload = Object.fromEntries(formData.entries());
  const submission = parseContactRequestSubmission(payload);

  if (!submission.success) {
    const fieldErrors = getContactRequestFieldErrors(submission.error);
    const details = getValidationDetails(locale, fieldErrors);

    return redirectToErrorPage(
      request,
      locale,
      errorPath,
      backPath,
      getLocalizedMessage(locale, "invalid"),
      details,
    );
  }

  if (!isLeadStorageConfigured()) {
    return redirectToErrorPage(
      request,
      locale,
      errorPath,
      backPath,
      getLocalizedMessage(locale, "storage_unavailable"),
    );
  }

  try {
    const savedRequest = await persistContactRequest(request, submission.data);

    if (!savedRequest) {
      throw new Error("Contact request could not be saved.");
    }

    return NextResponse.redirect(new URL(successPath, request.url), { status: 303 });
  } catch (error) {
    console.error("Contact request submission failed.", {
      locale,
      error,
    });

    return redirectToErrorPage(
      request,
      locale,
      errorPath,
      backPath,
      getLocalizedMessage(locale, "generic"),
    );
  }
}
