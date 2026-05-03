"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { trackGoogleAdsConversion } from "@/lib/analytics/google-ads";
import { getLeadFormCopy } from "@/lib/bendalabs/lead-form-content";
import type { SiteLocale } from "@/lib/bendalabs/site-content";
import type { ContactRequestSource } from "@/lib/leads/types";

const CALL_REQUEST_FALLBACK_EMAIL = "no-email-call@bendalabs.invalid";

type LeadCaptureFormProps = {
  locale: SiteLocale;
  source: ContactRequestSource;
  linkedAuditDomain?: string | null;
  initialWebsite?: string;
  variant: "audit" | "contact" | "call";
};

function getSuccessPath(locale: SiteLocale) {
  return locale === "cs" ? "/cs/dekujeme" : "/dakujem";
}

function getErrorPath(locale: SiteLocale) {
  return locale === "cs" ? "/cs/odeslani-selhalo" : "/odoslanie-zlyhalo";
}

function buildCallRequestMessage({
  locale,
  phone,
  preferredTime,
  email,
  website,
  note,
}: {
  locale: SiteLocale;
  phone: string;
  preferredTime: string;
  email: string;
  website: string;
  note: string;
}) {
  const emptyEmail = locale === "cs" ? "nezadany" : "nezadany";
  const emptyNote = locale === "cs" ? "bez poznamky" : "bez poznamky";

  return [
    locale === "cs" ? "Typ pozadavku: kratky call" : "Typ poziadavky: kratky call",
    `${locale === "cs" ? "Telefon" : "Telefon"}: ${phone.trim()}`,
    `${locale === "cs" ? "Preferovany cas" : "Preferovany cas"}: ${preferredTime.trim()}`,
    `${locale === "cs" ? "Email" : "Email"}: ${email.trim() || emptyEmail}`,
    `${locale === "cs" ? "Web" : "Web"}: ${website.trim() || "-"}`,
    `${locale === "cs" ? "Poznamka" : "Poznamka"}: ${note.trim() || emptyNote}`,
  ].join("\n");
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
  const isCallVariant = variant === "call";
  const isAuditProposalVariant = variant === "audit";
  const [callEmail, setCallEmail] = useState("");
  const [callPhone, setCallPhone] = useState("");
  const [callPreferredTime, setCallPreferredTime] = useState("");
  const [callNote, setCallNote] = useState("");

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

      {isCallVariant && initialWebsite ? (
        <div className="mt-4 rounded-[18px] border border-black/8 bg-black/[0.03] px-4 py-3 text-sm text-neutral-700">
          <div className="text-[11px] uppercase tracking-[0.18em] text-neutral-500">{copy.callFields.website}</div>
          <div className="mt-1 font-medium text-neutral-950">{initialWebsite}</div>
        </div>
      ) : null}

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

        {isCallVariant ? (
          <>
            <input type="hidden" name="requestType" value="call_request" />
            <input type="hidden" name="website" value={initialWebsite} />
            <input type="hidden" name="email" value={callEmail.trim() || CALL_REQUEST_FALLBACK_EMAIL} />
            <input
              type="hidden"
              name="message"
              value={buildCallRequestMessage({
                locale,
                phone: callPhone,
                preferredTime: callPreferredTime,
                email: callEmail,
                website: initialWebsite,
                note: callNote,
              })}
            />

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
                <span>{copy.callFields.phone}</span>
                <input
                  type="tel"
                  name="callPhone"
                  autoComplete="tel"
                  required
                  maxLength={80}
                  value={callPhone}
                  onChange={(event) => setCallPhone(event.target.value)}
                  className="min-h-12 rounded-[18px] border border-black/10 bg-white px-4 text-neutral-950 outline-none focus:border-black/25 focus:shadow-[0_0_0_4px_rgba(17,17,17,0.05)]"
                  placeholder={copy.placeholders.phone}
                />
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 text-sm text-neutral-700">
                <span>{copy.callFields.preferredTime}</span>
                <input
                  type="text"
                  name="callPreferredTime"
                  required
                  maxLength={160}
                  value={callPreferredTime}
                  onChange={(event) => setCallPreferredTime(event.target.value)}
                  className="min-h-12 rounded-[18px] border border-black/10 bg-white px-4 text-neutral-950 outline-none focus:border-black/25 focus:shadow-[0_0_0_4px_rgba(17,17,17,0.05)]"
                  placeholder={copy.placeholders.preferredTime}
                />
              </label>

              <label className="grid gap-2 text-sm text-neutral-700">
                <span>{copy.callFields.emailOptional}</span>
                <input
                  type="email"
                  name="callEmail"
                  autoComplete="email"
                  maxLength={180}
                  value={callEmail}
                  onChange={(event) => setCallEmail(event.target.value)}
                  className="min-h-12 rounded-[18px] border border-black/10 bg-white px-4 text-neutral-950 outline-none focus:border-black/25 focus:shadow-[0_0_0_4px_rgba(17,17,17,0.05)]"
                  placeholder={copy.placeholders.email}
                />
              </label>
            </div>

            {!initialWebsite ? (
              <label className="grid gap-2 text-sm text-neutral-700">
                <span>{copy.callFields.websiteFallback}</span>
                <input
                  type="text"
                  name="website"
                  inputMode="url"
                  autoComplete="url"
                  required
                  className="min-h-12 rounded-[18px] border border-black/10 bg-white px-4 text-neutral-950 outline-none focus:border-black/25 focus:shadow-[0_0_0_4px_rgba(17,17,17,0.05)]"
                  placeholder={copy.placeholders.website}
                />
              </label>
            ) : null}

            <label className="grid gap-2 text-sm text-neutral-700">
              <span>{copy.callFields.note}</span>
              <textarea
                name="callNote"
                rows={4}
                maxLength={1200}
                value={callNote}
                onChange={(event) => setCallNote(event.target.value)}
                className="rounded-[18px] border border-black/10 bg-white px-4 py-3 text-neutral-950 outline-none focus:border-black/25 focus:shadow-[0_0_0_4px_rgba(17,17,17,0.05)]"
                placeholder={copy.placeholders.note}
              />
            </label>
          </>
        ) : (
          <>
            {isAuditProposalVariant ? <input type="hidden" name="requestType" value="proposal_request" /> : null}

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
          </>
        )}

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
