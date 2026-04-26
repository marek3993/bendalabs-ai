import { getNormalizedDomain } from "@/lib/leads/domain";
import { siteAuditSchema, type RawSiteAudit, type SiteAudit } from "./schema";

export type FitLabelKey = "low" | "borderline" | "good" | "strong";
export type FitTier = "LOW-FIT" | "MID-FIT" | "HIGH-FIT";

type FitSignal = "low" | "mixed" | "high" | null;
type SiteArchetype = "content" | "commerce" | "financial" | "marketplace" | "service" | "generic";
type ScoreBand = {
  min: number;
  max: number;
  isGoodFit: boolean;
};

const LOW_SIGNAL_PATTERNS = [
  "slaby fit",
  "slabsi fit",
  "nevhodn",
  "limitovany prinos",
  "maly prinos",
  "minimalny prinos",
  "minimalny priestor",
  "obmedzeny priestor",
  "nizky potencial",
  "jednoduchy web",
  "slaby potencial",
  "omezeny prinos",
  "maly prinos",
  "minimalni prinos",
  "minimalni prostor",
  "omezeny prostor",
  "nizky potencial",
  "jednoduchy web",
];

const MIXED_SIGNAL_PATTERNS = [
  "hranicny fit",
  "zmiesany fit",
  "mixed fit",
  "ciastocny fit",
  "s rezervou",
  "na vybranych miestach",
  "hranicni fit",
  "smiseny fit",
  "castecny fit",
  "na vybranych mistech",
];

const HIGH_SIGNAL_PATTERNS = [
  "velmi silny fit",
  "silny fit",
  "dobry fit",
  "vysoky potencial",
  "silny priestor",
  "vyrazny priestor",
  "velmi silny kandidat",
  "velmi silny kandidat",
  "silny prostor",
  "vyrazny prostor",
];

const CONTENT_SITE_PATTERNS = [
  "blog",
  "news",
  "magazine",
  "media",
  "forum",
  "community",
  "social",
  "wiki",
  "publisher",
  "content portal",
  "obsahovy web",
  "obsahovy portal",
  "komunitny web",
  "komunitni web",
  "spravodajsky web",
  "zpravodajsky web",
];

const MARKETPLACE_SITE_PATTERNS = [
  "marketplace",
  "classifieds",
  "rental",
  "booking",
  "reservation",
  "aggregator",
  "comparison",
  "listing portal",
  "katalog ponuk",
  "rezervacny",
  "rezervacni",
  "prenajom",
  "pronajem",
  "porovnavac",
  "porovnavaci",
];

const FINANCIAL_SITE_PATTERNS = [
  "finance",
  "financial",
  "financ",
  "insurance",
  "poist",
  "loan",
  "mortgage",
  "uver",
  "hypotek",
  "refinanc",
  "invest",
];

const SERVICE_SITE_PATTERNS = [
  "service",
  "agency",
  "consulting",
  "consultant",
  "landing page",
  "product landing",
  "saas",
  "software",
  "ai product",
  "solution",
  "sluzb",
  "agentur",
  "produktovy web",
  "produktovy landing",
];

const COMMERCE_SITE_PATTERNS = [
  "e-commerce",
  "eshop",
  "shop",
  "store",
  "catalog",
  "katalog",
  "directory",
  "listing site",
];

const SCORE_BANDS: Record<Exclude<SiteArchetype, "generic">, ScoreBand> = {
  content: { min: 2, max: 4, isGoodFit: false },
  commerce: { min: 6, max: 8, isGoodFit: true },
  financial: { min: 8, max: 9, isGoodFit: true },
  marketplace: { min: 8, max: 9, isGoodFit: true },
  service: { min: 8, max: 9, isGoodFit: true },
};

export function clampFitScore(score: number) {
  if (!Number.isFinite(score)) {
    return 1;
  }

  return Math.min(10, Math.max(1, Math.round(score)));
}

export function getFitLabelKeyFromScore(score: number): FitLabelKey {
  const normalizedScore = clampFitScore(score);

  if (normalizedScore <= 3) {
    return "low";
  }

  if (normalizedScore <= 5) {
    return "borderline";
  }

  if (normalizedScore <= 8) {
    return "good";
  }

  return "strong";
}

