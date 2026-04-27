"use client";

import { startTransition, useEffect, useMemo, useState } from "react";
import LeadCaptureForm from "@/components/bendalabs/lead-capture-form";
import { getAuditBotCopy, type SiteLocale } from "@/lib/bendalabs/site-content";
import { getNormalizedDomainFromUrl } from "@/lib/leads/domain-utils";
import {
  getGenericAuditErrorMessage,
  type AuditErrorSuggestion,
} from "@/lib/site-audit/error";
import { getFitLabelKeyFromScore } from "@/lib/site-audit/normalize";
import type { SiteAudit } from "@/lib/site-audit/schema";
import { normalizeWebsiteUrl } from "@/lib/site-audit/url";

type AuditBotProps = {
  locale?: SiteLocale;
  variant?: "default" | "featured";
  badge?: string;
  title?: string;
  subtext?: string;
  description?: string;
  benefits?: ReadonlyArray<string>;
  trustItems?: ReadonlyArray<string>;
  explainerLine?: string;
  previewIdleTitle?: string;
  previewIdleSteps?: ReadonlyArray<string>;
  placeholder?: string;
  submitLabel?: string;
  loadingLabel?: string;
  loadingSteps?: ReadonlyArray<string>;
  proposalTitle?: string;
  proposalDescription?: string;
  proposalButtonLabel?: string;
};

type Status = "idle" | "loading" | "success" | "error";

type AuditApiResponse = {
  audit?: SiteAudit;
  error?: string;
  suggestion?: AuditErrorSuggestion | null;
};

function ResultList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item} className="flex gap-3 text-sm leading-6 text-neutral-700">
          <span className="mt-2 h-1.5 w-1.5 rounded-full bg-neutral-900" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function ResultCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[28px] border border-black/8 bg-white/78 p-6 shadow-[0_16px_50px_rgba(17,17,17,0.05)]">
      <div className="text-[11px] uppercase tracking-[0.24em] text-neutral-500">{title}</div>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function renderFeaturedSubmitLabel(label: string) {
  const arrow = "\u2192";
  const trimmed = label.trim();

  if (!trimmed.endsWith(arrow)) {
    return label;
  }

  const text = trimmed.slice(0, -arrow.length).trimEnd();

  return (
    <>
      <span>{text}</span>
      <span className="transition-transform duration-200 group-hover:translate-x-1">{arrow}</span>
    </>
  );
}

