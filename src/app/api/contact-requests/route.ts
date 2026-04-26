import { NextResponse } from "next/server";
import type { SiteLocale } from "@/lib/bendalabs/site-content";
import {
  getContactRequestFieldErrors,
  parseContactRequestSubmission,
} from "@/lib/leads/contact-request";
import { persistContactRequest } from "@/lib/leads/repository";
import { isLeadStorageConfigured } from "@/lib/leads/supabase";

export const runtime = "nodejs";

function normalizeLocale(input: unknown): SiteLocale {
  return input === "cs" ? "cs" : "sk";
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

function getErrorMessage(error: unknown, locale: SiteLocale) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return getLocalizedMessage(locale, "generic");
}

export async function POST(request: Request) {
  let locale: SiteLocale = "sk";

  try {
    const body = (await request.json()) as Record<string, unknown> | null;
    locale = normalizeLocale(body?.locale);
    const submission = parseContactRequestSubmission(body);

    if (!submission.success) {
      return NextResponse.json(
        {
          error: getLocalizedMessage(locale, "invalid"),
          fieldErrors: getContactRequestFieldErrors(submission.error),
        },
        { status: 400 },
      );
    }

    if (!isLeadStorageConfigured()) {
      return NextResponse.json(
        { error: getLocalizedMessage(locale, "storage_unavailable") },
        { status: 503 },
      );
    }

    const savedRequest = await persistContactRequest(request, submission.data);

    if (!savedRequest) {
      throw new Error(getLocalizedMessage(locale, "generic"));
    }

    return NextResponse.json({
      success: true,
      contactRequest: savedRequest,
    });
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error, locale) },
      { status: 500 },
    );
  }
}
