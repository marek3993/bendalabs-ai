import { NextResponse } from "next/server";
import { persistSuccessfulAudit } from "@/lib/leads/repository";
import { generateSiteAudit } from "@/lib/site-audit/analyze";
import { crawlSite } from "@/lib/site-audit/crawl";
import { normalizeWebsiteUrl } from "@/lib/site-audit/url";

export const runtime = "nodejs";
export const maxDuration = 30;

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Nepodarilo sa spracovat audit webu.";
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { url?: string } | null;
    const normalizedUrl = normalizeWebsiteUrl(body?.url ?? "");

    if (!normalizedUrl) {
      return NextResponse.json(
        { error: "Zadajte platnu webovu adresu. Staci aj domena ako bendalabs.sk." },
        { status: 400 },
      );
    }

    const crawledSite = await crawlSite(normalizedUrl);
    const audit = await generateSiteAudit(crawledSite.siteSummary);

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
    const message = getErrorMessage(error);
    const status = /URL|nacit|HTML|vyprsal|prazdny/i.test(message) ? 422 : 500;

    return NextResponse.json({ error: message }, { status });
  }
}
