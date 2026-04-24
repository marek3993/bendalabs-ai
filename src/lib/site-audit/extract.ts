export type LinkCandidate = {
  text: string;
  url: string;
  score: number;
};

export type PageSnapshot = {
  url: string;
  pathname: string;
  title: string;
  metaDescription: string;
  headings: string[];
  navigationItems: string[];
  ctas: string[];
  forms: string[];
  contentClusters: string[];
  internalLinks: LinkCandidate[];
};

const CTA_WORDS =
  /vyziadat|poziadat|kontakt|demo|audit|cen(n|)ik|zacat|zistit|vyskusat|compare|quote|start|get|request|book|reserve|pricing|contact|buy|shop|browse|explore|search|apply|sign up|learn more/i;

const RELEVANT_LINK_WORDS =
  /product|service|offer|category|catalog|listing|search|filter|pricing|quote|compare|calculator|loan|mortgage|insurance|rent|reservation|book|demo|request|solution|plans|services|produkty|sluzby|ponuka|kategorie|katalog|vyber|poistenie|poisteni|hypotek|uver|refinanc|rezerv|prenaj|nastroj|produkt|sluzba|kontakt|cen(n|)ik|audit/i;

const SKIP_LINK_WORDS = /privacy|cookie|career|blog|press|terms|gdpr|sitemap|cookies|login|signin|logout|register/i;

const ENTITY_MAP: Record<string, string> = {
  "&nbsp;": " ",
  "&amp;": "&",
  "&quot;": '"',
  "&#39;": "'",
  "&lt;": "<",
  "&gt;": ">",
};

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function decodeHtml(value: string) {
  return normalizeWhitespace(
    value
      .replace(/&(nbsp|amp|quot|#39|lt|gt);/g, (match) => ENTITY_MAP[match] ?? match)
      .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
      .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(Number.parseInt(code, 16))),
  );
}

function stripTags(value: string) {
  return decodeHtml(
    value
      .replace(/<br\s*\/?>/gi, " ")
      .replace(/<\/(p|div|section|article|li|ul|ol|nav|header|footer|main|aside|h[1-6]|form|button|a)>/gi, " ")
      .replace(/<[^>]+>/g, " "),
  );
}

function cleanHtml(html: string) {
  return html.replace(/<(script|style|noscript|svg|iframe)[^>]*>[\s\S]*?<\/\1>/gi, " ");
}

function uniqueStrings(values: string[], limit: number) {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of values) {
    const normalized = normalizeWhitespace(value);

    if (!normalized || normalized.length < 2) {
      continue;
    }

    const key = normalized.toLowerCase();

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    result.push(normalized);

    if (result.length >= limit) {
      break;
    }
  }

  return result;
}

function extractSingle(html: string, pattern: RegExp) {
  const match = pattern.exec(html);
  return match ? stripTags(match[1] ?? "") : "";
}

function extractMultiple(html: string, pattern: RegExp, limit: number) {
  const values: string[] = [];
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(html)) !== null) {
    values.push(stripTags(match[1] ?? ""));

    if (values.length >= limit * 2) {
      break;
    }
  }

  return uniqueStrings(values, limit);
}

function resolveInternalUrl(rawHref: string, baseUrl: string) {
  if (
    !rawHref ||
    rawHref.startsWith("#") ||
    rawHref.startsWith("mailto:") ||
    rawHref.startsWith("tel:") ||
    rawHref.startsWith("javascript:")
  ) {
    return null;
  }

  try {
    const resolved = new URL(rawHref, baseUrl);
    const base = new URL(baseUrl);

    if (resolved.origin !== base.origin) {
      return null;
    }

    if (/\.(pdf|jpg|jpeg|png|gif|webp|svg|zip|docx?|xlsx?)$/i.test(resolved.pathname)) {
      return null;
    }

    resolved.hash = "";
    return resolved.toString();
  } catch {
    return null;
  }
}

function scoreLink(text: string, url: string) {
  let score = 0;
  const composite = `${text} ${url}`.toLowerCase();

  if (RELEVANT_LINK_WORDS.test(composite)) {
    score += 3;
  }

  if (CTA_WORDS.test(text)) {
    score += 2;
  }

  if (url.split("/").filter(Boolean).length <= 2) {
    score += 1;
  }

  if (SKIP_LINK_WORDS.test(composite)) {
    score -= 4;
  }

  return score;
}

