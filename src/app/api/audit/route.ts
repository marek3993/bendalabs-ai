import { NextResponse } from "next/server";
import type { SiteLocale } from "@/lib/bendalabs/site-content";
import { persistSuccessfulAudit } from "@/lib/leads/repository";
import { generateSiteAudit } from "@/lib/site-audit/analyze";
import { crawlSite } from "@/lib/site-audit/crawl";
import {
  getBendaLabsSuggestion,
  getGenericAuditErrorMessage,
  getInvalidUrlMessage,
  getUrlLoadFailedMessage,
  isAuditLoadFailure,
} from "@/lib/site-audit/error";
import { getDomainAuditOverride } from "@/lib/site-audit/overrides";
import { normalizeWebsiteUrl } from "@/lib/site-audit/url";

export const runtime = "nodejs";
export const maxDuration = 30;

function normalizeLocale(input: unknown): SiteLocale {
  return input === "cs" ? "cs" : "sk";
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
      return NextResponse.json(
        { error: getInvalidUrlMessage(locale) },
        { status: 400 },
      );
    }

    const domainOverride = getDomainAuditOverride(normalizedUrl, locale);

    if (domainOverride) {
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
    const audit = await generateSiteAudit(crawledSite.siteSummary, locale);

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
      const suggestion = getBendaLabsSuggestion(inputUrl, locale);

      return NextResponse.json(
        {
          error: getUrlLoadFailedMessage(locale),
          suggestion,
        },
        { status: 422 },
      );
    }

    return NextResponse.json(
      { error: getGenericAuditErrorMessage(locale) },
      { status: 500 },
    );
  }
}