function AuditPreviewPanel({
  locale,
  idleTitle,
  idleSteps,
  steps,
  activeIndex,
  status,
}: {
  locale: SiteLocale;
  idleTitle?: string;
  idleSteps?: ReadonlyArray<string>;
  steps: ReadonlyArray<string>;
  activeIndex: number;
  status: Status;
}) {
  const isIdle = status === "idle";
  const safeIndex = Math.max(0, Math.min(activeIndex, Math.max(steps.length - 1, 0)));
  const displaySteps = isIdle ? idleSteps ?? steps : steps;
  const progress = steps.length > 0 ? `${Math.max(14, ((safeIndex + 1) / steps.length) * 100)}%` : "14%";
  const panelLabel = isIdle
    ? locale === "sk"
      ? "PRIPRAVENE NA AUDIT"
      : "PRIPRAVENO NA AUDIT"
    : locale === "sk"
      ? "Audit pr\u00e1ve be\u017e\u00ed"
      : "Audit pr\u00e1v\u011b b\u011b\u017e\u00ed";
  const currentStep = isIdle
    ? idleTitle ?? (locale === "sk" ? "Zadajte URL a spustite audit" : "Zadejte URL a spus\u0165te audit")
    : steps[safeIndex] ?? "";
  const progressLabel = isIdle ? null : steps.length > 0 ? `${safeIndex + 1}/${steps.length}` : null;

  return (
    <div className="relative overflow-hidden rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(11,20,18,0.96),rgba(15,29,25,0.9))] p-5 text-white shadow-[0_28px_60px_rgba(3,10,8,0.35)] sm:p-6">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(104,165,134,0.22),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(88,138,115,0.2),transparent_30%)]" />
        <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      </div>

      <div className="relative z-10">
        <div className="flex items-center justify-between gap-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-emerald-50/78">
            <span className="relative flex h-2.5 w-2.5">
              {!isIdle ? (
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#9be3be]/45" />
              ) : null}
              <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${isIdle ? "bg-white/60" : "bg-[#9be3be]"}`} />
            </span>
            {panelLabel}
          </div>
          {progressLabel ? <div className="text-xs font-medium text-emerald-50/56">{progressLabel}</div> : null}
        </div>

        {!isIdle ? (
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-black/25">
            <div
              className="h-full rounded-full bg-[linear-gradient(90deg,#7fd6ad_0%,#cbeed9_100%)] shadow-[0_0_22px_rgba(127,214,173,0.35)] transition-[width] duration-700"
              style={{ width: progress }}
            />
          </div>
        ) : null}

        <div className="mt-5 text-[11px] uppercase tracking-[0.22em] text-emerald-50/48">
          {isIdle
            ? locale === "sk"
              ? "Co audit spravi"
              : "Co audit udela"
            : locale === "sk"
              ? "Akt\u00edvny krok"
              : "Aktivn\u00ed krok"}
        </div>
        <div className="mt-2 text-xl font-semibold tracking-[-0.03em] text-white sm:text-2xl">
          {currentStep}
        </div>

        <div className="mt-5 space-y-3">
          {displaySteps.map((step, index) => {
            const stepState = isIdle
              ? "pending"
              : index < safeIndex
                ? "complete"
                : index === safeIndex
                  ? "active"
                  : "pending";

            return (
              <div
                key={step}
                className={`flex items-center gap-3 rounded-[18px] border px-4 py-3 text-sm transition-colors ${
                  stepState === "complete"
                    ? "border-[#8bc8a7]/32 bg-[#8bc8a7]/10 text-white"
                    : stepState === "active"
                      ? "border-[#b7e7cc]/40 bg-white/8 text-white shadow-[0_0_0_1px_rgba(183,231,204,0.06)]"
                      : "border-white/8 bg-black/12 text-emerald-50/52"
                }`}
              >
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-semibold ${
                    stepState === "complete"
                      ? "bg-[#9be3be] text-[#0d1d18]"
                      : stepState === "active"
                        ? "border border-[#9be3be]/60 bg-[#9be3be]/12 text-[#dff7e8]"
                        : "border border-white/14 bg-transparent text-emerald-50/48"
                  }`}
                >
                  {stepState === "complete" ? (
                    <span className="h-2 w-2 rounded-full bg-[#0d1d18]" />
                  ) : stepState === "active" ? (
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#dff7e8]/70" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-[#dff7e8]" />
                    </span>
                  ) : null}
                </span>
                <span>{step}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function AuditBot({
  locale = "sk",
  variant = "default",
  badge,
  title,
  subtext,
  description,
  benefits,
  trustItems,
  explainerLine,
  previewIdleTitle,
  previewIdleSteps,
  placeholder,
  submitLabel,
  loadingLabel,
  loadingSteps,
  proposalTitle,
  proposalDescription,
  proposalButtonLabel,
}: AuditBotProps) {
  const defaults = getAuditBotCopy(locale);
  const isFeatured = variant === "featured";
  const copy = useMemo(
    () => ({
      ...defaults,
      badge: badge ?? defaults.badge,
      title: title ?? defaults.title,
      subtext: subtext ?? defaults.subtext,
      description: description ?? defaults.description,
      placeholder: placeholder ?? defaults.placeholder,
      submitLabel: submitLabel ?? defaults.submitLabel,
      loadingLabel: loadingLabel ?? defaults.loadingLabel,
      loadingSteps: loadingSteps ?? defaults.loadingSteps,
      proposalTitle: proposalTitle ?? defaults.proposalTitle,
      proposalDescription: proposalDescription ?? defaults.proposalDescription,
      proposalButtonLabel: proposalButtonLabel ?? defaults.proposalButtonLabel,
    }),
    [
      badge,
      defaults,
      description,
      loadingLabel,
      loadingSteps,
      placeholder,
      subtext,
      proposalButtonLabel,
      proposalDescription,
      proposalTitle,
      submitLabel,
      title,
    ],
  );
  const featuredBenefits = benefits ?? [];
  const featuredExplainer = explainerLine ?? "";
  const previewSteps = copy.loadingSteps.length > 0 ? copy.loadingSteps : defaults.loadingSteps;
  const previewIdleStepsResolved = previewIdleSteps ?? [];

  const [url, setUrl] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const [errorSuggestion, setErrorSuggestion] = useState<AuditErrorSuggestion | null>(null);
  const [audit, setAudit] = useState<SiteAudit | null>(null);
  const [loadingIndex, setLoadingIndex] = useState(0);
  const [auditedUrl, setAuditedUrl] = useState("");
  const [showProposalForm, setShowProposalForm] = useState(false);
  const fitLabel = audit ? copy.fitLabels[getFitLabelKeyFromScore(audit.score)] : null;
  const linkedAuditDomain = auditedUrl ? getNormalizedDomainFromUrl(auditedUrl) : null;
  const previewActiveIndex =
    previewSteps.length > 1
      ? status === "loading"
        ? Math.min(loadingIndex, previewSteps.length - 1)
        : status === "idle"
          ? 0
          : previewSteps.length - 1
      : 0;

  useEffect(() => {
    if (status !== "loading") {
      return undefined;
    }

    const interval = window.setInterval(() => {
      setLoadingIndex((current) => {
        if (current >= copy.loadingSteps.length - 1) {
          return current;
        }

        return current + 1;
      });
    }, 1500);

    return () => window.clearInterval(interval);
  }, [copy.loadingSteps.length, status]);

  const normalizeFieldValue = () => {
    const normalized = normalizeWebsiteUrl(url);

    if (!normalized) {
      return null;
    }

    setUrl((current) => (current === normalized ? current : normalized));

    if (status === "error") {
      setStatus("idle");
      setError("");
      setErrorSuggestion(null);
    }

    return normalized;
  };

  const runAudit = async (normalized: string) => {
    setStatus("loading");
    setError("");
    setErrorSuggestion(null);
    setAudit(null);
    setAuditedUrl("");
    setShowProposalForm(false);
    setLoadingIndex(0);

    try {
      const response = await fetch("/api/audit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: normalized, locale }),
      });
      let payload: AuditApiResponse | null = null;

      try {
        payload = (await response.json()) as AuditApiResponse;
      } catch {
        payload = null;
      }

      if (!response.ok || !payload?.audit) {
        setStatus("error");
        setAudit(null);
        setError(payload?.error || getGenericAuditErrorMessage(locale));
        setErrorSuggestion(payload?.suggestion ?? null);
        return;
      }

      const auditResult = payload.audit;

      startTransition(() => {
        setAudit(auditResult);
        setAuditedUrl(normalized);
        setStatus("success");
        setErrorSuggestion(null);
      });
    } catch {
      setStatus("error");
      setAudit(null);
      setError(getGenericAuditErrorMessage(locale));
      setErrorSuggestion(null);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalized = normalizeFieldValue();

    if (!normalized) {
      setStatus("error");
      setAudit(null);
      setError(copy.invalidUrlMessage);
      setErrorSuggestion(null);
      return;
    }

    await runAudit(normalized);
  };

  const handleSuggestionClick = async () => {
    if (!errorSuggestion) {
      return;
    }

    setUrl(errorSuggestion.url);
    await runAudit(errorSuggestion.url);
  };

  const handleRequestProposal = () => {
    setShowProposalForm(true);
  };

  return (
    <div
      className={`scanlines noise-mask relative overflow-hidden rounded-[36px] border p-6 sm:p-10 lg:p-12 ${
        isFeatured
          ? "border-[#48685b] bg-[radial-gradient(circle_at_top_right,rgba(94,151,123,0.24),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(62,102,84,0.22),transparent_28%),linear-gradient(135deg,#0b1512_0%,#12211d_54%,#1a2c27_100%)] shadow-[0_36px_90px_rgba(6,15,12,0.32)]"
          : "glass-panel border-black/8"
      }`}
    >
      <div className="pointer-events-none absolute inset-0">
        <div className={`grid-surface absolute inset-0 ${isFeatured ? "opacity-12" : "opacity-35"}`} />
        {isFeatured ? (
          <>
            <div className="absolute -right-10 top-8 h-44 w-44 rounded-full bg-[#7ac69d]/18 blur-3xl" />
            <div className="absolute -left-8 bottom-8 h-36 w-36 rounded-full bg-[#4e7f69]/22 blur-3xl" />
          </>
        ) : null}
        <div
          className={`absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent ${
            isFeatured ? "via-white/18" : "via-black/15"
          } to-transparent`}
        />
        <div
          className={`absolute inset-x-16 bottom-0 h-px bg-gradient-to-r from-transparent ${
            isFeatured ? "via-white/10" : "via-black/10"
          } to-transparent`}
        />
      </div>

      <div className="relative z-10">
        {isFeatured ? (
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)] lg:items-center">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#d9eee1]/14 bg-[#dff3e6] px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#11201c] shadow-[0_12px_28px_rgba(4,12,10,0.18)]">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#1c3f34]/28" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#17342c]" />
                </span>
                {copy.badge}
              </div>

              <h3 className="mt-5 text-[2.2rem] font-semibold leading-[1.02] tracking-[-0.04em] text-white sm:text-[3rem]">
                {copy.title}
              </h3>

              {copy.subtext ? (
                <p className="mt-5 max-w-xl text-base font-medium leading-7 text-emerald-50/84 sm:text-[1.05rem]">
                  {copy.subtext}
                </p>
              ) : null}

              {featuredExplainer ? (
                <div className="mt-6 rounded-[22px] border border-white/10 bg-white/6 px-4 py-3 text-sm leading-6 text-emerald-50/76 shadow-[0_12px_30px_rgba(4,12,10,0.14)]">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    {featuredExplainer.split("|").map((item, index) => (
                      <div key={item} className="flex items-center gap-3">
                        {index > 0 ? <span className="h-1 w-1 rounded-full bg-emerald-50/28" /> : null}
                        <span>{item.trim()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : copy.description ? (
                <p className="mt-5 max-w-xl text-sm leading-6 text-emerald-50/68">{copy.description}</p>
              ) : null}

              <form onSubmit={handleSubmit} className="mt-7 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
                <input
                  type="text"
                  inputMode="url"
                  autoComplete="url"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  value={url}
                  onChange={(event) => setUrl(event.target.value)}
                  onBlur={normalizeFieldValue}
                  placeholder={copy.placeholder}
                  className="min-h-14 rounded-[20px] border border-[#d3e9de]/16 bg-white px-5 text-neutral-950 outline-none shadow-[0_18px_34px_rgba(4,12,10,0.14)] placeholder:text-neutral-400 focus:border-[#b8dfca] focus:shadow-[0_0_0_4px_rgba(184,223,202,0.18)]"
                />
                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="group min-h-15 rounded-[22px] border border-[#46a06f] bg-[linear-gradient(180deg,#2f9a68_0%,#267c55_100%)] px-8 py-4 text-base font-semibold text-white shadow-[0_20px_40px_rgba(23,85,58,0.34),0_0_0_1px_rgba(191,242,214,0.08)_inset] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[linear-gradient(180deg,#39ab75_0%,#2b8b5e_100%)] hover:shadow-[0_24px_46px_rgba(23,85,58,0.38),0_0_0_1px_rgba(216,247,229,0.14)_inset] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span className="inline-flex items-center gap-2">
                    {status === "loading"
                      ? copy.loadingLabel
                      : renderFeaturedSubmitLabel(copy.submitLabel)}
                  </span>
                </button>
              </form>

              {featuredBenefits.length > 0 && !featuredExplainer ? (
                <div className="mt-5 flex flex-wrap gap-2.5 text-left">
                  {featuredBenefits.map((benefit) => (
                    <div
                      key={benefit}
                      className="rounded-full border border-white/10 bg-white/6 px-3.5 py-2 text-sm text-emerald-50/76"
                    >
                      {benefit}
                    </div>
                  ))}
                </div>
              ) : null}
            </div>

            <AuditPreviewPanel
              locale={locale}
              idleTitle={previewIdleTitle}
              idleSteps={previewIdleStepsResolved}
              steps={previewSteps}
              activeIndex={previewActiveIndex}
              status={status}
            />
          </div>
        ) : (
          <>
            <div className="mx-auto max-w-4xl text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-black/[0.03] px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-neutral-600">
                {copy.badge}
              </div>
              <h3 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-neutral-950 sm:text-4xl">
                {copy.title}
              </h3>
              {copy.subtext ? (
                <p className="mx-auto mt-4 max-w-3xl text-sm font-medium leading-6 text-neutral-900">
                  {copy.subtext}
                </p>
              ) : null}
              {copy.description ? (
                <p className="mx-auto mt-3 max-w-3xl text-base leading-7 text-neutral-600">
                  {copy.description}
                </p>
              ) : null}
            </div>

            <form
              onSubmit={handleSubmit}
              className="mx-auto mt-8 grid max-w-4xl gap-4 lg:grid-cols-[minmax(0,1fr)_auto]"
            >
              <input
                type="text"
                inputMode="url"
                autoComplete="url"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                value={url}
                onChange={(event) => setUrl(event.target.value)}
                onBlur={normalizeFieldValue}
                placeholder={copy.placeholder}
                className="min-h-14 rounded-[20px] border border-black/10 bg-white px-5 text-neutral-950 outline-none focus:border-black/25 focus:shadow-[0_0_0_4px_rgba(17,17,17,0.05)]"
              />
              <button
                type="submit"
                disabled={status === "loading"}
                className="rounded-[20px] border border-black bg-black px-6 py-4 text-sm font-medium text-white hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {status === "loading" ? copy.loadingLabel : copy.submitLabel}
              </button>
            </form>
          </>
        )}

        {status === "idle" && !isFeatured ? (
          <div className="mx-auto mt-6 grid max-w-4xl gap-3 md:grid-cols-3">
            {copy.loadingSteps.map((step, index) => (
              <div
                key={step}
                className={`rounded-[22px] border px-4 py-4 text-sm ${
                  index === 0
                    ? "border-black/12 bg-black/[0.03] text-neutral-800"
                    : "border-black/8 bg-white/55 text-neutral-500"
                }`}
              >
                {step}
              </div>
            ))}
          </div>
        ) : null}

        {status === "loading" && !isFeatured ? (
          <div className="mx-auto mt-6 max-w-4xl rounded-[24px] border border-black/10 bg-white/82 p-5">
            <div className="text-sm text-neutral-500">{copy.activeAuditLabel}</div>
            <div className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-neutral-950">
              {copy.loadingSteps[loadingIndex]}
            </div>
            <div className="mt-6 space-y-3">
              {copy.loadingSteps.map((step, index) => (
                <div
                  key={step}
                  className={`flex items-center gap-3 rounded-[18px] border px-4 py-3 text-sm ${
                    index <= loadingIndex
                      ? "border-black/12 bg-black/[0.03] text-neutral-900"
                      : "border-black/8 bg-white/50 text-neutral-500"
                  }`}
                >
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${
                      index < loadingIndex
                        ? "bg-neutral-950"
                        : index === loadingIndex
                          ? "bg-neutral-900 shadow-[0_0_16px_rgba(17,17,17,0.18)]"
                          : "bg-black/20"
                    }`}
                  />
                  <span>{step}</span>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {status === "error" ? (
          <div className="mx-auto mt-6 max-w-4xl rounded-[24px] border border-black/10 bg-white/78 p-5 text-sm leading-6 text-neutral-700">
            <p>{error}</p>
            {errorSuggestion ? (
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <span className="text-neutral-950">{errorSuggestion.message}</span>
                <button
                  type="button"
                  onClick={handleSuggestionClick}
                  className="rounded-full border border-black/12 bg-black/[0.04] px-4 py-2 text-sm font-medium text-neutral-950 hover:bg-black/[0.08]"
                >
                  {errorSuggestion.actionLabel}
                </button>
              </div>
            ) : null}
          </div>
        ) : null}

        {audit ? (
          <div className="mt-8 space-y-6">
            <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
              <ResultCard title={copy.fitCardTitle}>
                <div className="flex flex-wrap items-end gap-4">
                  <div className="rounded-[22px] border border-black bg-black px-5 py-4 text-white">
                    <div className="text-[11px] uppercase tracking-[0.22em] text-white/55">
                      {copy.scoreLabel}
                    </div>
                    <div className="mt-2 text-4xl font-semibold tracking-[-0.05em]">
                      {audit.score}
                      <span className="text-lg text-white/45">/10</span>
                    </div>
                  </div>
                  <div className="rounded-[22px] border border-black/10 bg-black/[0.03] px-5 py-4 text-sm leading-6 text-neutral-700">
                    <div className="font-medium text-neutral-950">{fitLabel}</div>
                    <div className="mt-1">{audit.site_type}</div>
                  </div>
                </div>
              </ResultCard>

              <ResultCard title={copy.solutionCardTitle}>
                <div className="flex flex-wrap gap-3">
                  {audit.recommended_ai_type.map((item) => (
                    <div
                      key={item}
                      className="rounded-full border border-black/10 bg-black/[0.03] px-4 py-2 text-sm text-neutral-800"
                    >
                      {item}
                    </div>
                  ))}
                </div>
                <p className="mt-5 max-w-2xl text-sm leading-7 text-neutral-700">{audit.summary}</p>
              </ResultCard>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <ResultCard title={copy.whyFitTitle}>
                <ResultList items={audit.why_fit} />
              </ResultCard>
              <ResultCard title={copy.frictionTitle}>
                <ResultList items={audit.friction_points} />
              </ResultCard>
              <ResultCard title={copy.upsellTitle}>
                <ResultList items={audit.upsell_opportunities} />
              </ResultCard>
              <ResultCard title={copy.phaseOneTitle}>
                <ResultList items={audit.phase_one_plan} />
              </ResultCard>
            </div>

            <div className="rounded-[28px] border border-black/8 bg-white/78 p-6 shadow-[0_16px_50px_rgba(17,17,17,0.05)]">
              <div className="text-[11px] uppercase tracking-[0.24em] text-neutral-500">
                {copy.exampleFlowsTitle}
              </div>
              <div className="mt-5 grid gap-4 lg:grid-cols-3">
                {audit.example_user_flows.map((flow) => (
                  <div
                    key={flow.user_intent}
                    className="rounded-[24px] border border-black/8 bg-black/[0.03] p-5"
                  >
                    <div className="text-[11px] uppercase tracking-[0.22em] text-neutral-500">
                      {copy.userIntentLabel}
                    </div>
                    <div className="mt-3 text-lg font-medium leading-7 text-neutral-950">
                      {flow.user_intent}
                    </div>
                    <div className="mt-5 text-[11px] uppercase tracking-[0.22em] text-neutral-500">
                      {copy.aiActionLabel}
                    </div>
                    <p className="mt-2 text-sm leading-6 text-neutral-700">{flow.ai_action}</p>
                    <div className="mt-5 text-[11px] uppercase tracking-[0.22em] text-neutral-500">
                      {copy.businessValueLabel}
                    </div>
                    <p className="mt-2 text-sm leading-6 text-neutral-700">{flow.business_value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[28px] border border-black/10 bg-black px-6 py-6 text-white sm:flex sm:items-end sm:justify-between sm:gap-8">
              <div className="max-w-2xl">
                <div className="text-[11px] uppercase tracking-[0.22em] text-white/55">
                  {copy.nextStepLabel}
                </div>
                <div className="mt-3 text-2xl font-semibold tracking-[-0.04em]">{copy.proposalTitle}</div>
                <p className="mt-3 text-sm leading-6 text-white/70">{copy.proposalDescription}</p>
              </div>

              <button
                type="button"
                onClick={handleRequestProposal}
                className="mt-6 rounded-[20px] border border-white bg-white px-6 py-4 text-sm font-medium text-black hover:bg-neutral-200 sm:mt-0"
              >
                {copy.proposalButtonLabel}
              </button>
            </div>

            {showProposalForm ? (
              <LeadCaptureForm
                locale={locale}
                source="audit_result"
                variant="audit"
                initialWebsite={auditedUrl}
                linkedAuditDomain={linkedAuditDomain}
              />
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
