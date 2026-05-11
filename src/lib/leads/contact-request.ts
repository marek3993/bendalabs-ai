import { z } from "zod";
import type { SiteLocale } from "@/lib/bendalabs/site-content";
import { getNormalizedDomainFromUrl } from "@/lib/leads/domain-utils";
import type { ContactRequestInsert, ContactRequestSource } from "@/lib/leads/types";
import { normalizeWebsiteUrl } from "@/lib/site-audit/url";

export type ContactRequestField = "name" | "email" | "website" | "message" | "source";
export type ContactRequestErrorCode =
  | "required_name"
  | "invalid_name"
  | "required_email"
  | "invalid_email"
  | "required_website"
  | "invalid_website"
  | "required_message"
  | "invalid_message"
  | "invalid_source";

export type ContactRequestSubmission = Omit<ContactRequestInsert, "userAgent" | "referrer"> & {
  locale: SiteLocale;
};

export type ContactRequestFieldErrors = Partial<Record<ContactRequestField, ContactRequestErrorCode>>;

const contactRequestSourceValues = [
  "audit_result",
  "contact_section",
  "ai_navrh_na_mieru",
] as const satisfies readonly ContactRequestSource[];
const localeValues = ["sk", "cs"] as const satisfies readonly SiteLocale[];
const requestTypeValues = ["call_request", "proposal_request"] as const;

function normalizeLocale(input: unknown): SiteLocale {
  return localeValues.includes(input as SiteLocale) ? (input as SiteLocale) : "sk";
}

function normalizeAuditDomainValue(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return null;
  }

  const normalizedUrl = normalizeWebsiteUrl(trimmedValue);

  if (!normalizedUrl) {
    return null;
  }

  return getNormalizedDomainFromUrl(normalizedUrl);
}

function normalizeWebsiteValue(value: string, context: z.RefinementCtx) {
  const normalizedValue = normalizeWebsiteUrl(value);

  if (!normalizedValue) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["website"],
      message: "invalid_website",
    });

    return z.NEVER;
  }

  return normalizedValue;
}

const contactRequestSchema = z
  .object({
    locale: z.unknown().optional(),
    name: z
      .string()
      .trim()
      .min(1, "required_name")
      .max(120, "invalid_name"),
    email: z
      .string()
      .trim()
      .min(1, "required_email")
      .email("invalid_email")
      .max(180, "invalid_email")
      .transform((value) => value.toLowerCase()),
    website: z
      .string()
      .trim()
      .min(1, "required_website")
      .transform(normalizeWebsiteValue),
    message: z
      .string()
      .trim()
      .min(1, "required_message")
      .min(10, "invalid_message")
      .max(4000, "invalid_message"),
    source: z
      .string()
      .trim()
      .refine(
        (value): value is ContactRequestSource =>
          contactRequestSourceValues.includes(value as ContactRequestSource),
        "invalid_source",
      ),
    requestType: z.enum(requestTypeValues).optional(),
    linkedAuditDomain: z.unknown().optional(),
  })
  .transform((value): ContactRequestSubmission => {
    const normalizedDomain = getNormalizedDomainFromUrl(value.website);

    if (!normalizedDomain) {
      throw new Error("Contact request schema accepted invalid website normalization.");
    }

    return {
      locale: normalizeLocale(value.locale),
      name: value.name,
      email: value.email,
      website: value.website,
      message: value.requestType ? `request_type: ${value.requestType}\n\n${value.message}` : value.message,
      source: value.source,
      normalizedDomain,
      linkedAuditDomain: normalizeAuditDomainValue(value.linkedAuditDomain),
    };
  });

export function parseContactRequestSubmission(value: unknown) {
  return contactRequestSchema.safeParse(value);
}

export function getContactRequestFieldErrors(error: z.ZodError<unknown>): ContactRequestFieldErrors {
  const fieldErrors: ContactRequestFieldErrors = {};

  for (const issue of error.issues) {
    const field = issue.path[0];

    if (
      (field === "name" ||
        field === "email" ||
        field === "website" ||
        field === "message" ||
        field === "source") &&
      !fieldErrors[field]
    ) {
      fieldErrors[field] = issue.message as ContactRequestErrorCode;
    }
  }

  return fieldErrors;
}
