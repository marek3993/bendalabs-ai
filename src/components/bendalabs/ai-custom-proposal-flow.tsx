"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import {
  businessTypeOptions,
  dashboardDataOptions,
  type AiCustomProposalBusinessType,
  type AiCustomProposalDashboardData,
  type AiCustomProposalMainGoal,
  type AiCustomProposalRecommendation,
  type AiCustomProposalVisitorNextStep,
  mainGoalOptions,
  visitorNextStepOptions,
} from "@/lib/bendalabs/ai-custom-proposal";
import { normalizeWebsiteUrl } from "@/lib/site-audit/url";

type FormState = {
  website: string;
  businessType: AiCustomProposalBusinessType | "";
  mainGoal: AiCustomProposalMainGoal | "";
  visitorNextStep: AiCustomProposalVisitorNextStep | "";
  opportunityText: string;
  dashboardData: AiCustomProposalDashboardData[];
  successMetric: string;
  name: string;
  email: string;
  phone: string;
  company: string;
};

const TOTAL_STEPS = 8;

const initialFormState: FormState = {
  website: "",
  businessType: "",
  mainGoal: "",
  visitorNextStep: "",
  opportunityText: "",
  dashboardData: [],
  successMetric: "",
  name: "",
  email: "",
  phone: "",
  company: "",
};

function StepTag({ children }: { children: ReactNode }) {
  return (
    <div className="inline-flex rounded-full border border-black/10 bg-white/80 px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-neutral-600">
      {children}
    </div>
  );
}

function ChoiceButton({
  active,
  label,
  onClick,
  multi = false,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
  multi?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-[24px] border px-5 py-4 text-left text-sm leading-6 transition ${
        active
          ? "border-black bg-black text-white shadow-[0_16px_40px_rgba(17,17,17,0.16)]"
          : "border-black/10 bg-white text-neutral-800 hover:border-black/20 hover:bg-black/[0.02]"
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`mt-1 flex h-5 w-5 items-center justify-center rounded-full border ${
            active ? "border-white bg-white text-black" : "border-black/20 bg-white text-transparent"
          }`}
        >
          <span className="text-[11px]">{multi ? "+" : "•"}</span>
        </div>
        <span>{label}</span>
      </div>
    </button>
  );
}

