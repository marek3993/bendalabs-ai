"use client";

import { startTransition, useEffect, useMemo, useState } from "react";
import LeadCaptureForm from "@/components/bendalabs/lead-capture-form";
import { getDashboardPreviewCopy } from "@/lib/bendalabs/dashboard-preview";
import { getAuditBotCopy, type SiteLocale } from "@/lib/bendalabs/site-content";
import { getNormalizedDomainFromUrl } from "@/lib/leads/domain-utils";
import {
  getCrawlerBlockedMessage,
  getGenericAuditErrorMessage,
  type AuditErrorType,
  type AuditErrorSuggestion,
} from "@/lib/site-audit/error";
import { getFitLabelKeyFromScore } from "@/lib/site-audit/normalize";
import type { SiteAudit } from "@/lib/site-audit/schema";
import { normalizeWebsiteUrl } from "@/lib/site-audit/url";

const AUDIT_LOADING_STEP_INTERVAL_MS = 1500;
const SHORT_CALL_DISPLAY = "0944 388 123";

type SalesDashboardCopy = {
  eyebrow: string;
  cardTitle: string;
  previewSubtitle: string;
  callTitle: string;
  callDescription: string;
  callButtonLabel: string;
  formButtonLabel: string;
  formHelper: string;
};

type AuditLeadFormVariant = "proposal" | "call";

type DashboardCopy = {
  cardTitle: string;
  previewBadge: string;
  previewSubtitle: string;
  previewNote: string;
  topQuestionsTitle: string;
  topQuestionsEyebrow: string;
  topIntentsTitle: string;
  topIntentsEyebrow: string;
  frictionTitle: string;
  capturedTitle: string;
  card3Text?: string;
  card4Text?: string;
  insightsTitle: string;
  salesTitle: string;
  speedTitle: string;
  highlightTitle?: string;
  highlightText?: string;
  topicsLabel: string;
  frictionLabel: string;
  opportunitiesLabel: string;
  signalsLabel: string;
  impactLabels: string[];
  callTitle: string;
  callDescription: string;
  callButtonLabel: string;
  formButtonLabel?: string;
  formHelper: string;
};

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
  message?: string;
  error_type?: AuditErrorType | null;
  classification?: AuditErrorType | null;
  suggestion?: AuditErrorSuggestion | null;
};

function getBlockedAuditErrorType(payload: AuditApiResponse | null) {
  const value = payload?.classification ?? payload?.error_type ?? null;

  return value === "crawler_blocked" || value === "fetch_blocked" || value === "protected_site"
    ? value
    : null;
}

function waitForDuration(durationMs: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, durationMs);
  });
}

function getMinimumAuditLoadingDuration(stepCount: number) {
  if (stepCount <= 1) {
    return 0;
  }

  return (stepCount - 1) * AUDIT_LOADING_STEP_INTERVAL_MS;
}

function dedupeItems(items: readonly string[]) {
  return Array.from(new Set(items.map((item) => item.trim()).filter(Boolean)));
}

function getAuditDashboardCopy(locale: SiteLocale): DashboardCopy {
  if (locale === "cs") {
    return {
      cardTitle: "Ukázka dashboardu po nasazení AI vrstvy",
      previewBadge: "Preview po nasazení",
      previewSubtitle:
        "Ilustrační náhled, co by po spuštění AI vrstvy na tomto webu viděli obchod i marketing.",
      previewNote:
        "Obsah vychází z auditovaných signálů na webu a ukazuje, co by šlo sledovat bez změny celého flow.",
      topQuestionsTitle: "Co návštěvníci nejčastěji hledají",
      topQuestionsEyebrow: "Top otázky a témata",
      topIntentsTitle: "Nejčastější záměry návštěvníků",
      topIntentsEyebrow: "Kam míří jejich pozornost",
      frictionTitle: "Kde dnes pravděpodobně ztrácíte zákazníky",
      capturedTitle: "Jaké poptávky by AI dokázala zachytit",
      insightsTitle: "Jaké informace by získali navíc",
      salesTitle: "Přehledný dashboard pro obchod / marketing",
      speedTitle: "Co by AI dokázala zrychlit",
      topicsLabel: "Témata",
      frictionLabel: "Místa úniku",
      opportunitiesLabel: "Obchodní příležitosti",
      signalsLabel: "Silné signály",
      impactLabels: ["Největší dopad", "Silný dopad", "Skrytá ztráta"],
      callTitle: "Chcete to projít rychleji?",
      callDescription:
        "Krátký 10 až 15min call stačí na průchod výsledkem, prioritami i tím, kde by AI vrstva dávala největší smysl.",
      callButtonLabel: `Krátký call: ${SHORT_CALL_DISPLAY}`,
      formHelper: "Nebo pošlete kontakt přes formulář níže a připravím konkrétní návrh.",
    };
  }

  return {
    cardTitle: "Ukážka dashboardu po nasadení AI vrstvy",
    previewBadge: "Preview po nasadení",
    previewSubtitle:
      "Ilustračný náhľad toho, čo by po spustení AI vrstvy na tomto webe videli obchod aj marketing.",
    previewNote:
      "Obsah vychádza z auditovaných signálov na webe a ukazuje, čo by sa dalo sledovať bez zmeny celého flow.",
    topQuestionsTitle: "Čo návštevníci najčastejšie hľadajú",
    topQuestionsEyebrow: "Top otázky a témy",
    topIntentsTitle: "Najčastejšie zámery návštevníkov",
    topIntentsEyebrow: "Kam smeruje ich pozornosť",
    frictionTitle: "Kde dnes pravdepodobne strácajú zákazníkov",
    capturedTitle: "Aké dopyty by AI vedela zachytiť",
    insightsTitle: "Aké informácie by získali navyše",
    salesTitle: "Prehľadný dashboard pre obchod / marketing",
    speedTitle: "Čo by AI vedela zrýchliť",
    topicsLabel: "Témy",
    frictionLabel: "Miesta úniku",
    opportunitiesLabel: "Obchodné príležitosti",
    signalsLabel: "Silné signály",
    impactLabels: ["Najväčší dopad", "Silný dopad", "Skrytá strata"],
    callTitle: "Chcete si to prejsť rýchlejšie?",
    callDescription:
      "Krátky 10 až 15 min call stačí na prechod výsledku, priorít aj toho, kde by AI vrstva dávala najväčší zmysel.",
    callButtonLabel: `Krátky call: ${SHORT_CALL_DISPLAY}`,
    formHelper: "Alebo pošlite kontakt cez formulár nižšie a pripravím konkrétny návrh.",
  };
}

