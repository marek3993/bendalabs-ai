"use client";

import { useState } from "react";
import { getLeadFormCopy } from "@/lib/bendalabs/lead-form-content";
import {
  getContactRequestFieldErrors,
  parseContactRequestSubmission,
  type ContactRequestField,
} from "@/lib/leads/contact-request";
import { trackGoogleAdsConversion } from "@/lib/analytics/google-ads";
import type { ContactRequestSource } from "@/lib/leads/types";
import type { SiteLocale } from "@/lib/bendalabs/site-content";

type LeadCaptureFormProps = {
  locale: SiteLocale;
  source: ContactRequestSource;
  linkedAuditDomain?: string | null;
  initialWebsite?: string;
  variant: "audit" | "contact";
};

type SubmitStatus = "idle" | "submitting" | "success" | "error";

type FormState = {
  name: string;
  email: string;
  website: string;
  message: string;
};

const initialFormState: FormState = {
  name: "",
  email: "",
  website: "",
  message: "",
};

export default function LeadCaptureForm({
  locale,
  source,
  linkedAuditDomain = null,
  initialWebsite = "",
  variant,
}: LeadCaptureFormProps) {
  const copy = getLeadFormCopy(locale);
  const variantCopy = copy[variant];
  const [formState, setFormState] = useState<FormState>({
    ...initialFormState,
    website: initialWebsite,
  });
  const [status, setStatus] = useState<SubmitStatus>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const setFieldValue = (field: keyof FormState, value: string) => {
    setFormState((current) => ({
      ...current,
      [field]: value,
    }));

    if (status === "error") {
      setStatus("idle");
      setErrorMessage("");
    }
  };

  const getFieldErrorMessage = (field: ContactRequestField) => {
    if (field === "source") {
      return copy.validation.invalid_source;
    }

    return copy.fields[field];
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const submission = parseContactRequestSubmission({
      locale,
      source,
      linkedAuditDomain,
      ...formState,
    });

    if (!submission.success) {
      const fieldErrors = getContactRequestFieldErrors(submission.error);
      const firstField =
        (["name", "email", "website", "message", "source"] as const).find(
          (field) => fieldErrors[field],
        ) ?? "message";
      const fieldCode = fieldErrors[firstField];

      setStatus("error");
      setErrorMessage(fieldCode ? copy.validation[fieldCode] : getFieldErrorMessage(firstField));
      return;
    }

    setStatus("submitting");
    setErrorMessage("");

    try {
      const response = await fetch("/api/contact-requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submission.data),
      });
      const payload = (await response.json()) as {
        error?: string;
        fieldErrors?: Partial<Record<ContactRequestField, string>>;
      };

      if (!response.ok) {
        const firstField =
          (["name", "email", "website", "message", "source"] as const).find(
            (field) => payload.fieldErrors?.[field],
          ) ?? null;

        if (firstField) {
          const fieldCode = payload.fieldErrors?.[firstField];

          if (
            fieldCode === "invalid_name" ||
            fieldCode === "invalid_email" ||
            fieldCode === "invalid_website" ||
            fieldCode === "invalid_message" ||
            fieldCode === "invalid_source"
          ) {
            throw new Error(copy.validation[fieldCode]);
          }
        }

        throw new Error(payload.error || copy.genericErrorMessage);
      }

      setStatus("success");
      setFormState({
        ...initialFormState,
        website: submission.data.website,
      });
      trackGoogleAdsConversion();
    } catch (requestError) {
      setStatus("error");
      setErrorMessage(
        requestError instanceof Error && requestError.message
          ? requestError.message
          : copy.genericErrorMessage,
      );
    }
  };

  return (
    <div className="rounded-[28px] border border-black/10 bg-white/80 p-6 shadow-[0_16px_50px_rgba(17,17,17,0.05)] sm:p-7">
      <div className="text-[11px] uppercase tracking-[0.22em] text-neutral-500">{variantCopy.badge}</div>
      <h3 className="mt-4 text-2xl font-semibold tracking-[-0.04em] text-neutral-950">
        {variantCopy.title}
      </h3>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-neutral-600">{variantCopy.description}</p>

      {status === "success" ? (
        <div className="mt-6 rounded-[22px] border border-emerald-200 bg-emerald-50 px-5 py-4">
          <div className="text-sm font-medium text-emerald-950">{variantCopy.successTitle}</div>
          <div className="mt-1 text-sm leading-6 text-emerald-800">{variantCopy.successMessage}</div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2 text-sm text-neutral-700">
              <span>{copy.fields.name}</span>
              <input
                type="text"
                name="name"
                autoComplete="name"
                value={formState.name}
                onChange={(event) => setFieldValue("name", event.target.value)}
                className="min-h-12 rounded-[18px] border border-black/10 bg-white px-4 text-neutral-950 outline-none focus:border-black/25 focus:shadow-[0_0_0_4px_rgba(17,17,17,0.05)]"
                placeholder={copy.placeholders.name}
              />
            </label>
            <label className="grid gap-2 text-sm text-neutral-700">
              <span>{copy.fields.email}</span>
              <input
                type="email"
                name="email"
                autoComplete="email"
                value={formState.email}
                onChange={(event) => setFieldValue("email", event.target.value)}
                className="min-h-12 rounded-[18px] border border-black/10 bg-white px-4 text-neutral-950 outline-none focus:border-black/25 focus:shadow-[0_0_0_4px_rgba(17,17,17,0.05)]"
                placeholder={copy.placeholders.email}
              />
            </label>
          </div>

          <label className="grid gap-2 text-sm text-neutral-700">
            <span>{copy.fields.website}</span>
            <input
              type="text"
              name="website"
              inputMode="url"
              autoComplete="url"
              value={formState.website}
              onChange={(event) => setFieldValue("website", event.target.value)}
              className="min-h-12 rounded-[18px] border border-black/10 bg-white px-4 text-neutral-950 outline-none focus:border-black/25 focus:shadow-[0_0_0_4px_rgba(17,17,17,0.05)]"
              placeholder={copy.placeholders.website}
            />
          </label>

          <label className="grid gap-2 text-sm text-neutral-700">
            <span>{copy.fields.message}</span>
            <textarea
              name="message"
              rows={4}
              value={formState.message}
              onChange={(event) => setFieldValue("message", event.target.value)}
              className="rounded-[18px] border border-black/10 bg-white px-4 py-3 text-neutral-950 outline-none focus:border-black/25 focus:shadow-[0_0_0_4px_rgba(17,17,17,0.05)]"
              placeholder={copy.placeholders.message}
            />
          </label>

          {status === "error" ? (
            <div className="rounded-[18px] border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              {errorMessage}
            </div>
          ) : null}

          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="text-xs uppercase tracking-[0.18em] text-neutral-400">
              {copy.sourceLabels[source]}
            </div>
            <button
              type="submit"
              disabled={status === "submitting"}
              className="rounded-[18px] border border-black bg-black px-5 py-3 text-sm font-medium text-white hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {status === "submitting" ? variantCopy.submittingLabel : variantCopy.submitLabel}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
