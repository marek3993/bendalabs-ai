import { NextResponse } from "next/server";
import type { SiteLocale } from "@/lib/bendalabs/site-content";
import { persistSuccessfulAudit } from "@/lib/leads/repository";
import { generateSiteAudit } from "@/lib/site-audit/analyze";
import { crawlSite } from "@/lib/site-audit/crawl";
import { getDomainAuditOverride } from "@/lib/site-audit/overrides";
import { normalizeWebsiteUrl } from "@/lib/site-audit/url";

export const runtime = "nodejs";
export const maxDuration = 30;

function normalizeLocale(input: unknown): SiteLocale {
  return input === "cs" ? "cs" : "sk";
}

function getLocalizedMessage(locale: SiteLocale, key: "generic" | "invalidUrl") {
  const messages = {
    sk: {
      generic: "Nepodarilo sa spracovat audit webu.",
      invalidUrl: "Zadajte platnu webovu adresu. Staci aj domena ako bendalabs.sk.",
    },
    cs: {
      generic: "Nepodarilo se zpracovat audit webu.",
      invalidUrl: "Zadejte platnou webovou adresu. Staci i domena jako bendalabs.cz.",
    },
  } as const;

  return messages[locale][key];
}

function getErrorMessage(error: unknown, locale: SiteLocale) {
  if (error instanceof Error) {
    return error.message;
  }

  return getLocalizedMessage(locale, "generic");
}

export async function POST(request: Request) {
  let locale: SiteLocale = "sk";

  try {
    const body = (await request.json()) as { url?: string; locale?: string } | null;
    locale = normalizeLocale(body?.locale);
    const normalizedUrl = normalizeWebsiteUrl(body?.url ?? "");

    if (!normalizedUrl) {
      return NextResponse.json(
        { error: getLocalizedMessage(locale, "invalidUrl") },
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
    const message = getErrorMessage(error, locale);
    const status = /URL|nacit|html|vyprsal|vyprsel|prazdny|prazdne/i.test(message)
      ? 422
      : 500;

    return NextResponse.json({ error: message }, { status });
  }
}
