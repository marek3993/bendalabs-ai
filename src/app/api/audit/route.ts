import { NextResponse } from "next/server";
import type { SiteLocale } from "@/lib/bendalabs/site-content";
import { persistAuditFailure, persistSuccessfulAudit } from "@/lib/leads/repository";
import { generateSiteAudit } from "@/lib/site-audit/analyze";
import { crawlSite } from "@/lib/site-audit/crawl";
import {
  getAuditErrorType,
  getAuditFailureReason,
  getBendaLabsSuggestion,
  getCrawlerBlockedMessage,
  getGenericAuditErrorMessage,
  getInvalidUrlMessage,
  getUrlLoadFailedMessage,
  isAuditLoadFailure,
  SiteAuditError,
} from "@/lib/site-audit/error";
import { getDomainAuditOverride } from "@/lib/site-audit/overrides";
import { normalizeWebsiteUrl } from "@/lib/site-audit/url";

export const runtime = "nodejs";
export const maxDuration = 30;

const DOMAIN_OVERRIDE_DELAY_MS = 4500;

function normalizeLocale(input: unknown): SiteLocale {
  return input === "cs" ? "cs" : "sk";
}

function waitForOverrideDelay() {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, DOMAIN_OVERRIDE_DELAY_MS);
  });
}

export async function POST(request: Request) {
  let locale: SiteLocale = "sk";
  let inputUrl = "";

  try {
    const body = (await request.json()) as { url?: string; locale?: string } | null;
    locale = normalizeLocale(body?.locale);
    inputUrl = body?.url ?? "";
    const normalizedUrl = normalizeWebsiteUrl(inputUrl);

    if (!normalizedUrl) {
      const invalidUrlMessage = getInvalidUrlMessage(locale);

      return NextResponse.json(
        {
          error: invalidUrlMessage,
          message: invalidUrlMessage,
          classification: null,
        },
        { status: 400 },
      );
    }

    const domainOverride = getDomainAuditOverride(normalizedUrl, locale);

    if (domainOverride) {
      await waitForOverrideDelay();

      try {
        await persistSuccessfulAudit(request, normalizedUrl, domainOverride);
      } catch (leadCaptureError) {
        console.error("Lead capture save failed:", leadCaptureError);
      }

      return NextResponse.json({
        audit: domainOverride,
        inspected_pages: [normalizedUrl],
      });
    }

    const crawledSite = await crawlSite(normalizedUrl);
    const audit = await generateSiteAudit(crawledSite.siteSummary, {
      locale,
      inputUrl: crawledSite.normalizedUrl,
    });

    try {
      await persistSuccessfulAudit(request, crawledSite.normalizedUrl, audit);
    } catch (leadCaptureError) {
      console.error("Lead capture save failed:", leadCaptureError);
    }

    return NextResponse.json({
      audit,
      inspected_pages: crawledSite.pages.map((page) => page.url),
    });
  } catch (error) {
    console.error("Audit request failed:", error);

    if (isAuditLoadFailure(error)) {
      const errorType = getAuditErrorType(error);
      const failureReason = getAuditFailureReason(error);

      if (errorType) {
        const blockedMessage = getCrawlerBlockedMessage(locale);

        try {
          await persistAuditFailure(request, inputUrl, {
            reason: "crawler_blocked",
            classification: errorType,
            httpStatus: error instanceof SiteAuditError ? error.statusCode : null,
            technicalMessage: error instanceof Error ? error.message : String(error),
          });
        } catch (auditFailureLogError) {
          console.error("Audit failure save failed:", auditFailureLogError);
        }

        return NextResponse.json(
          {
            error: blockedMessage,
            message: blockedMessage,
            error_type: errorType,
            classification: errorType,
          },
          { status: 422 },
        );
      }

      const suggestion =
        failureReason === "load_failed" ? getBendaLabsSuggestion(inputUrl, locale) : null;
      const loadFailedMessage = getUrlLoadFailedMessage(locale);

      return NextResponse.json(
        {
          error: loadFailedMessage,
          message: loadFailedMessage,
          classification: null,
          suggestion,
        },
        { status: 422 },
      );
    }

    const genericErrorMessage = getGenericAuditErrorMessage(locale);

    return NextResponse.json(
      {
        error: genericErrorMessage,
        message: genericErrorMessage,
        classification: null,
      },
      { status: 500 },
    );
  }
}