function ResultSection({
  title,
  items,
}: {
  title: string;
  items: readonly string[];
}) {
  return (
    <div className="rounded-[28px] border border-black/8 bg-white p-6 shadow-[0_16px_50px_rgba(17,17,17,0.05)]">
      <div className="text-[11px] uppercase tracking-[0.22em] text-neutral-500">{title}</div>
      <div className="mt-4 space-y-3">
        {items.map((item) => (
          <div
            key={item}
            className="rounded-[20px] border border-black/8 bg-black/[0.03] px-4 py-4 text-sm leading-7 text-neutral-700"
          >
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}

function getOptionLabel(options: readonly { value: string; label: string }[], value: string) {
  return options.find((item) => item.value === value)?.label ?? value;
}

function validateCurrentStep(step: number, formState: FormState) {
  if (step === 0) {
    return normalizeWebsiteUrl(formState.website)
      ? ""
      : "Zadajte platnu webovu adresu. Staci aj domena ako vasweb.sk.";
  }

  if (step === 1) {
    return formState.businessType ? "" : "Vyberte, aky typ webu riesite.";
  }

  if (step === 2) {
    return formState.mainGoal ? "" : "Vyberte, co ma AI vrstva zlepsit ako prve.";
  }

  if (step === 3) {
    return formState.visitorNextStep ? "" : "Vyberte, co ma navstevnik idealne spravit.";
  }

  if (step === 4) {
    return formState.opportunityText.trim().length >= 12
      ? ""
      : "Strucne doplnte, kde dnes vidite najvacsiu prilezitost na zlepsenie.";
  }

  if (step === 5) {
    return formState.dashboardData.length > 0
      ? ""
      : "Vyberte aspon jeden typ dat, ktory chcete vidiet v dashboarde.";
  }

  if (step === 6) {
    return formState.successMetric.trim().length >= 12
      ? ""
      : "Doplnte, podla coho by ste po 30 dnoch povedali, ze to ma zmysel.";
  }

  const normalizedWebsite = normalizeWebsiteUrl(formState.website);

  if (!formState.name.trim()) {
    return "Zadajte meno.";
  }

  if (!formState.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formState.email.trim())) {
    return "Zadajte platny email.";
  }

  if (!normalizedWebsite) {
    return "Web nie je platny. Vratte sa na prvy krok a opravte ho.";
  }

  return "";
}

export default function AiCustomProposalFlow() {
  const [step, setStep] = useState(0);
  const [formState, setFormState] = useState<FormState>(initialFormState);
  const [stepError, setStepError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recommendation, setRecommendation] = useState<AiCustomProposalRecommendation | null>(null);
  const [emailRequested, setEmailRequested] = useState(false);

  const stepIndex = step + 1;

  function updateField<Key extends keyof FormState>(field: Key, value: FormState[Key]) {
    setFormState((current) => ({ ...current, [field]: value }));
    setStepError("");
    setSubmitError("");
  }

  function handleNext() {
    const error = validateCurrentStep(step, formState);

    if (error) {
      setStepError(error);
      return;
    }

    setStepError("");
    setStep((current) => Math.min(current + 1, TOTAL_STEPS - 1));
  }

  function handleBack() {
    setStepError("");
    setStep((current) => Math.max(current - 1, 0));
  }

  function toggleDashboardItem(value: AiCustomProposalDashboardData) {
    setFormState((current) => {
      const exists = current.dashboardData.includes(value);

      return {
        ...current,
        dashboardData: exists
          ? current.dashboardData.filter((item) => item !== value)
          : [...current.dashboardData, value],
      };
    });
    setStepError("");
  }

  async function handleSubmit() {
    const error = validateCurrentStep(TOTAL_STEPS - 1, formState);

    if (error) {
      setStepError(error);
      return;
    }

    setIsSubmitting(true);
    setSubmitError("");
    setStepError("");

    try {
      const response = await fetch("/api/ai-custom-proposal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formState),
      });

      const payload = (await response.json()) as {
        error?: string;
        recommendation?: AiCustomProposalRecommendation;
      };

      if (!response.ok || !payload.recommendation) {
        setSubmitError(payload.error ?? "Navrh sa teraz nepodarilo pripravit.");
        return;
      }

      setRecommendation(payload.recommendation);
      setEmailRequested(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setSubmitError("Navrh sa teraz nepodarilo pripravit.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (recommendation) {
    return (
      <main className="mx-auto max-w-7xl px-6 pb-16 pt-8 sm:pb-20 sm:pt-10">
        <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="space-y-6">
            <div className="rounded-[32px] border border-[#8fb6a8]/55 bg-[radial-gradient(circle_at_top_right,rgba(196,231,214,0.42),transparent_34%),linear-gradient(180deg,rgba(253,255,254,0.98),rgba(242,249,245,0.96))] p-7 shadow-[0_24px_72px_rgba(80,118,103,0.12)]">
              <StepTag>Navrh pripraveny</StepTag>
              <h1
                className="mt-5 text-3xl font-semibold tracking-[-0.05em] text-neutral-950 sm:text-4xl"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Vas AI navrh na mieru
              </h1>
              <p className="mt-4 text-base leading-7 text-neutral-700">{recommendation.summary}</p>

              <div className="mt-6 rounded-[24px] border border-black/8 bg-white/80 p-5">
                <div className="text-[11px] uppercase tracking-[0.22em] text-neutral-500">
                  Odporucany typ AI vrstvy
                </div>
                <div className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-neutral-950">
                  {recommendation.recommendedLayerTitle}
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <a
                  href="tel:+421944388123"
                  className="inline-flex rounded-full border border-black bg-black px-5 py-3 text-sm font-medium text-white hover:bg-neutral-800"
                >
                  Dohodnut kratky call
                </a>
                <button
                  type="button"
                  onClick={() => setEmailRequested(true)}
                  className="rounded-full border border-black/10 bg-white px-5 py-3 text-sm font-medium text-neutral-950 hover:bg-neutral-100"
                >
                  Poslat mi navrh emailom
                </button>
              </div>

              {emailRequested ? (
                <div className="mt-4 rounded-[18px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-900">
                  Navrh posleme aj na {formState.email.trim()} a nadviazeme s dalsim krokom.
                </div>
              ) : null}
            </div>

            <div className="rounded-[30px] border border-black/10 bg-white p-6 shadow-[0_16px_50px_rgba(17,17,17,0.05)]">
              <div className="text-[11px] uppercase tracking-[0.22em] text-neutral-500">Zadanie</div>
              <div className="mt-4 space-y-4 text-sm leading-6 text-neutral-700">
                <div>
                  <div className="text-neutral-500">Web</div>
                  <div className="font-medium text-neutral-950">{formState.website}</div>
                </div>
                <div>
                  <div className="text-neutral-500">Typ webu</div>
                  <div className="font-medium text-neutral-950">
                    {getOptionLabel(businessTypeOptions, formState.businessType)}
                  </div>
                </div>
                <div>
                  <div className="text-neutral-500">Hlavny ciel</div>
                  <div className="font-medium text-neutral-950">
                    {getOptionLabel(mainGoalOptions, formState.mainGoal)}
                  </div>
                </div>
                <div>
                  <div className="text-neutral-500">Idealny dalsi krok navstevnika</div>
                  <div className="font-medium text-neutral-950">
                    {getOptionLabel(visitorNextStepOptions, formState.visitorNextStep)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <ResultSection title="Co by riesila pre navstevnika" items={recommendation.visitorValue} />
            <ResultSection title="Co by ziskal vas tim" items={recommendation.teamValue} />
            <ResultSection title="Ake data by ukazal dashboard" items={recommendation.dashboardValue} />
            <ResultSection title="Najjednoduchsia prva faza" items={recommendation.phaseOne} />
            <ResultSection title="Odporucany dalsi krok" items={[recommendation.nextStep]} />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-6 pb-16 pt-8 sm:pb-20 sm:pt-10">
      <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
        <div className="lg:sticky lg:top-28">
          <div className="rounded-[34px] border border-[#8fb6a8]/55 bg-[radial-gradient(circle_at_top_right,rgba(196,231,214,0.42),transparent_34%),linear-gradient(180deg,rgba(253,255,254,0.98),rgba(242,249,245,0.96))] p-7 shadow-[0_24px_72px_rgba(80,118,103,0.12)]">
            <StepTag>AI navrh na mieru</StepTag>
            <h1
              className="mt-5 text-[2.8rem] font-semibold leading-[0.96] tracking-[-0.06em] text-neutral-950 sm:text-[3.6rem]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              AI navrh na mieru
            </h1>
            <p className="mt-5 text-lg leading-8 text-neutral-600">
              Odpovedzte na par otazok o vasom webe a cieloch. Na konci ziskate navrh, aka AI vrstva
              by mohla davat najvacsi zmysel prave pre vas biznis.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              {[
                "AI vrstva",
                "navrh na mieru",
                "lepsie pripravene dopyty",
                "dashboard zamerov",
                "bez prerabky existujuceho webu",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-full border border-black/8 bg-white/75 px-4 py-2 text-sm text-neutral-700"
                >
                  {item}
                </div>
              ))}
            </div>

            <div className="mt-8 rounded-[24px] border border-black/8 bg-white/80 p-5">
              <div className="flex items-center justify-between gap-4">
                <div className="text-sm font-medium text-neutral-950">Krok {stepIndex} z 8</div>
                <div className="text-sm text-neutral-500">{Math.round((stepIndex / TOTAL_STEPS) * 100)}%</div>
              </div>
              <div className="mt-4 h-2 rounded-full bg-black/8">
                <div
                  className="h-full rounded-full bg-black transition-all"
                  style={{ width: `${(stepIndex / TOTAL_STEPS) * 100}%` }}
                />
              </div>
            </div>

            <div className="mt-6 rounded-[24px] border border-black/8 bg-white/72 p-5 text-sm leading-7 text-neutral-700">
              <div className="text-[11px] uppercase tracking-[0.22em] text-neutral-500">Co ziskate</div>
              <div className="mt-3">
                Na konci uvidite odporucany typ AI vrstvy, co by riesila pre navstevnika, ake nove
                obchodne data by ste vedeli sledovat a aky je najjednoduchsi prvy krok.
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-[34px] border border-black/10 bg-white p-6 shadow-[0_18px_64px_rgba(17,17,17,0.06)] sm:p-8">
          {step === 0 ? (
            <div>
              <StepTag>Web firmy</StepTag>
              <h2 className="mt-5 text-3xl font-semibold tracking-[-0.04em] text-neutral-950">
                Aky web chcete posudit?
              </h2>
              <p className="mt-4 max-w-2xl text-base leading-7 text-neutral-600">
                Staci URL alebo domena. Navrh postavime na tom, ako dnes funguje vas web a co od neho
                potrebujete.
              </p>

              <label className="mt-8 block">
                <span className="mb-2 block text-sm text-neutral-700">Web firmy</span>
                <input
                  type="text"
                  inputMode="url"
                  autoComplete="url"
                  value={formState.website}
                  onChange={(event) => updateField("website", event.target.value)}
                  placeholder="napr. vasweb.sk"
                  className="min-h-14 w-full rounded-[22px] border border-black/10 bg-white px-5 text-neutral-950 outline-none focus:border-black/25 focus:shadow-[0_0_0_4px_rgba(17,17,17,0.05)]"
                />
              </label>
            </div>
          ) : null}

          {step === 1 ? (
            <div>
              <StepTag>Typ webu / biznisu</StepTag>
              <h2 className="mt-5 text-3xl font-semibold tracking-[-0.04em] text-neutral-950">
                Aky typ webu riesite?
              </h2>
              <div className="mt-8 grid gap-3 md:grid-cols-2">
                {businessTypeOptions.map((option) => (
                  <ChoiceButton
                    key={option.value}
                    active={formState.businessType === option.value}
                    label={option.label}
                    onClick={() => updateField("businessType", option.value)}
                  />
                ))}
              </div>
            </div>
          ) : null}

          {step === 2 ? (
            <div>
              <StepTag>Hlavny ciel</StepTag>
              <h2 className="mt-5 text-3xl font-semibold tracking-[-0.04em] text-neutral-950">
                Co by mala AI vrstva zlepsit ako prve?
              </h2>
              <div className="mt-8 grid gap-3">
                {mainGoalOptions.map((option) => (
                  <ChoiceButton
                    key={option.value}
                    active={formState.mainGoal === option.value}
                    label={option.label}
                    onClick={() => updateField("mainGoal", option.value)}
                  />
                ))}
              </div>
            </div>
          ) : null}

          {step === 3 ? (
            <div>
              <StepTag>Dalsi krok navstevnika</StepTag>
              <h2 className="mt-5 text-3xl font-semibold tracking-[-0.04em] text-neutral-950">
                Co ma navstevnik idealne spravit?
              </h2>
              <div className="mt-8 grid gap-3 md:grid-cols-2">
                {visitorNextStepOptions.map((option) => (
                  <ChoiceButton
                    key={option.value}
                    active={formState.visitorNextStep === option.value}
                    label={option.label}
                    onClick={() => updateField("visitorNextStep", option.value)}
                  />
                ))}
              </div>
            </div>
          ) : null}

          {step === 4 ? (
            <div>
              <StepTag>Dnesny problem alebo prilezitost</StepTag>
              <h2 className="mt-5 text-3xl font-semibold tracking-[-0.04em] text-neutral-950">
                Kde dnes vidite najvacsiu prilezitost na zlepsenie?
              </h2>
              <textarea
                value={formState.opportunityText}
                onChange={(event) => updateField("opportunityText", event.target.value)}
                rows={7}
                placeholder="Napr. vela ludi pise vseobecne otazky, dopyty su neuplne, ludia nevedia vybrat spravnu sluzbu, chceme lepsie data o zameroch navstevnikov..."
                className="mt-8 w-full rounded-[24px] border border-black/10 bg-white px-5 py-4 text-neutral-950 outline-none focus:border-black/25 focus:shadow-[0_0_0_4px_rgba(17,17,17,0.05)]"
              />
            </div>
          ) : null}

          {step === 5 ? (
            <div>
              <StepTag>Data / dashboard</StepTag>
              <h2 className="mt-5 text-3xl font-semibold tracking-[-0.04em] text-neutral-950">
                Ake data by ste chceli vidiet v dashboarde?
              </h2>
              <p className="mt-4 text-base leading-7 text-neutral-600">
                Mozete vybrat viac moznosti. Cielom je vidiet, co ludia realne hladaju a ako sa
                rozhoduju.
              </p>
              <div className="mt-8 grid gap-3 md:grid-cols-2">
                {dashboardDataOptions.map((option) => (
                  <ChoiceButton
                    key={option.value}
                    active={formState.dashboardData.includes(option.value)}
                    label={option.label}
                    multi
                    onClick={() => toggleDashboardItem(option.value)}
                  />
                ))}
              </div>
            </div>
          ) : null}

          {step === 6 ? (
            <div>
              <StepTag>Uspech po 30 dnoch</StepTag>
              <h2 className="mt-5 text-3xl font-semibold tracking-[-0.04em] text-neutral-950">
                Podla coho by ste po 30 dnoch povedali, ze to ma zmysel?
              </h2>
              <textarea
                value={formState.successMetric}
                onChange={(event) => updateField("successMetric", event.target.value)}
                rows={7}
                placeholder="Napr. viac kvalitnych dopytov, menej nejasnych otazok, lepsi prehlad o potrebach zakaznikov, rychlejsie objednanie..."
                className="mt-8 w-full rounded-[24px] border border-black/10 bg-white px-5 py-4 text-neutral-950 outline-none focus:border-black/25 focus:shadow-[0_0_0_4px_rgba(17,17,17,0.05)]"
              />
            </div>
          ) : null}

          {step === 7 ? (
            <div>
              <StepTag>Kontakt</StepTag>
              <h2 className="mt-5 text-3xl font-semibold tracking-[-0.04em] text-neutral-950">
                Kam vam mozeme poslat navrh alebo sa ozvat?
              </h2>
              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <label className="grid gap-2 text-sm text-neutral-700">
                  <span>Meno</span>
                  <input
                    type="text"
                    autoComplete="name"
                    value={formState.name}
                    onChange={(event) => updateField("name", event.target.value)}
                    className="min-h-12 rounded-[18px] border border-black/10 bg-white px-4 text-neutral-950 outline-none focus:border-black/25 focus:shadow-[0_0_0_4px_rgba(17,17,17,0.05)]"
                  />
                </label>

                <label className="grid gap-2 text-sm text-neutral-700">
                  <span>Email</span>
                  <input
                    type="email"
                    autoComplete="email"
                    value={formState.email}
                    onChange={(event) => updateField("email", event.target.value)}
                    className="min-h-12 rounded-[18px] border border-black/10 bg-white px-4 text-neutral-950 outline-none focus:border-black/25 focus:shadow-[0_0_0_4px_rgba(17,17,17,0.05)]"
                  />
                </label>

                <label className="grid gap-2 text-sm text-neutral-700">
                  <span>Telefon (volitelne)</span>
                  <input
                    type="tel"
                    autoComplete="tel"
                    value={formState.phone}
                    onChange={(event) => updateField("phone", event.target.value)}
                    className="min-h-12 rounded-[18px] border border-black/10 bg-white px-4 text-neutral-950 outline-none focus:border-black/25 focus:shadow-[0_0_0_4px_rgba(17,17,17,0.05)]"
                  />
                </label>

                <label className="grid gap-2 text-sm text-neutral-700">
                  <span>Firma (volitelne)</span>
                  <input
                    type="text"
                    autoComplete="organization"
                    value={formState.company}
                    onChange={(event) => updateField("company", event.target.value)}
                    className="min-h-12 rounded-[18px] border border-black/10 bg-white px-4 text-neutral-950 outline-none focus:border-black/25 focus:shadow-[0_0_0_4px_rgba(17,17,17,0.05)]"
                  />
                </label>
              </div>
            </div>
          ) : null}

          {stepError ? (
            <div className="mt-6 rounded-[20px] border border-amber-300 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
              {stepError}
            </div>
          ) : null}

          {submitError ? (
            <div className="mt-6 rounded-[20px] border border-amber-300 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
              {submitError}
            </div>
          ) : null}

          <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-black/8 pt-6">
            <button
              type="button"
              onClick={handleBack}
              disabled={step === 0}
              className="rounded-full border border-black/10 bg-white px-5 py-3 text-sm font-medium text-neutral-950 hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Spat
            </button>

            {step < TOTAL_STEPS - 1 ? (
              <button
                type="button"
                onClick={handleNext}
                className="rounded-full border border-black bg-black px-6 py-3 text-sm font-medium text-white hover:bg-neutral-800"
              >
                Dalsi krok
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="rounded-full border border-black bg-black px-6 py-3 text-sm font-medium text-white hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? "Pripravujem navrh..." : "Zobrazit AI navrh na mieru"}
              </button>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
