import type { ContactRequestSubmission } from "@/lib/leads/contact-request";

const suspiciousSeoPhrases = [
  "searchregister",
  "googlesearchindex",
  "google search index",
  "rank better",
  "seo strategies",
  "target keywords",
  "traffic on search engines",
  "rocketdigitaltech",
] as const;

function normalizeText(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9\s.]/g, " ").replace(/\s+/g, " ").trim();
}

function countPhraseMatches(haystack: string) {
  return suspiciousSeoPhrases.reduce((count, phrase) => {
    return haystack.includes(phrase) ? count + 1 : count;
  }, 0);
}

export function hasFilledHoneypot(value: FormDataEntryValue | null) {
  return typeof value === "string" && value.trim().length > 0;
}

export function isLikelyContactRequestSpam(submission: ContactRequestSubmission) {
  const normalizedMessage = normalizeText(submission.message);
  const normalizedName = normalizeText(submission.name);
  const normalizedWebsite = normalizeText(submission.website);
  const combinedText = [normalizedMessage, normalizedName, normalizedWebsite].join(" ");
  const phraseMatches = countPhraseMatches(combinedText);
  const isGmailSender = submission.email.endsWith("@gmail.com");

  if (phraseMatches >= 3) {
    return true;
  }

  if (isGmailSender && phraseMatches >= 2) {
    return true;
  }

  return false;
}