function getAuditDomainLabel(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return getNormalizedDomainFromUrl(url) ?? url;
  }
}

function getDomainInitials(domain: string) {
  const cleaned = domain.replace(/[^a-z0-9]+/gi, " ").trim();
  const parts = cleaned.split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return "AI";
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

function buildFallbackQuestion(locale: SiteLocale, index: number) {
  const questions =
    locale === "cs"
      ? [
          "Která nabídka je pro mě nejvhodnější?",
          "Jak se co nejrychleji dostanu ke správnému dalšímu kroku?",
          "Co potřebuji vědět před tím, než pošlu poptávku?",
          "Jaký je mezi možnostmi na webu rozdíl?",
          "Na koho se mám obrátit podle svého případu?",
        ]
      : [
          "Ktorá ponuka je pre mňa najvhodnejšia?",
          "Ako sa čo najrýchlejšie dostať k správnemu ďalšiemu kroku?",
          "Čo potrebujem vedieť pred tým, než pošlem dopyt?",
          "Aký je medzi možnosťami na webe rozdiel?",
          "Na koho sa mám obrátiť podľa svojho prípadu?",
        ];

  return questions[index] ?? questions[questions.length - 1];
}

function buildDashboardQuestions(audit: SiteAudit, locale: SiteLocale) {
  const items = dedupeItems([
    ...audit.example_user_flows.map((flow) => flow.user_intent),
    ...audit.upsell_opportunities,
    ...audit.phase_one_plan,
  ]);

  const resolved = [...items];

  while (resolved.length < 5) {
    resolved.push(buildFallbackQuestion(locale, resolved.length));
  }

  return resolved.slice(0, 5);
}

function buildDashboardIntentBars(audit: SiteAudit) {
  const weights = [48, 33, 19];

  return audit.example_user_flows.slice(0, 3).map((flow, index) => ({
    label: flow.user_intent,
    value: weights[index] ?? 18,
  }));
}

function buildDashboardCapturedPrompts(audit: SiteAudit, locale: SiteLocale) {
  const prompts = dedupeItems([
    ...audit.example_user_flows.map((flow) => flow.user_intent),
    ...audit.upsell_opportunities.map((item) =>
      locale === "cs" ? `Zajímá mě ${item.charAt(0).toLowerCase()}${item.slice(1)}` : `Zaujíma ma ${item.charAt(0).toLowerCase()}${item.slice(1)}`,
    ),
  ]);

  return prompts.slice(0, 4);
}

function buildDashboardInsights(audit: SiteAudit) {
  return dedupeItems([
    ...audit.example_user_flows.map((flow) => flow.business_value),
    ...audit.why_fit,
  ]).slice(0, 4);
}

function buildDashboardSpeedWins(audit: SiteAudit) {
  return dedupeItems(audit.phase_one_plan).slice(0, 3);
}

function getStructuredDashboardCopy(locale: SiteLocale) {
  if (locale === "cs") {
    return {
      cardTitle: "Ukázka dashboardu po nasazení AI vrstvy",
      previewBadge: "Preview po nasazení",
      previewSubtitle:
        "Simulace podle struktury a obsahu vašeho webu. Nejde o aktuální data, ale o ukázku toho, co byste po nasazení AI vrstvy mohli sledovat.",
      previewNote:
        "Obsah vychází ze struktury a signálů na webu a ukazuje, co byste mohli sledovat v čistém obchodním dashboardu.",
      topQuestionsTitle: "Top záměry návštěvníků",
      topQuestionsEyebrow: "Kam míří jejich pozornost",
      topIntentsTitle: "Kvalifikované poptávky",
      topIntentsEyebrow: "Jak by vypadal lead pro obchod",
      frictionTitle: "Obchodní přehled",
      capturedTitle: "Jaké poptávky by AI dokázala zachytit",
      insightsTitle: "Jaké informace získáte navíc",
      salesTitle: "Přehledný dashboard pro obchod a marketing",
      speedTitle: "Co by AI dokázala zrychlit",
      highlightTitle: "Možný efekt",
      highlightText:
        "Méně ztracených návštěvníků, více kvalifikovaných poptávek a lepší přehled o tom, co potenciální zákazníci na webu reálně potřebují.",
      topicsLabel: "Otázky",
      frictionLabel: "Váhání",
      opportunitiesLabel: "Leady",
      signalsLabel: "Témata",
      impactLabels: ["Největší dopad", "Silný dopad", "Skrytá ztráta"],
      callTitle: "Další krok",
      callDescription:
        "Pokud to chcete projít rychleji, krátký 10 až 15min call stačí na výsledek, priority i další doporučení.",
      callButtonLabel: "Domluvit krátký call",
      formButtonLabel: "Poslat kontakt / získat návrh",
      formHelper: "Nebo pošlete kontakt přes formulář níže a připravím konkrétní návrh.",
    };
  }

  return {
    cardTitle: "Ukážka dashboardu po nasadení AI vrstvy",
    previewBadge: "Preview po nasadení",
    previewSubtitle:
      "Simulácia podľa štruktúry a obsahu vášho webu. Nejde o aktuálne dáta, ale o ukážku toho, čo by ste po nasadení AI vrstvy mohli sledovať.",
    previewNote:
      "Obsah vychádza zo štruktúry a signálov na webe a ukazuje, čo by ste vedeli sledovať v dashboarde po nasadení AI vrstvy.",
    topQuestionsTitle: "Čo návštevníci najčastejšie hľadajú",
    topQuestionsEyebrow: "Top otázky a témy",
    topIntentsTitle: "Najčastejšie zámery návštevníkov",
    topIntentsEyebrow: "Kam smeruje ich pozornosť",
    frictionTitle: "Kde dnes pravdepodobne strácate zákazníkov",
    capturedTitle: "Aké dopyty by AI vedela zachytiť",
    insightsTitle: "Aké informácie získate navyše",
    salesTitle: "Prehľadný dashboard pre obchod a marketing",
    speedTitle: "Čo by AI vedela zrýchliť",
    highlightTitle: "Možný efekt",
    highlightText:
      "Menej stratených návštevníkov, viac kvalifikovaných dopytov a lepší prehľad o tom, čo potenciálni zákazníci na webe reálne potrebujú.",
    topicsLabel: "Témy",
    frictionLabel: "Miesta úniku",
    opportunitiesLabel: "Obchodné príležitosti",
    signalsLabel: "Silné signály",
    impactLabels: ["Najväčší dopad", "Silný dopad", "Skrytá strata"],
    callTitle: "Ďalší krok",
    callDescription:
      "Ak to chcete prejsť rýchlejšie, krátky 10 až 15 min call stačí na výsledok, priority aj ďalšie odporúčanie.",
    callButtonLabel: "Dohodnúť krátky call",
    formButtonLabel: "Poslať kontakt / získať návrh",
    formHelper: "Alebo pošlite kontakt cez formulár nižšie a pripravím konkrétny návrh.",
  };
}

function getStructuredDashboardQuestions() {
  return [
    "Hľadá konkrétnu ponuku alebo službu",
    "Chce sa poradiť pred odoslaním dopytu",
    "Nevie, ktorý ďalší krok je správny",
  ];
}

function getStructuredDashboardIntents() {
  return [
    { label: "Silný záujem", value: "Vysoký" },
    { label: "Potreba poradenstva", value: "Časté" },
    { label: "Nejasný ďalší krok", value: "Viditeľné" },
  ];
}

function getStructuredDashboardSalesItems() {
  return [
    "Najčastejšie otázky",
    "Stránky, kde ľudia váhajú",
    "Témy s najväčším potenciálom",
  ];
}

function inferStructuredDashboardArchetype(audit: SiteAudit) {
  const haystack = [audit.site_type, audit.summary, ...audit.recommended_ai_type].join(" ").toLowerCase();

  if (/(realit|reality|nehnutel|nehnuteľ|property|byt|domov)/.test(haystack)) {
    return "real_estate";
  }

  if (/(hypot|poist|finan|uver|úver|loan|mortgage|insurance)/.test(haystack)) {
    return "finance";
  }

  if (/(shop|e-shop|eshop|produkt|katal|marketplace|rental|obchod)/.test(haystack)) {
    return "catalog";
  }

  return "generic";
}

function getStructuredDashboardCapturedPrompts(audit: SiteAudit) {
  const archetype = inferStructuredDashboardArchetype(audit);

  if (archetype === "real_estate") {
    return [
      "Hľadám 3-izbový byt v Bratislave do 320 000 €.",
      "Chcem predať byt a neviem, aký je postup.",
      "Zaujíma ma novostavba s parkovaním.",
    ];
  }

  if (archetype === "finance") {
    return [
      "Chcem znížiť splátku hypotéky.",
      "Neviem, či potrebujem refinancovanie alebo novú hypotéku.",
      "Potrebujem poradiť s ďalším krokom podľa svojej situácie.",
    ];
  }

  if (archetype === "catalog") {
    return [
      "Potrebujem vybrať vhodný produkt podľa použitia a rozpočtu.",
      "Hľadám variant, ktorý mi bude stačiť a nechcem preplatiť.",
      "Chcem rýchlo zistiť, čo je pre mňa najvhodnejšie.",
    ];
  }

  return [
    "Hľadám riešenie, ktoré sa hodí pre môj prípad.",
    "Potrebujem rýchlo zistiť cenu alebo rozpočet.",
    "Chcem sa dostať k správnej osobe alebo ďalšiemu kroku.",
  ];
}

function getStructuredLeadMeta(audit: SiteAudit, locale: SiteLocale) {
  const archetype = inferStructuredDashboardArchetype(audit);

  if (locale === "cs") {
    if (archetype === "real_estate") {
      return ["rozpočet", "lokalita", "typ nemovitosti"];
    }

    if (archetype === "finance") {
      return ["výše splátky", "typ řešení", "čas rozhodnutí"];
    }

    if (archetype === "catalog") {
      return ["rozpočet", "použití", "typ produktu"];
    }

    return ["co člověk řeší", "rozpočet / lokalita / typ služby", "kontakt pro obchod"];
  }

  if (archetype === "real_estate") {
    return ["rozpočet", "lokalita", "typ nehnuteľnosti"];
  }

  if (archetype === "finance") {
    return ["výška splátky", "typ riešenia", "čas rozhodnutia"];
  }

  if (archetype === "catalog") {
    return ["rozpočet", "použitie", "typ produktu"];
  }

  return ["čo človek rieši", "rozpočet / lokalita / typ služby", "kontakt pre obchod"];
}

function getResolvedLoadingSteps(locale: SiteLocale, steps: ReadonlyArray<string>) {
  if (steps.length === 0) {
    return [];
  }

  const resolved = [...steps];
  resolved[resolved.length - 1] =
    locale === "cs"
      ? "Připravujeme ukázku AI vrstvy a dashboardu. Může to trvat přibližně 15 sekund."
      : "Pripravujeme ukážku AI vrstvy a dashboardu. Môže to trvať približne 15 sekúnd.";

  return resolved;
}

function getSalesDashboardCopy(locale: SiteLocale): SalesDashboardCopy {
  if (locale === "cs") {
    return {
      eyebrow: "AI dashboard preview",
      cardTitle: "Ukážka dashboardu: co byste o zákaznících konečně viděli",
      previewSubtitle:
        "Simulace podle typu a obsahu vašeho webu. Nejde o aktuální data, ale o ukázku toho, jaké signály by AI vrstva dokázala sbírat přímo z návštěvníků.",
      callTitle: "Další krok",
      callDescription:
        "Pokud to chcete projít rychleji, nechte nám kontakt a preferovaný čas. Ozveme se vám s krátkým návrhem, kde by AI vrstva dávala největší smysl.",
      callButtonLabel: "Požádat o krátký call",
      formButtonLabel: "Poslat kontakt / získat návrh",
      formHelper: "Nebo pošlete kontakt přes formulář níže a připravím konkrétní návrh.",
    };
  }

  return {
    eyebrow: "AI dashboard preview",
    cardTitle: "Ukážka dashboardu: čo by ste o zákazníkoch konečne videli",
    previewSubtitle:
      "Simulácia podľa typu a obsahu vášho webu. Nejde o aktuálne dáta, ale o ukážku toho, aké signály by AI vrstva vedela zbierať priamo z návštevníkov.",
    callTitle: "Ďalší krok",
    callDescription:
      "Ak to chcete prejsť rýchlejšie, nechajte nám kontakt a preferovaný čas. Ozveme sa vám s krátkym návrhom, kde by AI vrstva dávala najväčší zmysel.",
    callButtonLabel: "Požiadať o krátky call",
    formButtonLabel: "Poslať kontakt / získať návrh",
    formHelper: "Alebo pošlite kontakt cez formulár nižšie a pripravím konkrétny návrh.",
  };
}

function DashboardWidget({
  title,
  eyebrow,
  children,
  className = "",
}: {
  title: string;
  eyebrow?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-[24px] border border-black/8 bg-black/[0.03] p-5 ${className}`}>
      {eyebrow ? (
        <div className="text-[11px] uppercase tracking-[0.22em] text-neutral-500">{eyebrow}</div>
      ) : null}
      <div className={`text-lg font-medium leading-7 text-neutral-950 ${eyebrow ? "mt-3" : ""}`}>{title}</div>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function DashboardSiteMark({ auditedUrl }: { auditedUrl: string }) {
  const domain = getAuditDomainLabel(auditedUrl);
  const sources = useMemo(
    () => [`https://${domain}/favicon.ico`, `https://www.google.com/s2/favicons?domain=${domain}&sz=128`],
    [domain],
  );
  const [sourceIndex, setSourceIndex] = useState(0);

  return (
    <div className="rounded-[24px] border border-[#86b89f]/18 bg-[linear-gradient(180deg,rgba(250,253,251,0.92),rgba(240,248,243,0.92))] p-4 shadow-[0_16px_30px_rgba(90,126,111,0.08)]">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-[16px] border border-black/8 bg-white shadow-[0_12px_24px_rgba(17,17,17,0.06)]">
          {sourceIndex < sources.length ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={sources[sourceIndex]}
              alt=""
              className="h-8 w-8 object-contain"
              onError={() => setSourceIndex((current) => current + 1)}
            />
          ) : (
            <span className="text-sm font-semibold tracking-[0.12em] text-neutral-700">
              {getDomainInitials(domain)}
            </span>
          )}
        </div>
        <div>
          <div className="text-[11px] uppercase tracking-[0.22em] text-neutral-500">Auditovaný web</div>
          <div className="mt-1 text-sm font-semibold text-neutral-950">{domain}</div>
        </div>
      </div>
    </div>
  );
}