export function getFitLabelFromScore(score: number) {
  const labels = {
    low: "Slaby fit",
    borderline: "Hranicny fit",
    good: "Dobry fit",
    strong: "Velmi silny fit",
  } as const;

  return labels[getFitLabelKeyFromScore(score)];
}

export function getFitTierFromScore(score: number): FitTier {
  const normalizedScore = clampFitScore(score);

  if (normalizedScore >= 8) {
    return "HIGH-FIT";
  }

  if (normalizedScore >= 5) {
    return "MID-FIT";
  }

  return "LOW-FIT";
}

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function includesAnyPattern(text: string, patterns: string[]) {
  return patterns.some((pattern) => text.includes(pattern));
}

function detectFitSignal(text: string): FitSignal {
  const normalizedText = normalizeText(text);

  if (LOW_SIGNAL_PATTERNS.some((pattern) => normalizedText.includes(pattern))) {
    return "low";
  }

  if (MIXED_SIGNAL_PATTERNS.some((pattern) => normalizedText.includes(pattern))) {
    return "mixed";
  }

  if (HIGH_SIGNAL_PATTERNS.some((pattern) => normalizedText.includes(pattern))) {
    return "high";
  }

  return null;
}

function inferSiteArchetype(result: Pick<RawSiteAudit, "site_type" | "summary" | "why_fit">): SiteArchetype {
  const compositeText = normalizeText([result.site_type, result.summary, ...result.why_fit].join(" "));

  if (includesAnyPattern(compositeText, CONTENT_SITE_PATTERNS)) {
    return "content";
  }

  if (includesAnyPattern(compositeText, MARKETPLACE_SITE_PATTERNS)) {
    return "marketplace";
  }

  if (includesAnyPattern(compositeText, FINANCIAL_SITE_PATTERNS)) {
    return "financial";
  }

  if (includesAnyPattern(compositeText, SERVICE_SITE_PATTERNS)) {
    return "service";
  }

  if (includesAnyPattern(compositeText, COMMERCE_SITE_PATTERNS)) {
    return "commerce";
  }

  return "generic";
}

function getGenericScoreBand(result: Pick<RawSiteAudit, "is_good_fit">, narrativeSignal: FitSignal): ScoreBand {
  if (narrativeSignal === "low") {
    return { min: 3, max: 3, isGoodFit: false };
  }

  if (narrativeSignal === "high" || result.is_good_fit) {
    return { min: 6, max: 6, isGoodFit: true };
  }

  return { min: 5, max: 5, isGoodFit: false };
}

function getStableScoreSeed(value: string) {
  let hash = 0;

  for (const char of value) {
    hash = (hash * 31 + char.charCodeAt(0)) % 2_147_483_647;
  }

  return hash;
}

function getStableScoreFromBand(normalizedDomain: string | null, archetype: SiteArchetype, band: ScoreBand) {
  const bandSize = band.max - band.min + 1;

  if (bandSize <= 1) {
    return band.min;
  }

  if (!normalizedDomain) {
    return Math.round((band.min + band.max) / 2);
  }

  const seed = `${normalizedDomain}:${archetype}`;
  return band.min + (getStableScoreSeed(seed) % bandSize);
}

export function normalizeAuditScore(
  result: Pick<RawSiteAudit, "score" | "is_good_fit" | "site_type" | "summary" | "why_fit">,
  options: { inputUrl?: string } = {},
) {
  const normalizedDomain = options.inputUrl ? getNormalizedDomain(options.inputUrl) : null;
  const narrativeSignal = detectFitSignal([result.summary, ...result.why_fit].join(" "));
  const archetype = inferSiteArchetype(result);
  const band = archetype === "generic" ? getGenericScoreBand(result, narrativeSignal) : SCORE_BANDS[archetype];
  const score = clampFitScore(getStableScoreFromBand(normalizedDomain, archetype, band));

  return {
    score,
    isGoodFit: band.isGoodFit,
    fitTier: getFitTierFromScore(score),
    normalizedDomain,
    archetype,
  };
}

export function normalizeAuditResult(
  result: RawSiteAudit,
  options: { inputUrl?: string } = {},
): SiteAudit {
  const normalizedScore = normalizeAuditScore(result, options);

  return siteAuditSchema.parse({
    ...result,
    score: normalizedScore.score,
    is_good_fit: normalizedScore.isGoodFit,
  });
}
