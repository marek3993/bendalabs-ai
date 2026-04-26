import { z } from "zod";
import type { SiteLocale } from "@/lib/bendalabs/site-content";
import { getNormalizedDomainFromUrl } from "@/lib/leads/domain-utils";
import type { ContactRequestInsert, ContactRequestSource } from "@/lib/leads/types";
import { normalizeWebsiteUrl } from "@/lib/site-audit/url";

export type ContactRequestField = "name" | "email" | "website" | "message" | "source";
export type ContactRequestErrorCode =
  | "invalid_name"
  | "invalid_email"
  | "invalid_website"
  | "invalid_message"
  | "invalid_source";

export type ContactRequestSubmission = Omit<ContactRequestInsert, "userAgent" | "referrer"> & {
  locale: SiteLocale;
};

const contactRequestSourceValues = ["audit_result", "contact_section"] as const satisfies readonly ContactRequestSource[];
const localeValues = ["sk", "cs"] as const satisfies readonly SiteLocale[];

function normalizeAuditDomainValue(value: string | undefined) {
  const trimmedValue = value?.trim();

  if (!trimmedValue) {
    return null;
  }

  const normalizedUrl = normalizeWebsiteUrl(trimmedValue);

  if (!normalizedUrl) {
    return null;
  }

  return getNormalizedDomainFromUrl(normalizedUrl);
}

const contactRequestSchema = z
  .object({
    locale: z.string().optional(),
    name: z
      .string()
      .trim()
      .min(2, "invalid_name")
      .max(120, "invalid_name"),
    email: z
      .string()
      .trim()
      .min(1, "invalid_email")
      .email("invalid_email")
      .max(180, "invalid_email"),
    website: z
      .string()
      .trim()
      .min(1, "invalid_website")
      .refine((value) => Boolean(normalizeWebsiteUrl(value)), "invalid_website")
      .transform((value) => normalizeWebsiteUrl(value) as string),
    message: z
      .string()
      .trim()
      .min(10, "invalid_message")
      .max(4000, "invalid_message"),
    source: z.string().trim(),
    linkedAuditDomain: z.string().optional(),
  })
  .superRefine((value, context) => {
    if (!contactRequestSourceValues.includes(value.source as ContactRequestSource)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["source"],
        message: "invalid_source",
      });
    }
  })
  .transform((value): ContactRequestSubmission => {
    const locale = localeValues.includes(value.locale as SiteLocale)
      ? (value.locale as SiteLocale)
      : "sk";
    const normalizedDomain = getNormalizedDomainFromUrl(value.website);

    if (!normalizedDomain) {
      throw new Error("Contact request schema accepted invalid website normalization.");
    }

    return {
      locale,
      name: value.name,
      email: value.email.toLowerCase(),
      website: value.website,
      message: value.message,
      source: value.source as ContactRequestSource,
      normalizedDomain,
      linkedAuditDomain: normalizeAuditDomainValue(value.linkedAuditDomain),
    };
  });

export function parseContactRequestSubmission(value: unknown) {
  return contactRequestSchema.safeParse(value);
}

export function getContactRequestFieldErrors(error: z.ZodError<unknown>) {
  const fieldErrors: Partial<Record<ContactRequestField, ContactRequestErrorCode>> = {};

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