function AuditDashboardPreview({
  audit,
  auditedUrl,
  locale,
}: {
  audit: SiteAudit;
  auditedUrl: string;
  locale: SiteLocale;
}) {
  const copy = getAuditDashboardCopy(locale);
  const questions = buildDashboardQuestions(audit, locale);
  const intentBars = buildDashboardIntentBars(audit);
  const capturedPrompts = buildDashboardCapturedPrompts(audit, locale);
  const insights = buildDashboardInsights(audit);
  const speedWins = buildDashboardSpeedWins(audit);
  const domain = getAuditDomainLabel(auditedUrl);
  const metricCards = [
    { label: copy.topicsLabel, value: questions.length },
    { label: copy.frictionLabel, value: audit.friction_points.length },
    { label: copy.opportunitiesLabel, value: audit.upsell_opportunities.length },
    { label: copy.signalsLabel, value: audit.example_user_flows.length },
  ];

  return (
    <ResultCard title={copy.cardTitle}>
      <div className="space-y-5">
        <div className="rounded-[24px] border border-[#86b89f]/18 bg-[radial-gradient(circle_at_top_right,rgba(214,238,225,0.52),transparent_34%),linear-gradient(180deg,rgba(252,254,253,0.98),rgba(242,249,245,0.96))] p-5 shadow-[0_18px_44px_rgba(90,126,111,0.08)]">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div className="max-w-2xl">
              <div className="inline-flex items-center rounded-full border border-[#8fb6a8]/36 bg-[#eef7f2] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#355648]">
                {copy.previewBadge}
              </div>
              <p className="mt-4 text-sm leading-6 text-neutral-700">{copy.previewSubtitle}</p>
              <p className="mt-3 text-sm leading-6 text-neutral-500">{copy.previewNote}</p>
            </div>

            <DashboardSiteMark key={auditedUrl} auditedUrl={auditedUrl} />
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {metricCards.map((metric) => (
              <div
                key={metric.label}
                className="rounded-[20px] border border-[#8fb6a8]/18 bg-white/86 px-4 py-4 shadow-[0_12px_24px_rgba(90,126,111,0.05)]"
              >
                <div className="text-[11px] uppercase tracking-[0.22em] text-neutral-500">{metric.label}</div>
                <div className="mt-2 text-3xl font-semibold tracking-[-0.05em] text-neutral-950">
                  {metric.value}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <DashboardWidget title={copy.topQuestionsTitle} eyebrow={copy.topQuestionsEyebrow}>
            <div className="grid gap-3">
              {questions.map((item, index) => (
                <div
                  key={`${item}-${index}`}
                  className="flex items-start gap-3 rounded-[18px] border border-black/8 bg-white/80 px-4 py-3 text-sm leading-6 text-neutral-700"
                >
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#edf7f1] text-[11px] font-semibold text-[#355648]">
                    {index + 1}
                  </span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </DashboardWidget>

          <DashboardWidget title={copy.topIntentsTitle} eyebrow={copy.topIntentsEyebrow}>
            <div className="space-y-4">
              {intentBars.map((item) => (
                <div key={item.label}>
                  <div className="flex items-center justify-between gap-3 text-sm leading-6 text-neutral-700">
                    <span className="max-w-[80%]">{item.label}</span>
                    <span className="font-medium text-neutral-950">{item.value}%</span>
                  </div>
                  <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-black/8">
                    <div
                      className="h-full rounded-full bg-[linear-gradient(90deg,#2f9a68_0%,#b8dfca_100%)]"
                      style={{ width: `${item.value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </DashboardWidget>

          <DashboardWidget title={copy.frictionTitle}>
            <div className="space-y-3">
              {audit.friction_points.slice(0, 3).map((item, index) => (
                <div
                  key={item}
                  className="rounded-[18px] border border-black/8 bg-white/80 px-4 py-4 text-sm leading-6 text-neutral-700"
                >
                  <div className="text-[11px] uppercase tracking-[0.22em] text-neutral-500">
                    {copy.impactLabels[index] ?? copy.impactLabels[2]}
                  </div>
                  <div className="mt-2">{item}</div>
                </div>
              ))}
            </div>
          </DashboardWidget>

          <DashboardWidget title={copy.capturedTitle}>
            <div className="grid gap-3">
              {capturedPrompts.map((item) => (
                <div
                  key={item}
                  className="rounded-[18px] border border-[#8fb6a8]/18 bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(244,250,246,0.92))] px-4 py-4 text-sm leading-6 text-neutral-700"
                >
                  <span className="text-[#355648]">“</span>
                  {item}
                  <span className="text-[#355648]">”</span>
                </div>
              ))}
            </div>
          </DashboardWidget>

          <DashboardWidget title={copy.insightsTitle}>
            <div className="space-y-3">
              {insights.map((item) => (
                <div key={item} className="flex items-start gap-3 text-sm leading-6 text-neutral-700">
                  <span className="mt-2 h-2 w-2 rounded-full bg-[#2f9a68]" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </DashboardWidget>

          <DashboardWidget title={copy.salesTitle}>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-[18px] border border-black/8 bg-white/80 p-4">
                <div className="text-[11px] uppercase tracking-[0.22em] text-neutral-500">{copy.speedTitle}</div>
                <div className="mt-3 space-y-3 text-sm leading-6 text-neutral-700">
                  {speedWins.map((item) => (
                    <div key={item}>{item}</div>
                  ))}
                </div>
              </div>
              <div className="rounded-[18px] border border-[#8fb6a8]/18 bg-[linear-gradient(180deg,rgba(245,251,247,0.96),rgba(235,246,240,0.96))] p-4">
                <div className="text-[11px] uppercase tracking-[0.22em] text-[#5d7c6f]">Lead view</div>
                <div className="mt-3 text-sm leading-6 text-neutral-700">
                  {locale === "cs"
                    ? `Obchod by na jednom místě viděl, co lidé řeší na ${domain}, kdo je nejblíž kontaktu a kde se vyplatí reagovat rychleji.`
                    : `Obchod by na jednom mieste videl, čo ľudia riešia na ${domain}, kto je najbližšie ku kontaktu a kde sa oplatí reagovať rýchlejšie.`}
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-[16px] border border-white/70 bg-white/90 px-3 py-3">
                    <div className="text-[11px] uppercase tracking-[0.2em] text-neutral-500">Score</div>
                    <div className="mt-2 text-2xl font-semibold tracking-[-0.05em] text-neutral-950">
                      {audit.score}/10
                    </div>
                  </div>
                  <div className="rounded-[16px] border border-white/70 bg-white/90 px-3 py-3">
                    <div className="text-[11px] uppercase tracking-[0.2em] text-neutral-500">
                      {copy.signalsLabel}
                    </div>
                    <div className="mt-2 text-2xl font-semibold tracking-[-0.05em] text-neutral-950">
                      {audit.example_user_flows.length}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </DashboardWidget>
        </div>
      </div>
    </ResultCard>
  );
}

function StructuredAuditDashboardPreview({
  audit,
  auditedUrl,
  locale,
}: {
  audit: SiteAudit;
  auditedUrl: string;
  locale: SiteLocale;
}) {
  const copy = getStructuredDashboardCopy(locale);
  const questions = getStructuredDashboardQuestions();
  const intentBars = getStructuredDashboardIntents();
  const capturedPrompts = getStructuredDashboardCapturedPrompts(audit);
  const leadMeta = getStructuredLeadMeta(audit, locale);
  const salesItems = getStructuredDashboardSalesItems();
  const sampleLead = capturedPrompts[0] ?? "";
  const metricCards = [
    { label: copy.topicsLabel, value: questions.length },
    { label: copy.frictionLabel, value: salesItems.length },
    { label: copy.opportunitiesLabel, value: capturedPrompts.length },
    { label: copy.signalsLabel, value: intentBars.length },
  ];

  return (
    <ResultCard title={copy.cardTitle}>
      <div className="space-y-4">
        <div className="rounded-[24px] border border-[#86b89f]/18 bg-[radial-gradient(circle_at_top_right,rgba(214,238,225,0.52),transparent_34%),linear-gradient(180deg,rgba(252,254,253,0.98),rgba(242,249,245,0.96))] p-5 shadow-[0_18px_44px_rgba(90,126,111,0.08)]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="max-w-2xl">
              <div className="inline-flex items-center rounded-full border border-[#8fb6a8]/36 bg-[#eef7f2] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#355648]">
                {copy.previewBadge}
              </div>
              <p className="mt-4 text-sm leading-6 text-neutral-700">{copy.previewSubtitle}</p>
            </div>

            <DashboardSiteMark key={auditedUrl} auditedUrl={auditedUrl} />
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <DashboardWidget title={copy.topQuestionsTitle} className="h-full">
            <div className="grid gap-3">
              {questions.map((item, index) => (
                <div
                  key={`${item}-${index}`}
                  className="rounded-[18px] border border-black/8 bg-white/80 px-4 py-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm leading-6 text-neutral-800">{item}</span>
                    <span className="rounded-full border border-[#8fb6a8]/30 bg-[#eef7f2] px-2.5 py-1 text-[11px] font-medium text-[#355648]">
                      {intentBars[index]?.value ?? "Aktívne"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </DashboardWidget>

          <DashboardWidget title={copy.topIntentsTitle} className="h-full">
            <div className="rounded-[20px] border border-[#8fb6a8]/18 bg-[linear-gradient(180deg,rgba(245,251,247,0.96),rgba(235,246,240,0.96))] p-4 shadow-[0_12px_24px_rgba(90,126,111,0.06)]">
              <div className="text-[11px] uppercase tracking-[0.22em] text-[#5d7c6f]">
                {copy.topIntentsEyebrow}
              </div>
              <div className="mt-3 text-sm leading-6 text-neutral-800">{sampleLead}</div>
              <div className="mt-4 flex flex-wrap gap-2">
                {leadMeta.map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-white/70 bg-white/90 px-3 py-1.5 text-[11px] font-medium text-neutral-700"
                  >
                    {item}
                  </span>
                ))}
              </div>
              <div className="mt-4 rounded-[16px] border border-white/70 bg-white/90 px-4 py-3 text-sm leading-6 text-neutral-700">
                {locale === "cs"
                  ? "Kontakt připravený pro obchodní tým s jasným kontextem, prioritou a dalším krokem."
                  : "Kontakt pripravený pre obchodný tím s jasným kontextom, prioritou a ďalším krokom."}
              </div>
            </div>
          </DashboardWidget>

          <DashboardWidget title={copy.frictionTitle} className="h-full">
            <div className="grid gap-3">
              {salesItems.map((item, index) => (
                <div
                  key={`${item}-${index}`}
                  className="rounded-[18px] border border-black/8 bg-white/80 px-4 py-4"
                >
                  <div className="text-[11px] uppercase tracking-[0.2em] text-neutral-500">
                    {metricCards[index]?.label ?? copy.signalsLabel}
                  </div>
                  <div className="mt-2 text-sm leading-6 text-neutral-800">{item}</div>
                </div>
              ))}
            </div>
          </DashboardWidget>
        </div>

        <div className="rounded-[20px] border border-[#8fb6a8]/18 bg-[linear-gradient(180deg,rgba(245,251,247,0.96),rgba(235,246,240,0.96))] p-5 shadow-[0_14px_28px_rgba(90,126,111,0.06)]">
          <div className="text-[11px] uppercase tracking-[0.22em] text-[#5d7c6f]">{copy.highlightTitle}</div>
          <div className="mt-3 text-sm leading-6 text-neutral-700">{copy.highlightText}</div>
        </div>
      </div>
    </ResultCard>
  );
}

function SalesAuditDashboardPreview({
  audit,
  auditedUrl,
  locale,
}: {
  audit: SiteAudit;
  auditedUrl: string;
  locale: SiteLocale;
}) {
  const copy = getSalesDashboardCopy(locale);
  const preview = getDashboardPreviewCopy(audit, auditedUrl, locale);

  return (
    <ResultCard title={copy.eyebrow}>
      <div className="space-y-4">
        <div className="rounded-[24px] border border-[#86b89f]/18 bg-[radial-gradient(circle_at_top_right,rgba(214,238,225,0.52),transparent_34%),linear-gradient(180deg,rgba(252,254,253,0.98),rgba(242,249,245,0.96))] p-5 shadow-[0_18px_44px_rgba(90,126,111,0.08)]">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex items-center rounded-full border border-[#8fb6a8]/36 bg-[#eef7f2] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#355648]">
                {preview.previewBadge}
              </div>
              <h3 className="mt-4 text-[1.9rem] font-semibold leading-tight tracking-[-0.04em] text-neutral-950 sm:text-[2.2rem]">
                {copy.cardTitle}
              </h3>
              <p className="mt-4 max-w-3xl text-sm leading-6 text-neutral-700">{copy.previewSubtitle}</p>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-neutral-500">{preview.previewNote}</p>
            </div>

            <div className="w-full max-w-sm space-y-3 xl:flex-shrink-0">
              <DashboardSiteMark key={auditedUrl} auditedUrl={auditedUrl} />
              <div className="flex flex-wrap gap-2">
                <div className="rounded-full border border-black/8 bg-white/72 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-600">
                  {preview.simulatedBadge}
                </div>
                <div className="rounded-full border border-[#8fb6a8]/30 bg-[#eef7f2] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#355648]">
                  {preview.segmentLabel}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {preview.metrics.map((metric) => (
              <div
                key={metric.label}
                className="rounded-[20px] border border-[#8fb6a8]/18 bg-white/88 px-4 py-4 shadow-[0_12px_24px_rgba(90,126,111,0.05)]"
              >
                <div className="text-[11px] uppercase tracking-[0.22em] text-neutral-500">{metric.label}</div>
                <div className="mt-2 text-xl font-semibold leading-7 tracking-[-0.04em] text-neutral-950">
                  {metric.value}
                </div>
                <div className="mt-2 text-sm leading-6 text-neutral-500">{metric.hint}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-[24px] border border-black/8 bg-black/[0.03] p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-[11px] uppercase tracking-[0.22em] text-neutral-500">{preview.leadTableTitle}</div>
                <div className="mt-2 text-sm leading-6 text-neutral-600">{preview.leadTableCaption}</div>
              </div>
            </div>

            <div className="mt-5 rounded-[20px] border border-black/8 bg-white/90">
              <div className="hidden border-b border-black/8 px-4 py-3 md:grid md:grid-cols-[minmax(0,0.95fr)_minmax(0,1.35fr)_minmax(132px,0.72fr)_minmax(0,1.05fr)] md:gap-4 md:text-[11px] md:font-semibold md:uppercase md:tracking-[0.18em] md:text-neutral-500">
                <div>{preview.leadColumnLabels.intent}</div>
                <div>{preview.leadColumnLabels.detail}</div>
                <div>{preview.leadColumnLabels.quality}</div>
                <div>{preview.leadColumnLabels.nextStep}</div>
              </div>
              <div>
                {preview.leadRows.map((row, index) => (
                  <div
                    key={`${row.intent}-${index}`}
                    className="grid gap-4 border-b border-black/6 px-4 py-4 text-sm leading-6 text-neutral-700 last:border-b-0 md:grid-cols-[minmax(0,0.95fr)_minmax(0,1.35fr)_minmax(132px,0.72fr)_minmax(0,1.05fr)] md:items-start"
                  >
                    <div className="grid gap-1">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500 md:hidden">
                        {preview.leadColumnLabels.intent}
                      </div>
                      <div className="break-words font-medium text-neutral-950">{row.intent}</div>
                    </div>
                    <div className="grid gap-1">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500 md:hidden">
                        {preview.leadColumnLabels.detail}
                      </div>
                      <div className="break-words">{row.detail}</div>
                    </div>
                    <div className="grid gap-1">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500 md:hidden">
                        {preview.leadColumnLabels.quality}
                      </div>
                      <div>
                        <DashboardQualityBadge quality={row.quality} label={row.qualityLabel} />
                      </div>
                    </div>
                    <div className="grid gap-1">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500 md:hidden">
                        {preview.leadColumnLabels.nextStep}
                      </div>
                      <div className="break-words">{row.nextStep}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <DashboardWidget title={preview.questionTitle} className="h-full">
              <div className="grid gap-3">
                {preview.questionItems.map((item, index) => (
                  <div
                    key={`${item}-${index}`}
                    className="rounded-[18px] border border-[#8fb6a8]/18 bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(244,250,246,0.92))] px-4 py-4 text-sm leading-6 text-neutral-700"
                  >
                    <span className="break-words"><span className="text-[#355648]">{index + 1}.</span> {item}</span>
                  </div>
                ))}
              </div>
            </DashboardWidget>

            <DashboardWidget title={preview.intentTitle} className="h-full">
              <div className="space-y-4">
                {preview.intentItems.map((item) => (
                  <div key={item.label}>
                    <div className="flex items-center justify-between gap-3 text-sm leading-6 text-neutral-700">
                      <span className="max-w-[78%]">{item.label}</span>
                      <span className="font-medium text-neutral-950">{item.value}%</span>
                    </div>
                    <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-black/8">
                      <div
                        className="h-full rounded-full bg-[linear-gradient(90deg,#2f9a68_0%,#b8dfca_100%)]"
                        style={{ width: `${item.value}%` }}
                      />
                    </div>
                    <div className="mt-2 text-xs leading-5 text-neutral-500">{item.hint}</div>
                  </div>
                ))}
              </div>
            </DashboardWidget>
          </div>
        </div>

        <DashboardWidget title={preview.insightsTitle}>
          <div className="grid gap-3 lg:grid-cols-2">
            {preview.insights.map((item, index) => (
              <div
                key={`${item}-${index}`}
                className="flex items-start gap-3 rounded-[18px] border border-black/8 bg-white/82 px-4 py-4 text-sm leading-6 text-neutral-700"
              >
                <span className="mt-2 h-2 w-2 rounded-full bg-[#2f9a68]" />
                <span className="break-words">{item}</span>
              </div>
            ))}
          </div>
        </DashboardWidget>

        <div className="grid gap-4 lg:grid-cols-2">
          <DashboardWidget title={preview.reasonsTitle} className="h-full">
            <div className="grid gap-3">
              {preview.reasons.map((item, index) => (
                <div
                  key={`${item}-${index}`}
                  className="flex items-start gap-3 rounded-[18px] border border-black/8 bg-white/80 px-4 py-4 text-sm leading-6 text-neutral-700"
                >
                  <span className="mt-2 h-2 w-2 rounded-full bg-[#2f9a68]" />
                  <span className="break-words">{item}</span>
                </div>
              ))}
            </div>
          </DashboardWidget>

          <DashboardWidget title={preview.nextStepsTitle} className="h-full">
            <div className="grid gap-3">
              {preview.nextSteps.map((item, index) => (
                <div
                  key={`${item}-${index}`}
                  className="flex items-start gap-3 rounded-[18px] border border-black/8 bg-white/80 px-4 py-4 text-sm leading-6 text-neutral-700"
                >
                  <span className="mt-2 h-2 w-2 rounded-full bg-[#2f9a68]" />
                  <span className="break-words">{item}</span>
                </div>
              ))}
            </div>
          </DashboardWidget>
        </div>

        <div className="rounded-[20px] border border-[#8fb6a8]/18 bg-[linear-gradient(180deg,rgba(245,251,247,0.96),rgba(235,246,240,0.96))] p-5 shadow-[0_14px_28px_rgba(90,126,111,0.06)]">
          <div className="text-[11px] uppercase tracking-[0.22em] text-[#5d7c6f]">{preview.highlightTitle}</div>
          <div className="mt-3 text-sm leading-6 text-neutral-700">{preview.highlightText}</div>
        </div>
      </div>
    </ResultCard>
  );
}

function DashboardQualityBadge({
  quality,
  label,
}: {
  quality: "high" | "medium" | "low";
  label: string;
}) {
  const palette =
    quality === "high"
      ? "border-emerald-300 bg-emerald-50 text-emerald-900"
      : quality === "medium"
        ? "border-amber-300 bg-amber-50 text-amber-900"
        : "border-black/10 bg-black/[0.03] text-neutral-700";

  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${palette}`}>
      {label}
    </span>
  );
}

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
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-[28px] border border-black/8 bg-white/78 p-6 shadow-[0_16px_50px_rgba(17,17,17,0.05)] ${className}`}>
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
  const resolvedLoadingSteps = useMemo(
    () => getResolvedLoadingSteps(locale, copy.loadingSteps.length > 0 ? copy.loadingSteps : defaults.loadingSteps),
    [copy.loadingSteps, defaults.loadingSteps, locale],
  );
  const previewSteps = resolvedLoadingSteps;
  const previewIdleStepsResolved = previewIdleSteps ?? [];
  const dashboardCopy = useMemo(() => getSalesDashboardCopy(locale), [locale]);

  const [url, setUrl] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const [errorSuggestion, setErrorSuggestion] = useState<AuditErrorSuggestion | null>(null);
  const [audit, setAudit] = useState<SiteAudit | null>(null);
  const [loadingIndex, setLoadingIndex] = useState(0);
  const [auditedUrl, setAuditedUrl] = useState("");
  const [activeLeadForm, setActiveLeadForm] = useState<AuditLeadFormVariant | null>(null);
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
        if (current >= resolvedLoadingSteps.length - 1) {
          return current;
        }

        return current + 1;
      });
    }, AUDIT_LOADING_STEP_INTERVAL_MS);

    return () => window.clearInterval(interval);
  }, [resolvedLoadingSteps.length, status]);

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
    const minimumLoadingPromise = waitForDuration(
      getMinimumAuditLoadingDuration(resolvedLoadingSteps.length),
    );

    setStatus("loading");
    setError("");
    setErrorSuggestion(null);
    setAudit(null);
    setAuditedUrl("");
    setActiveLeadForm(null);
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

      await minimumLoadingPromise;

      if (!response.ok || !payload?.audit) {
        const blockedErrorType = getBlockedAuditErrorType(payload);
        const errorMessage = blockedErrorType
          ? getCrawlerBlockedMessage(locale)
          : payload?.message ?? payload?.error ?? getGenericAuditErrorMessage(locale);

        setStatus("error");
        setAudit(null);
        setError(errorMessage);
        setErrorSuggestion(blockedErrorType ? null : payload?.suggestion ?? null);
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
      await minimumLoadingPromise;
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
    setActiveLeadForm("proposal");
  };

  const handleRequestCall = () => {
    setActiveLeadForm("call");
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
          <div className="mx-auto mt-6 grid max-w-4xl gap-3 md:grid-cols-2 xl:grid-cols-4">
            {resolvedLoadingSteps.map((step, index) => (
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
              {resolvedLoadingSteps[loadingIndex]}
            </div>
            <div className="mt-6 space-y-3">
              {resolvedLoadingSteps.map((step, index) => (
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
              <ResultCard title={copy.upsellTitle} className="lg:col-span-2">
                <ResultList items={audit.upsell_opportunities} />
              </ResultCard>
            </div>

            <SalesAuditDashboardPreview audit={audit} auditedUrl={auditedUrl} locale={locale} />

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
                <p className="mt-3 text-sm leading-6 text-white/60">{dashboardCopy.callDescription}</p>
              </div>

              <div className="mt-6 flex w-full max-w-md flex-col gap-3 sm:mt-0">
                <div className="text-[11px] uppercase tracking-[0.22em] text-white/55">
                  {dashboardCopy.callTitle}
                </div>
                <button
                  type="button"
                  onClick={handleRequestCall}
                  className="inline-flex items-center justify-center rounded-[20px] border border-white bg-white px-6 py-4 text-sm font-medium text-black hover:bg-neutral-200"
                >
                  {dashboardCopy.callButtonLabel}
                </button>
                <button
                  type="button"
                  onClick={handleRequestProposal}
                  className="rounded-[20px] border border-white/16 bg-white/8 px-6 py-4 text-sm font-medium text-white hover:bg-white/14"
                >
                  {dashboardCopy.formButtonLabel ?? copy.proposalButtonLabel}
                </button>
                <div className="text-sm leading-6 text-white/60">{dashboardCopy.formHelper}</div>
              </div>
            </div>

            {activeLeadForm ? (
              <LeadCaptureForm
                locale={locale}
                source="audit_result"
                variant={activeLeadForm === "call" ? "call" : "audit"}
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
