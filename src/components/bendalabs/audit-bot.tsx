"use client";

import { startTransition, useEffect, useMemo, useState } from "react";
import LeadCaptureForm from "@/components/bendalabs/lead-capture-form";
import { getAuditBotCopy, type SiteLocale } from "@/lib/bendalabs/site-content";
import { getNormalizedDomainFromUrl } from "@/lib/leads/domain-utils";
import { getFitLabelKeyFromScore } from "@/lib/site-audit/normalize";
import type { SiteAudit } from "@/lib/site-audit/schema";
import { normalizeWebsiteUrl } from "@/lib/site-audit/url";

type AuditBotProps = {
  locale?: SiteLocale;
  badge?: string;
  title?: string;
  description?: string;
  submitLabel?: string;
  loadingLabel?: string;
  proposalTitle?: string;
  proposalDescription?: string;
  proposalButtonLabel?: string;
};

type Status = "idle" | "loading" | "success" | "error";

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

export default function AuditBot({
  locale = "sk",
  badge,
  title,
  description,
  submitLabel,
  loadingLabel,
  proposalTitle,
  proposalDescription,
  proposalButtonLabel,
}: AuditBotProps) {
  const defaults = getAuditBotCopy(locale);
  const copy = useMemo(
    () => ({
      ...defaults,
      badge: badge ?? defaults.badge,
      title: title ?? defaults.title,
      description: description ?? defaults.description,
      submitLabel: submitLabel ?? defaults.submitLabel,
      loadingLabel: loadingLabel ?? defaults.loadingLabel,
      proposalTitle: proposalTitle ?? defaults.proposalTitle,
      proposalDescription: proposalDescription ?? defaults.proposalDescription,
      proposalButtonLabel: proposalButtonLabel ?? defaults.proposalButtonLabel,
    }),
    [
      badge,
      defaults,
      description,
      loadingLabel,
      proposalButtonLabel,
      proposalDescription,
      proposalTitle,
      submitLabel,
      title,
    ],
  );

  const [url, setUrl] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const [audit, setAudit] = useState<SiteAudit | null>(null);
  const [loadingIndex, setLoadingIndex] = useState(0);
  const [auditedUrl, setAuditedUrl] = useState("");
  const [showProposalForm, setShowProposalForm] = useState(false);
  const fitLabel = audit ? copy.fitLabels[getFitLabelKeyFromScore(audit.score)] : null;
  const linkedAuditDomain = auditedUrl ? getNormalizedDomainFromUrl(auditedUrl) : null;

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
    }

    return normalized;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalized = normalizeFieldValue();

    if (!normalized) {
      setStatus("error");
      setAudit(null);
      setError(copy.invalidUrlMessage);
      return;
    }

    setStatus("loading");
    setError("");
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

      const payload = (await response.json()) as { audit?: SiteAudit; error?: string };

      if (!response.ok || !payload.audit) {
        throw new Error(payload.error || copy.genericErrorMessage);
      }

      startTransition(() => {
        setAudit(payload.audit ?? null);
        setAuditedUrl(normalized);
        setStatus("success");
      });
    } catch (requestError) {
      setStatus("error");
      setAudit(null);
      setError(requestError instanceof Error ? requestError.message : copy.genericErrorMessage);
    }
  };

  const handleRequestProposal = () => {
    setShowProposalForm(true);
  };

  return (
    <div className="glass-panel scanlines noise-mask relative overflow-hidden rounded-[36px] p-6 sm:p-10 lg:p-12">
      <div className="pointer-events-none absolute inset-0">
        <div className="grid-surface absolute inset-0 opacity-35" />
        <div className="absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-black/15 to-transparent" />
        <div className="absolute inset-x-16 bottom-0 h-px bg-gradient-to-r from-transparent via-black/10 to-transparent" />
      </div>

      <div className="relative z-10">
        <div className="mx-auto max-w-4xl text-center">
          <div className="inline-flex rounded-full border border-black/10 bg-black/[0.03] px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-neutral-600">
            {copy.badge}
          </div>
          <h3 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-neutral-950 sm:text-4xl">
            {copy.title}
          </h3>
          <p className="mx-auto mt-4 max-w-3xl text-base leading-7 text-neutral-600">
            {copy.description}
          </p>
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

        {status === "idle" ? (
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

        {status === "loading" ? (
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
            {error}
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
