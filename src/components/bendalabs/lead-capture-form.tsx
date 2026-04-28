"use client";

import { usePathname } from "next/navigation";
import { trackGoogleAdsConversion } from "@/lib/analytics/google-ads";
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
  const isContactVariant = variant === "contact";

  function handleSubmit() {
    trackGoogleAdsConversion();
  }

  return (
    <div
      className={`rounded-[30px] border p-6 shadow-[0_16px_50px_rgba(17,17,17,0.05)] sm:p-7 ${
        isContactVariant
          ? "border-[#8fb6a8]/55 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(243,250,246,0.96))] shadow-[0_24px_64px_rgba(80,118,103,0.12)]"
          : "border-black/10 bg-white/80"
      }`}
    >
      <div
        className={`text-[11px] uppercase tracking-[0.22em] ${
          isContactVariant
            ? "inline-flex items-center rounded-full border border-[#8fb6a8]/45 bg-[#eef7f2] px-3 py-1.5 font-semibold text-[#355648]"
            : "text-neutral-500"
        }`}
      >
        {variantCopy.badge}
      </div>
      <h3 className="mt-4 text-2xl font-semibold tracking-[-0.04em] text-neutral-950">
        {variantCopy.title}
      </h3>
      <p className={`mt-3 max-w-2xl text-sm leading-6 ${isContactVariant ? "text-neutral-700" : "text-neutral-600"}`}>
        {variantCopy.description}
      </p>

      <form
        action="/api/contact-requests"
        method="post"
        onSubmit={handleSubmit}
        className="mt-6 grid gap-4"
      >
        <input type="hidden" name="locale" value={locale} />
        <input type="hidden" name="source" value={source} />
        <input type="hidden" name="returnPath" value={pathname} />
        <input type="hidden" name="successPath" value={getSuccessPath(locale)} />
        <input type="hidden" name="errorPath" value={getErrorPath(locale)} />
        <input type="hidden" name="linkedAuditDomain" value={linkedAuditDomain ?? ""} />
        <input type="text" name="company" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2 text-sm text-neutral-700">
            <span>{copy.fields.name}</span>
            <input
              type="text"
              name="name"
              autoComplete="name"
              required
              maxLength={120}
              className={`min-h-12 rounded-[18px] bg-white px-4 text-neutral-950 outline-none ${
                isContactVariant
                  ? "border border-[#b7d2c5] shadow-[0_8px_24px_rgba(80,118,103,0.06)] focus:border-[#6c9a86] focus:shadow-[0_0_0_4px_rgba(143,182,168,0.16)]"
                  : "border border-black/10 focus:border-black/25 focus:shadow-[0_0_0_4px_rgba(17,17,17,0.05)]"
              }`}
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
              className={`min-h-12 rounded-[18px] bg-white px-4 text-neutral-950 outline-none ${
                isContactVariant
                  ? "border border-[#b7d2c5] shadow-[0_8px_24px_rgba(80,118,103,0.06)] focus:border-[#6c9a86] focus:shadow-[0_0_0_4px_rgba(143,182,168,0.16)]"
                  : "border border-black/10 focus:border-black/25 focus:shadow-[0_0_0_4px_rgba(17,17,17,0.05)]"
              }`}
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
            className={`min-h-12 rounded-[18px] bg-white px-4 text-neutral-950 outline-none ${
              isContactVariant
                ? "border border-[#b7d2c5] shadow-[0_8px_24px_rgba(80,118,103,0.06)] focus:border-[#6c9a86] focus:shadow-[0_0_0_4px_rgba(143,182,168,0.16)]"
                : "border border-black/10 focus:border-black/25 focus:shadow-[0_0_0_4px_rgba(17,17,17,0.05)]"
            }`}
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
            className={`rounded-[18px] bg-white px-4 py-3 text-neutral-950 outline-none ${
              isContactVariant
                ? "border border-[#b7d2c5] shadow-[0_8px_24px_rgba(80,118,103,0.06)] focus:border-[#6c9a86] focus:shadow-[0_0_0_4px_rgba(143,182,168,0.16)]"
                : "border border-black/10 focus:border-black/25 focus:shadow-[0_0_0_4px_rgba(17,17,17,0.05)]"
            }`}
            placeholder={copy.placeholders.message}
          />
        </label>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className={`text-xs uppercase tracking-[0.18em] ${isContactVariant ? "text-[#5d7c6f]" : "text-neutral-400"}`}>
            {copy.sourceLabels[source]}
          </div>
          <button
            type="submit"
            className={`rounded-[20px] px-6 py-3.5 text-sm font-semibold transition-all ${
              isContactVariant
                ? "border border-[#46a06f] bg-[linear-gradient(180deg,#2f9a68_0%,#267c55_100%)] text-white shadow-[0_18px_34px_rgba(23,85,58,0.24),0_0_0_1px_rgba(191,242,214,0.08)_inset] hover:-translate-y-0.5 hover:bg-[linear-gradient(180deg,#39ab75_0%,#2b8b5e_100%)] hover:shadow-[0_22px_38px_rgba(23,85,58,0.28),0_0_0_1px_rgba(216,247,229,0.14)_inset]"
                : "border border-black bg-black text-white hover:bg-neutral-800"
            }`}
          >
            {variantCopy.submitLabel}
          </button>
        </div>
      </form>
    </div>
  );
}
