import { siteAuditSchema, type RawSiteAudit, type SiteAudit } from "./schema";

export type FitLabel = "Slaby fit" | "Hranicny fit" | "Dobry fit" | "Velmi silny fit";

type FitSignal = "low" | "mixed" | "high" | null;

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
];

const MIXED_SIGNAL_PATTERNS = [
  "hranicny fit",
  "zmiesany fit",
  "mixed fit",
  "ciastocny fit",
  "s rezervou",
  "na vybranych miestach",
];

const HIGH_SIGNAL_PATTERNS = [
  "velmi silny fit",
  "silny fit",
  "dobry fit",
  "vysoky potencial",
  "silny priestor",
  "vyrazny priestor",
];

export function clampFitScore(score: number) {
  if (!Number.isFinite(score)) {
    return 1;
  }

  return Math.min(10, Math.max(1, Math.round(score)));
}

export function getFitLabelFromScore(score: number): FitLabel {
  const normalizedScore = clampFitScore(score);

  if (normalizedScore <= 3) {
    return "Slaby fit";
  }

  if (normalizedScore <= 5) {
    return "Hranicny fit";
  }

  if (normalizedScore <= 8) {
    return "Dobry fit";
  }

  return "Velmi silny fit";
}

function detectFitSignal(text: string): FitSignal {
  const normalizedText = text.toLowerCase();

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

export function normalizeAuditResult(result: RawSiteAudit): SiteAudit {
  let score = clampFitScore(result.score);
  let isGoodFit = result.is_good_fit;

  const narrativeSignal = detectFitSignal([result.summary, ...result.why_fit].join(" "));

  if (narrativeSignal === "low") {
    isGoodFit = false;
    score = Math.min(score, 3);
  }

  if (narrativeSignal === "high") {
    isGoodFit = true;
    score = Math.max(score, 6);
  }

  if (narrativeSignal === "mixed") {
    if (isGoodFit) {
      score = Math.min(score, 6);
    } else {
      score = Math.max(score, 4);
    }
  }

  if (!isGoodFit) {
    score = Math.min(score, 4);
  }

  if (isGoodFit) {
    score = Math.max(score, 6);
  }

  return siteAuditSchema.parse({
    ...result,
    score,
    is_good_fit: isGoodFit,
  });
}
