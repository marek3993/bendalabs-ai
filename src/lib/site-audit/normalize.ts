import { siteAuditSchema, type RawSiteAudit, type SiteAudit } from "./schema";

export type FitLabelKey = "low" | "borderline" | "good" | "strong";

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
