import { NextResponse } from "next/server";
import type { SiteLocale } from "@/lib/bendalabs/site-content";
import {
  getContactRequestFieldErrors,
  parseContactRequestSubmission,
} from "@/lib/leads/contact-request";
import { persistContactRequest } from "@/lib/leads/repository";
import { isLeadStorageConfigured } from "@/lib/leads/supabase";

export const runtime = "nodejs";

const isDev = process.env.NODE_ENV !== "production";

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

function logContactRequestError(error: unknown, locale: SiteLocale) {
  console.error("Contact request submission failed.", {
    locale,
    error,
  });
}

function getErrorPayload(error: unknown, locale: SiteLocale) {
  const payload: { error: string; details?: string } = {
    error: getLocalizedMessage(locale, "generic"),
  };

  if (isDev && error instanceof Error && error.message) {
    payload.details = error.message;
  }

  return payload;
}

export async function POST(request: Request) {
  let locale: SiteLocale = "sk";

  try {
    let body: Record<string, unknown> | null = null;

    try {
      body = (await request.json()) as Record<string, unknown> | null;
    } catch {
      return NextResponse.json(
        { error: getLocalizedMessage(locale, "invalid") },
        { status: 400 },
      );
    }

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
    logContactRequestError(error, locale);

    return NextResponse.json(
      getErrorPayload(error, locale),
      { status: 500 },
    );
  }
}
