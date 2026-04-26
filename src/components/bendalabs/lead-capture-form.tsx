"use client";

import { usePathname } from "next/navigation";
import { getLeadFormCopy } from "@/lib/bendalabs/lead-form-content";
import type { SiteLocale } from "@/lib/bendalabs/site-content";
import type { ContactRequestSource } from "@/lib/leads/types";

type LeadCaptureFormProps = {
  locale: SiteLocale;
  source: ContactRequestSource;
  linkedAuditDomain?: string | null;
  initialWebsite?: string;
  variant: "audit" | "contact";
};

function getSuccessPath(locale: SiteLocale) {
  return locale === "cs" ? "/cs/dekujeme" : "/dakujem";
}

function getErrorPath(locale: SiteLocale) {
  return locale === "cs" ? "/cs/odeslani-selhalo" : "/odoslanie-zlyhalo";
}

export default function LeadCaptureForm({
  locale,
  source,
  linkedAuditDomain = null,
  initialWebsite = "",
  variant,
}: LeadCaptureFormProps) {
  const pathname = usePathname() || (locale === "cs" ? "/cs" : "/");
  const copy = getLeadFormCopy(locale);
  const variantCopy = copy[variant];

  return (
    <div className="rounded-[28px] border border-black/10 bg-white/80 p-6 shadow-[0_16px_50px_rgba(17,17,17,0.05)] sm:p-7">
      <div className="text-[11px] uppercase tracking-[0.22em] text-neutral-500">{variantCopy.badge}</div>
      <h3 className="mt-4 text-2xl font-semibold tracking-[-0.04em] text-neutral-950">
        {variantCopy.title}
      </h3>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-neutral-600">{variantCopy.description}</p>

      <form action="/api/contact-requests" method="post" className="mt-6 grid gap-4">
        <input type="hidden" name="locale" value={locale} />
        <input type="hidden" name="source" value={source} />
        <input type="hidden" name="returnPath" value={pathname} />
        <input type="hidden" name="successPath" value={getSuccessPath(locale)} />
        <input type="hidden" name="errorPath" value={getErrorPath(locale)} />
        <input type="hidden" name="linkedAuditDomain" value={linkedAuditDomain ?? ""} />

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2 text-sm text-neutral-700">
            <span>{copy.fields.name}</span>
            <input
              type="text"
              name="name"
              autoComplete="name"
              required
              maxLength={120}
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
              required
              maxLength={180}
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
            required
            defaultValue={initialWebsite}
            className="min-h-12 rounded-[18px] border border-black/10 bg-white px-4 text-neutral-950 outline-none focus:border-black/25 focus:shadow-[0_0_0_4px_rgba(17,17,17,0.05)]"
            placeholder={copy.placeholders.website}
          />
        </label>

        <label className="grid gap-2 text-sm text-neutral-700">
          <span>{copy.fields.message}</span>
          <textarea
            name="message"
            rows={4}
            required
            minLength={10}
            maxLength={4000}
            className="rounded-[18px] border border-black/10 bg-white px-4 py-3 text-neutral-950 outline-none focus:border-black/25 focus:shadow-[0_0_0_4px_rgba(17,17,17,0.05)]"
            placeholder={copy.placeholders.message}
          />
        </label>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="text-xs uppercase tracking-[0.18em] text-neutral-400">
            {copy.sourceLabels[source]}
          </div>
          <button
            type="submit"
            className="rounded-[18px] border border-black bg-black px-5 py-3 text-sm font-medium text-white hover:bg-neutral-800"
          >
            {variantCopy.submitLabel}
          </button>
        </div>
      </form>
    </div>
  );
}
