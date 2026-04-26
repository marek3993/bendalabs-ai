"use client";

import { useRef, useState } from "react";
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

type FieldErrors = Partial<Record<ContactRequestField, string>>;

const initialFormState: FormState = {
  name: "",
  email: "",
  website: "",
  message: "",
};

const fieldOrder = ["name", "email", "website", "message"] as const;

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
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState("");
  const fieldRefs = useRef<
    Partial<Record<keyof FormState, HTMLInputElement | HTMLTextAreaElement | null>>
  >({});

  const getMappedErrors = (errors: Partial<Record<ContactRequestField, string>>) => {
    const nextFieldErrors: FieldErrors = {};
    let nextSubmitError = "";

    for (const field of ["name", "email", "website", "message", "source"] as const) {
      const code = errors[field];

      if (!code) {
        continue;
      }

      const message = copy.validation[code as keyof typeof copy.validation] ?? code;

      if (field === "source") {
        nextSubmitError = message;
        continue;
      }

      nextFieldErrors[field] = message;
    }

    return { nextFieldErrors, nextSubmitError };
  };

  const logSubmitDebug = (reason: string, details?: unknown) => {
    console.info("[LeadCaptureForm]", reason, details);
  };

  const focusFirstFieldError = (errors: FieldErrors) => {
    const firstField = fieldOrder.find((field) => errors[field]);

    if (!firstField) {
      return;
    }

    fieldRefs.current[firstField]?.focus();
  };

  const applySubmitErrors = (
    nextFieldErrors: FieldErrors,
    nextSubmitError = "",
    debugReason?: string,
    debugDetails?: unknown,
  ) => {
    setStatus("error");
    setFieldErrors(nextFieldErrors);
    setSubmitError(nextSubmitError);
    focusFirstFieldError(nextFieldErrors);

    if (debugReason) {
      logSubmitDebug(debugReason, debugDetails);
    }
  };

  const parseResponsePayload = async (response: Response) => {
    const contentType = response.headers.get("content-type") ?? "";

    if (contentType.includes("application/json")) {
      return (await response.json()) as {
        error?: string;
        details?: string;
        fieldErrors?: Partial<Record<ContactRequestField, string>>;
      };
    }

    const text = await response.text();
    return { error: text || undefined };
  };

  const setFieldValue = (field: keyof FormState, value: string) => {
    setFormState((current) => ({
      ...current,
      [field]: value,
    }));

    setFieldErrors((current) => {
      if (!current[field]) {
        return current;
      }

      const next = { ...current };
      delete next[field];
      return next;
    });

    if (status === "error") {
      setStatus("idle");
      setSubmitError("");
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFieldErrors({});
    setSubmitError("");
    logSubmitDebug("onSubmit start", {
      status,
      source,
      variant,
      linkedAuditDomain,
      formState,
    });

    const submission = parseContactRequestSubmission({
      locale,
      source,
      linkedAuditDomain,
      ...formState,
    });

    if (!submission.success) {
      const { nextFieldErrors, nextSubmitError } = getMappedErrors(
        getContactRequestFieldErrors(submission.error),
      );
      applySubmitErrors(
        nextFieldErrors,
        nextSubmitError,
        "submit blocked by client validation",
        submission.error.flatten(),
      );
      return;
    }

    logSubmitDebug("client validation passed", submission.data);
    setStatus("submitting");

    try {
      logSubmitDebug("before fetch", {
        url: "/api/contact-requests",
        payload: submission.data,
      });
      const response = await fetch("/api/contact-requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submission.data),
      });
      const payload = await parseResponsePayload(response);
      logSubmitDebug("after fetch", {
        ok: response.ok,
        status: response.status,
        payload,
      });

      if (!response.ok) {
        const { nextFieldErrors, nextSubmitError } = getMappedErrors(payload.fieldErrors ?? {});
        const fallbackSubmitError =
          nextSubmitError || payload.error || payload.details || copy.genericErrorMessage;

        applySubmitErrors(
          nextFieldErrors,
          fallbackSubmitError,
          "submit rejected by backend",
          {
            status: response.status,
            payload,
          },
        );
        return;
      }

      setStatus("success");
      setFieldErrors({});
      setSubmitError("");
      setFormState({
        ...initialFormState,
        website: submission.data.website,
      });
      trackGoogleAdsConversion();
    } catch (requestError) {
      applySubmitErrors(
        {},
        requestError instanceof Error && requestError.message
          ? requestError.message
          : copy.genericErrorMessage,
        "submit request failed",
        requestError,
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
        <form noValidate onSubmit={handleSubmit} className="mt-6 grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2 text-sm text-neutral-700">
              <span>{copy.fields.name}</span>
              <input
                ref={(element) => {
                  fieldRefs.current.name = element;
                }}
                type="text"
                name="name"
                autoComplete="name"
                value={formState.name}
                onChange={(event) => setFieldValue("name", event.target.value)}
                aria-invalid={fieldErrors.name ? "true" : "false"}
                className="min-h-12 rounded-[18px] border border-black/10 bg-white px-4 text-neutral-950 outline-none focus:border-black/25 focus:shadow-[0_0_0_4px_rgba(17,17,17,0.05)]"
                placeholder={copy.placeholders.name}
              />
              {fieldErrors.name ? <span className="text-sm text-amber-900">{fieldErrors.name}</span> : null}
            </label>
            <label className="grid gap-2 text-sm text-neutral-700">
              <span>{copy.fields.email}</span>
              <input
                ref={(element) => {
                  fieldRefs.current.email = element;
                }}
                type="email"
                name="email"
                autoComplete="email"
                value={formState.email}
                onChange={(event) => setFieldValue("email", event.target.value)}
                aria-invalid={fieldErrors.email ? "true" : "false"}
                className="min-h-12 rounded-[18px] border border-black/10 bg-white px-4 text-neutral-950 outline-none focus:border-black/25 focus:shadow-[0_0_0_4px_rgba(17,17,17,0.05)]"
                placeholder={copy.placeholders.email}
              />
              {fieldErrors.email ? <span className="text-sm text-amber-900">{fieldErrors.email}</span> : null}
            </label>
          </div>

          <label className="grid gap-2 text-sm text-neutral-700">
            <span>{copy.fields.website}</span>
            <input
              ref={(element) => {
                fieldRefs.current.website = element;
              }}
              type="text"
              name="website"
              inputMode="url"
              autoComplete="url"
              value={formState.website}
              onChange={(event) => setFieldValue("website", event.target.value)}
              aria-invalid={fieldErrors.website ? "true" : "false"}
              className="min-h-12 rounded-[18px] border border-black/10 bg-white px-4 text-neutral-950 outline-none focus:border-black/25 focus:shadow-[0_0_0_4px_rgba(17,17,17,0.05)]"
              placeholder={copy.placeholders.website}
            />
            {fieldErrors.website ? (
              <span className="text-sm text-amber-900">{fieldErrors.website}</span>
            ) : null}
          </label>

          <label className="grid gap-2 text-sm text-neutral-700">
            <span>{copy.fields.message}</span>
            <textarea
              ref={(element) => {
                fieldRefs.current.message = element;
              }}
              name="message"
              rows={4}
              value={formState.message}
              onChange={(event) => setFieldValue("message", event.target.value)}
              aria-invalid={fieldErrors.message ? "true" : "false"}
              className="rounded-[18px] border border-black/10 bg-white px-4 py-3 text-neutral-950 outline-none focus:border-black/25 focus:shadow-[0_0_0_4px_rgba(17,17,17,0.05)]"
              placeholder={copy.placeholders.message}
            />
            {fieldErrors.message ? (
              <span className="text-sm text-amber-900">{fieldErrors.message}</span>
            ) : null}
          </label>

          {submitError ? (
            <div
              aria-live="polite"
              className="rounded-[18px] border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900"
            >
              {submitError}
            </div>
          ) : null}

          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="text-xs uppercase tracking-[0.18em] text-neutral-400">
              {copy.sourceLabels[source]}
            </div>
            <button
              type="submit"
              disabled={status === "submitting"}
              onClick={() =>
                logSubmitDebug("submit button clicked", {
                  status,
                  disabled: status === "submitting",
                })
              }
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
