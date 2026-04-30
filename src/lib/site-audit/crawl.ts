import { extractPageSnapshot, type LinkCandidate, type PageSnapshot } from "@/lib/site-audit/extract";
import {
  createSiteAuditError,
  type AuditErrorType,
  SiteAuditError,
} from "@/lib/site-audit/error";
import { normalizeWebsiteUrl } from "@/lib/site-audit/url";

const FETCH_TIMEOUT_MS = 8000;
const MAX_PAGES = 5;
const MAX_HTML_LENGTH = 200_000;
const MAX_SUMMARY_LENGTH = 14_000;
const BLOCKED_STATUS_CODES = new Set([401, 403, 429]);
const PROTECTED_PAGE_PATTERNS = [
  /captcha/i,
  /verify you are human/i,
  /security check/i,
  /access denied/i,
  /attention required/i,
  /robot check/i,
  /bot detection/i,
  /request blocked/i,
  /blocked by/i,
  /cloudflare/i,
  /datadome/i,
  /perimeterx/i,
  /challenge/i,
  /enable javascript.*continue/i,
];
const JS_SHELL_PATTERNS = [
  /id=(["'])__next\1/i,
  /id=(["'])app\1/i,
  /<script\b/gi,
  /window\.__/i,
  /hydration/i,
];

export type CrawledSite = {
  normalizedUrl: string;
  pages: PageSnapshot[];
  siteSummary: string;
};

function stripHtmlToText(html: string) {
  return html
    .replace(/<(script|style|noscript|svg|iframe)[^>]*>[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function matchesProtectedPage(text: string) {
  return PROTECTED_PAGE_PATTERNS.some((pattern) => pattern.test(text));
}

function countPatternMatches(html: string, pattern: RegExp) {
  const flags = pattern.flags.includes("g") ? pattern.flags : `${pattern.flags}g`;
  const matcher = new RegExp(pattern.source, flags);
  return Array.from(html.matchAll(matcher)).length;
}

function classifyBlockedHtml(html: string): AuditErrorType | null {
  const visibleText = stripHtmlToText(html);

  if (matchesProtectedPage(visibleText)) {
    return "protected_site";
  }

  if (!visibleText) {
    return "crawler_blocked";
  }

  const scriptMatchCount = JS_SHELL_PATTERNS.reduce(
    (total, pattern) => total + countPatternMatches(html, pattern),
    0,
  );

  if (visibleText.length < 120 && scriptMatchCount >= 3) {
    return "crawler_blocked";
  }

  return null;
}

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

    const contentType = response.headers.get("content-type") ?? "";
    const isHtmlResponse = contentType.includes("text/html");
    const responseText = isHtmlResponse ? (await response.text()).slice(0, MAX_HTML_LENGTH) : "";

    if (!response.ok) {
      if (BLOCKED_STATUS_CODES.has(response.status)) {
        throw createSiteAuditError(
          "fetch_blocked",
          `Cielovy web odmietol automaticke nacitanie (${response.status}).`,
          { statusCode: response.status },
        );
      }

      const blockedType = responseText ? classifyBlockedHtml(responseText) : null;

      if (blockedType) {
        throw createSiteAuditError(
          blockedType,
          `Cielovy web vratil ochrannu alebo blokovaciu stranku (${response.status}).`,
          { statusCode: response.status },
        );
      }

      throw createSiteAuditError(
        "load_failed",
        `Stranku sa nepodarilo nacitat (${response.status}).`,
        { statusCode: response.status },
      );
    }

    if (!isHtmlResponse) {
      throw createSiteAuditError("load_failed", "Zadana URL nevracia HTML stranku.");
    }

    const html = responseText;

    if (!html.trim()) {
      throw createSiteAuditError("crawler_blocked", "Stranka vratila prazdny HTML obsah.");
    }

    const blockedType = classifyBlockedHtml(html);

    if (blockedType) {
      throw createSiteAuditError(
        blockedType,
        "Stranka vyzera ako ochranna, challenge alebo blokovacia odpoved.",
        { statusCode: response.status },
      );
    }

    return {
      finalUrl: response.url,
      html,
    };
  } catch (error) {
    if (error instanceof SiteAuditError) {
      throw error;
    }

    if (error instanceof Error && error.name === "AbortError") {
      throw createSiteAuditError("fetch_blocked", "Cas na nacitanie stranky vyprsal.", {
        cause: error,
      });
    }

    if (error instanceof Error) {
      const errorText = `${error.name} ${error.message}`.toLowerCase();

      if (/redirect|too many redirects|redirect loop/.test(errorText)) {
        throw createSiteAuditError(
          "fetch_blocked",
          "Web presmerovava poziadavku do nekonecneho cyklu.",
          { cause: error },
        );
      }

      if (/captcha|challenge|access denied|blocked|forbidden|cloudflare|datadome/.test(errorText)) {
        throw createSiteAuditError("protected_site", error.message, { cause: error });
      }
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
