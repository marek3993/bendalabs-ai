import { extractPageSnapshot, type LinkCandidate, type PageSnapshot } from "@/lib/site-audit/extract";
import { normalizeWebsiteUrl } from "@/lib/site-audit/url";

const FETCH_TIMEOUT_MS = 8000;
const MAX_PAGES = 5;
const MAX_HTML_LENGTH = 200_000;
const MAX_SUMMARY_LENGTH = 14_000;

export type CrawledSite = {
  normalizedUrl: string;
  pages: PageSnapshot[];
  siteSummary: string;
};

async function fetchHtml(url: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      headers: {
        "user-agent":
          "Mozilla/5.0 (compatible; BendaLabsAuditBot/1.0; +https://bendalabs.ai)",
      },
      signal: controller.signal,
      redirect: "follow",
    });

    if (!response.ok) {
      throw new Error(`Stranku sa nepodarilo nacitat (${response.status}).`);
    }

    const contentType = response.headers.get("content-type") ?? "";

    if (!contentType.includes("text/html")) {
      throw new Error("Zadana URL nevracia HTML stranku.");
    }

    const html = (await response.text()).slice(0, MAX_HTML_LENGTH);

    if (!html.trim()) {
      throw new Error("Stranka vratila prazdny HTML obsah.");
    }

    return {
      finalUrl: response.url,
      html,
    };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Cas na nacitanie stranky vyprsal.");
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function pickRelevantLinks(homepageLinks: LinkCandidate[], rootUrl: string) {
  const root = new URL(rootUrl);
  const deduped = new Map<string, LinkCandidate>();

  for (const link of homepageLinks) {
    const url = new URL(link.url);
    const isHome = url.pathname === root.pathname;

    if (isHome) {
      continue;
    }

    if (!deduped.has(link.url) || deduped.get(link.url)!.score < link.score) {
      deduped.set(link.url, link);
    }
  }

  return [...deduped.values()]
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }

      return left.url.length - right.url.length;
    })
    .slice(0, MAX_PAGES - 1)
    .map((item) => item.url);
}

function listSummary(label: string, values: string[], fallback = "nezistene") {
  if (values.length === 0) {
    return `${label}: ${fallback}`;
  }

  return `${label}: ${values.join(" | ")}`;
}

function buildSiteSummary(pages: PageSnapshot[]) {
  const parts = pages.map((page, index) => {
    return [
      `Page ${index + 1}: ${page.pathname} (${page.url})`,
      `Title: ${page.title}`,
      `Meta description: ${page.metaDescription || "nezistena"}`,
      listSummary("Headings", page.headings.slice(0, 8)),
      listSummary("Navigation", page.navigationItems.slice(0, 8)),
      listSummary("Main CTA", page.ctas.slice(0, 6)),
      listSummary("Forms", page.forms.slice(0, 4)),
      listSummary("Content clusters", page.contentClusters.slice(0, 8)),
    ].join("\n");
  });

  const combined = [
    "Audit this site for suitability of an AI layer that routes visitors to the right next step.",
    "Focus on complexity, navigation depth, product or service breadth, filters, forms, calculators, contact flows, and upsell potential.",
    ...parts,
  ].join("\n\n");

  return combined.slice(0, MAX_SUMMARY_LENGTH);
}

export async function crawlSite(rawUrl: string): Promise<CrawledSite> {
  const normalizedUrl = normalizeWebsiteUrl(rawUrl);

  if (!normalizedUrl) {
    throw new Error("Zadajte platnu webovu adresu.");
  }

  const homepageResult = await fetchHtml(normalizedUrl);
  const homepage = extractPageSnapshot(homepageResult.finalUrl, homepageResult.html);
  const pages = [homepage];
  const linksToVisit = pickRelevantLinks(homepage.internalLinks, homepage.url);

  for (const link of linksToVisit) {
    try {
      const pageResult = await fetchHtml(link);
      pages.push(extractPageSnapshot(pageResult.finalUrl, pageResult.html));
    } catch {
      continue;
    }
  }

  return {
    normalizedUrl: homepage.url,
    pages,
    siteSummary: buildSiteSummary(pages),
  };
}