function extractAnchorRecords(html: string, baseUrl: string) {
  const anchors: LinkCandidate[] = [];
  const pattern = /<a\b([^>]*?)href=(["'])(.*?)\2[^>]*>([\s\S]*?)<\/a>/gi;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(html)) !== null) {
    const href = match[3] ?? "";
    const text = stripTags(match[4] ?? "") || stripTags(match[1] ?? "");
    const resolvedUrl = resolveInternalUrl(href, baseUrl);

    if (!resolvedUrl || !text) {
      continue;
    }

    anchors.push({
      text,
      url: resolvedUrl,
      score: scoreLink(text, resolvedUrl),
    });

    if (anchors.length >= 120) {
      break;
    }
  }

  return anchors;
}

function extractButtonTexts(html: string) {
  const values: string[] = [];
  const pattern = /<(button|a)\b[^>]*>([\s\S]*?)<\/\1>/gi;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(html)) !== null) {
    values.push(stripTags(match[2] ?? ""));

    if (values.length >= 18) {
      break;
    }
  }

  return uniqueStrings(values, 18)
    .filter((value) => CTA_WORDS.test(value))
    .slice(0, 8);
}

function extractForms(html: string) {
  const forms: string[] = [];
  const formPattern = /<form\b[^>]*>([\s\S]*?)<\/form>/gi;
  let formMatch: RegExpExecArray | null;

  while ((formMatch = formPattern.exec(html)) !== null) {
    const formHtml = formMatch[1] ?? "";
    const fieldMatches = Array.from(
      formHtml.matchAll(/<(input|textarea|select)\b([^>]*?)>/gi),
      (match) => match[2] ?? "",
    );

    const fields = fieldMatches
      .map((attributes) => {
        const type =
          attributes.match(/\btype=(["'])(.*?)\1/i)?.[2] ??
          attributes.match(/\bname=(["'])(.*?)\1/i)?.[2] ??
          attributes.match(/\bplaceholder=(["'])(.*?)\1/i)?.[2] ??
          "field";

        return stripTags(type);
      })
      .filter(Boolean)
      .slice(0, 5);

    if (fields.length > 0) {
      forms.push(`form fields: ${fields.join(", ")}`);
    }

    if (forms.length >= 4) {
      break;
    }
  }

  return uniqueStrings(forms, 4);
}

function extractMetaDescription(html: string) {
  const patterns = [
    /<meta[^>]+(?:name|property)=(["'])(?:description|og:description)\1[^>]+content=(["'])([\s\S]*?)\2[^>]*>/i,
    /<meta[^>]+content=(["'])([\s\S]*?)\1[^>]+(?:name|property)=(["'])(?:description|og:description)\3[^>]*>/i,
  ];

  for (const pattern of patterns) {
    const match = pattern.exec(html);

    if (!match) {
      continue;
    }

    const value = stripTags(match[2] ?? match[3] ?? "");

    if (value) {
      return value;
    }
  }

  return "";
}

export function extractPageSnapshot(pageUrl: string, html: string): PageSnapshot {
  const sanitizedHtml = cleanHtml(html);
  const url = new URL(pageUrl);
  const title =
    extractSingle(sanitizedHtml, /<title[^>]*>([\s\S]*?)<\/title>/i) || "Bez title";
  const metaDescription = extractMetaDescription(sanitizedHtml);

  const headings = extractMultiple(sanitizedHtml, /<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/gi, 12);
  const navigationHtml =
    sanitizedHtml.match(/<nav\b[^>]*>([\s\S]*?)<\/nav>/i)?.[1] ??
    sanitizedHtml.match(/<header\b[^>]*>([\s\S]*?)<\/header>/i)?.[1] ??
    "";
  const navigationItems = uniqueStrings(
    Array.from(
      navigationHtml.matchAll(/<a\b[^>]*>([\s\S]*?)<\/a>/gi),
      (match) => stripTags(match[1] ?? ""),
    ),
    10,
  );
  const internalLinks = extractAnchorRecords(sanitizedHtml, pageUrl);
  const ctas = uniqueStrings(
    [...extractButtonTexts(sanitizedHtml), ...internalLinks.map((item) => item.text).filter((text) => CTA_WORDS.test(text))],
    8,
  );
  const forms = extractForms(sanitizedHtml);
  const contentClusters = uniqueStrings(
    [
      ...headings,
      ...internalLinks.map((item) => item.text).filter((item) => item.length <= 42),
    ],
    12,
  );

  return {
    url: pageUrl,
    pathname: url.pathname || "/",
    title,
    metaDescription,
    headings,
    navigationItems,
    ctas,
    forms,
    contentClusters,
    internalLinks,
  };
}
