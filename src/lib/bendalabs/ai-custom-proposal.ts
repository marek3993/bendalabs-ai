import { englishProposal } from "./ai-custom-proposal.en";
import { z } from "zod";
import { getNormalizedDomainFromUrl } from "@/lib/leads/domain-utils";
import { normalizeWebsiteUrl } from "@/lib/site-audit/url";

export const AI_CUSTOM_PROPOSAL_PATH = "/ai-navrh-na-mieru";
export const AI_CUSTOM_PROPOSAL_REQUEST_TYPE = "ai_custom_proposal";
export const AI_CUSTOM_PROPOSAL_SOURCE = "ai_navrh_na_mieru";

export const businessTypeOptions = [
  { value: "real_estate", label: "Realitný web / realitná kancelária" },
  { value: "finance", label: "Finančné služby / poistenie / hypotéky" },
  { value: "clinic", label: "Klinika / zdravotné alebo estetické služby" },
  { value: "marketplace", label: "Inzertný alebo marketplace portál" },
  { value: "recruitment", label: "Recruitment / HR / pracovný portál" },
  { value: "b2b_services", label: "B2B služby / poradenstvo" },
  { value: "ecommerce", label: "E-shop alebo katalóg produktov" },
  { value: "other", label: "Iné" },
] as const;

export const mainGoalOptions = [
  {
    value: "choose_right_offer",
    label: "Pomôcť návštevníkovi vybrať správnu službu alebo ponuku",
  },
  { value: "better_leads", label: "Získať lepšie pripravené dopyty" },
  { value: "simplify_contact", label: "Zjednodušiť objednanie alebo kontakt" },
  { value: "discover_intent", label: "Zistiť, čo ľudia na webe reálne hľadajú" },
  { value: "reduce_unclear_questions", label: "Znížiť počet nejasných otázok pre tím/recepciu" },
  { value: "increase_existing_traffic_value", label: "Zvýšiť hodnotu existujúcej návštevnosti" },
  { value: "other", label: "Iné" },
] as const;

export const visitorNextStepOptions = [
  { value: "send_inquiry", label: "Odoslať dopyt" },
  { value: "book_appointment", label: "Objednať termín" },
  { value: "choose_service", label: "Vybrať službu" },
  { value: "find_offer", label: "Nájsť vhodnú ponuku / inzerát / produkt" },
  { value: "contact_right_person", label: "Kontaktovať správneho človeka" },
  { value: "fill_form", label: "Vyplniť formulár" },
  { value: "other", label: "Iné" },
] as const;

export const dashboardDataOptions = [
  { value: "top_questions", label: "Najčastejšie otázky návštevníkov" },
  { value: "interest_types", label: "Typy služieb / produktov / ponúk, o ktoré je záujem" },
  { value: "contact_reasons", label: "Dôvody, prečo ľudia kontaktujú firmu" },
  { value: "unfinished_inquiries", label: "Neodoslané alebo nedokončené dopyty" },
  { value: "lead_quality", label: "Kvalita leadov / dopytov" },
  { value: "timing_or_urgency", label: "Preferované termíny alebo urgentnosť" },
  { value: "customer_segments", label: "Segmenty zákazníkov" },
  { value: "other", label: "Iné" },
] as const;

const businessTypeValues = [
  "real_estate",
  "finance",
  "clinic",
  "marketplace",
  "recruitment",
  "b2b_services",
  "ecommerce",
  "other",
] as const;
const mainGoalValues = [
  "choose_right_offer",
  "better_leads",
  "simplify_contact",
  "discover_intent",
  "reduce_unclear_questions",
  "increase_existing_traffic_value",
  "other",
] as const;
const visitorNextStepValues = [
  "send_inquiry",
  "book_appointment",
  "choose_service",
  "find_offer",
  "contact_right_person",
  "fill_form",
  "other",
] as const;
const dashboardDataValues = [
  "top_questions",
  "interest_types",
  "contact_reasons",
  "unfinished_inquiries",
  "lead_quality",
  "timing_or_urgency",
  "customer_segments",
  "other",
] as const;

export type AiCustomProposalBusinessType = (typeof businessTypeValues)[number];
export type AiCustomProposalMainGoal = (typeof mainGoalValues)[number];
export type AiCustomProposalVisitorNextStep = (typeof visitorNextStepValues)[number];
export type AiCustomProposalDashboardData = (typeof dashboardDataValues)[number];

export type AiCustomProposalSubmission = {
  locale: "sk" | "cs" | "en";
  website: string;
  businessType: AiCustomProposalBusinessType;
  mainGoal: AiCustomProposalMainGoal;
  visitorNextStep: AiCustomProposalVisitorNextStep;
  opportunityText: string;
  dashboardData: AiCustomProposalDashboardData[];
  successMetric: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  normalizedDomain: string;
};

export type AiCustomProposalRecommendation = {
  summary: string;
  recommendedLayerTitle: string;
  visitorValue: string[];
  teamValue: string[];
  dashboardValue: string[];
  phaseOne: string[];
  nextStep: string;
};

function normalizeOptionArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string");
}

function normalizeOptionalText(value: string | null | undefined) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeWebsiteValue(value: string, context: z.RefinementCtx) {
  const normalizedValue = normalizeWebsiteUrl(value);

  if (!normalizedValue) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["website"],
      message: "invalid_website",
    });

    return z.NEVER;
  }

  return normalizedValue;
}

function getOptionLabel<T extends { value: string; label: string }>(options: readonly T[], value: string) {
  return options.find((item) => item.value === value)?.label ?? value;
}

function joinHumanList(items: readonly string[]) {
  if (items.length <= 1) {
    return items[0] ?? "";
  }

  if (items.length === 2) {
    return `${items[0]} a ${items[1]}`;
  }

  return `${items.slice(0, -1).join(", ")} a ${items[items.length - 1]}`;
}

function getBusinessLens(value: AiCustomProposalBusinessType) {
  const lenses: Record<
    AiCustomProposalBusinessType,
    {
      audienceTarget: string;
      teamOutput: string;
      suggestion: string;
      phaseEntry: string;
    }
  > = {
    real_estate: {
      audienceTarget: "správnu ponuku, inzerát alebo maklera",
      teamOutput: "presnejšie realitné dopyty a jasnejší kontext pred kontaktom",
      suggestion: "AI vrstva pre výber ponuky a prípravu kvalitnejšieho dopytu",
      phaseEntry: "na homepage, listingoch alebo pri dopytovom formulári",
    },
    finance: {
      audienceTarget: "správne finančné riešenie alebo ďalší konzultačný krok",
      teamOutput: "lepšie pripravené dopyty pre obchod a menej všeobecných otázok",
      suggestion: "AI vrstva pre výber správnej služby a kvalifikáciu dopytu",
      phaseEntry: "na produktových vetvách, kalkulačkách alebo pred formulárom",
    },
    clinic: {
      audienceTarget: "správnu službu, zakrok alebo termín",
      teamOutput: "menej nejasných otázok pre recepciu a viac pripravených objednaní",
      suggestion: "AI vrstva pre výber služby a zjednodušenie objednania",
      phaseEntry: "na stránkach služieb alebo pred objednaním termínu",
    },
    marketplace: {
      audienceTarget: "správnu ponuku, inzerát alebo kategóriu",
      teamOutput: "viac relevantných dopytov a lepšie obchodné dáta o záujme",
      suggestion: "AI vrstva pre výber správnej ponuky a ďalšieho kroku",
      phaseEntry: "nad katalógom, vyhľadávaním alebo pri detailoch ponúk",
    },
    recruitment: {
      audienceTarget: "správnu pozíciu, službu alebo kontakt",
      teamOutput: "lepšie kvalifikované leady od firiem aj kandidátov",
      suggestion: "AI vrstva pre smerovanie návštevníka a prípravu dopytu",
      phaseEntry: "na kariérnych stránkach, pri kontaktných bodoch alebo formulároch",
    },
    b2b_services: {
      audienceTarget: "správnu službu, konzultáciu alebo ďalší krok",
      teamOutput: "čistejšie leady s kontextom a jasnejším zadaním",
      suggestion: "AI vrstva pre výber služby a lepšie pripravený dopyt",
      phaseEntry: "na kľúčových službových stránkach alebo pred kontaktom",
    },
    ecommerce: {
      audienceTarget: "správny produkt, kategóriu alebo formulár",
      teamOutput: "vyššiu hodnotu existujúcej návštevnosti a menej opakujúcich sa otázok",
      suggestion: "AI vrstva pre výber produktu a odporúčanie ďalšieho kroku",
      phaseEntry: "na kategóriách, detailoch produktov alebo v kontaktnom flowe",
    },
    other: {
      audienceTarget: "správny ďalší krok bez zbytočného hľadania",
      teamOutput: "lepšie pripravený inbound a nové obchodné dáta",
      suggestion: "AI vrstva pre smerovanie návštevníka a prípravu kvalitnejšieho dopytu",
      phaseEntry: "na miestach, kde sa dnes rozhoduje o ďalšom kroku",
    },
  };

  return lenses[value];
}

function getGoalLens(value: AiCustomProposalMainGoal) {
  const lenses: Record<
    AiCustomProposalMainGoal,
    {
      title: string;
      visitorLine: string;
      teamLine: string;
      phaseLine: string;
    }
  > = {
    choose_right_offer: {
      title: "AI vrstva pre výber správnej služby alebo ponuky",
      visitorLine: "Pomohla by človeku rýchlo sa zorientovať a netlačiť ho do nesprávnej vetvy webu.",
      teamLine: "Do tímu by chodili ľudia, ktorí už vedia, o akú oblasť majú záujem.",
      phaseLine: "Nastaviť otázky, ktoré rýchlo rozlišujú, čo je pre návštevníka najrelevantnejšie.",
    },
    better_leads: {
      title: "AI vrstva pre lepšie pripravené dopyty",
      visitorLine: "Pred odoslaním by doplnila dôležitý kontext a pomohla človeku spresniť potrebu.",
      teamLine: "Váš tím by dostával lepšie pripravené dopyty namiesto všeobecných správ.",
      phaseLine: "Prepojiť výstup z otázok priamo do dopytu, aby ostal zachovaný kontext.",
    },
    simplify_contact: {
      title: "AI vrstva pre zjednodušenie objednania alebo kontaktu",
      visitorLine: "Skratila by cestu od prvého záujmu k objednaniu alebo kontaktu.",
      teamLine: "Znížil by sa počet odchodov pred formulárom alebo pred objednaním termínu.",
      phaseLine: "Nasadiť vrstvu pred kľúčový kontakt alebo objednávkový krok.",
    },
    discover_intent: {
      title: "AI vrstva pre zachytenie zámerov návštevníkov",
      visitorLine: "Návštevník by sa dostal k správnej ponuke a vy by ste zároveň videli, čo reálne hľadá.",
      teamLine: "Vznikli by nové obchodné dáta o témach, záujmoch a miestach, kde ľudia váhajú.",
      phaseLine: "Zachytávať intent a odkladať ho do dashboardu zámerov bez prerábky existujúceho webu.",
    },
    reduce_unclear_questions: {
      title: "AI vrstva pre odfiltrovanie nejasných otázok",
      visitorLine: "Najskôr by vysvetlila rozdiely a až potom poslala človeka na kontakt alebo formulár.",
      teamLine: "Tím by mal menej opakujúcich sa otázok a viac pripravených kontaktov.",
      phaseLine: "Najprv pokryť najčastejšie nejasné otázky a routovanie na správny ďalší krok.",
    },
    increase_existing_traffic_value: {
      title: "AI vrstva pre vyššiu hodnotu existujúcej návštevnosti",
      visitorLine: "Viac ľudí by sa z existujúcej návštevnosti dostalo k správnemu ďalšiemu kroku.",
      teamLine: "Z webu by ste vyťažili viac bez prerábky existujúceho webu.",
      phaseLine: "Vybrať jedno miesto s návštevnosťou a vysokým rozhodovacím trením a nasadiť tam prvú fázu.",
    },
    other: {
      title: "AI vrstva prispôsobená vášmu cieľu",
      visitorLine: "Priblížila by návštevníka k ďalšiemu kroku podľa toho, čo chce naozaj vyriešiť.",
      teamLine: "Tímu by pridala lepší kontext a nové obchodné dáta o záujme návštevníkov.",
      phaseLine: "Začal by sa jeden úzky flow, kde sa najrýchlejšie ukáže dopad.",
    },
  };

  return lenses[value];
}

function getNextStepLens(value: AiCustomProposalVisitorNextStep) {
  const lenses: Record<
    AiCustomProposalVisitorNextStep,
    {
      label: string;
      line: string;
    }
  > = {
    send_inquiry: {
      label: "odoslať dopyt",
      line: "Viedla by človeka k odoslaniu dopytu až vo chvíli, keď má vybraný správny smer a doplnený kontext.",
    },
    book_appointment: {
      label: "objednať termín",
      line: "Pomohla by rýchlo vybrať vhodnú službu a plynulo prejsť do objednania termínu.",
    },
    choose_service: {
      label: "vybrať službu",
      line: "Najprv by pomohla porovnať možnosti a až potom ukázala správny ďalší krok.",
    },
    find_offer: {
      label: "nájsť vhodnú ponuku",
      line: "Zrýchlila by orientáciu medzi ponukami a odporučila to, čo je pre daný zámer najsilnejšie.",
    },
    contact_right_person: {
      label: "kontaktovať správneho človeka",
      line: "Rozlíšila by potrebu a poslala človeka na správny kontakt bez zbytočného preklikávania.",
    },
    fill_form: {
      label: "vyplniť formulár",
      line: "Pomohla by pripraviť človeka na formulár tak, aby ho vedel dokončiť bez váhania.",
    },
    other: {
      label: "spraviť správny ďalší krok",
      line: "Zmenila by nejasný začiatok návštevy na konkrétny ďalší krok.",
    },
  };

  return lenses[value];
}

function getDashboardLine(value: AiCustomProposalDashboardData) {
  const lines: Record<AiCustomProposalDashboardData, string> = {
    top_questions: "Najčastejšie otázky návštevníkov a témy, pri ktorých sa opakuje váhanie.",
    interest_types: "Typy služieb, produktov alebo ponúk, o ktoré je na webe najsilnejší záujem.",
    contact_reasons: "Dôvody, prečo ľudia kontaktujú firmu a s akým zámerom prichádzajú.",
    unfinished_inquiries: "Miesta, kde ľudia dopyt rozpracujú, ale nedokončia ho.",
    lead_quality: "Kvalitu leadov a rozdiel medzi všeobecným a dobre pripraveným dopytom.",
    timing_or_urgency: "Preferované termíny, urgentnosť a signál, kedy chce človek konať hneď.",
    customer_segments: "Segmenty zákazníkov podľa toho, čo hľadajú a aký ďalší krok preferujú.",
    other: "Ďalšie obchodné dáta podľa toho, čo je pre váš tím dnes najdôležitejšie.",
  };

  return lines[value];
}

function getOpportunitySignal(opportunityText: string) {
  const value = opportunityText.toLowerCase();

  if (/(dopyt|formular|lead)/.test(value)) {
    return "Najväčší signál je kvalita dopytu a to, čo človek vie doplniť ešte pred odoslaním.";
  }

  if (/(objed|termin|rezerv)/.test(value)) {
    return "Najväčší signál je zjednodušenie cesty k objednaniu alebo rezervácii bez zbytočných medzikrokov.";
  }

  if (/(otaz|recepci|tim|vola|pise)/.test(value)) {
    return "Najväčší signál je odfiltrovanie opakujúcich sa otázok a lepšie smerovanie na správny ďalší krok.";
  }

  if (/(sluzb|ponuk|produkt|inzer)/.test(value)) {
    return "Najväčší signál je rýchlejšie nasmerovanie človeka na správnu službu, ponuku alebo produkt.";
  }

  return "Najväčší signál je zjednodušenie rozhodovania bez prerábky existujúceho webu.";
}

export const aiCustomProposalSchema = z
  .object({
    locale: z.enum(["sk", "cs", "en"]).default("sk"),
    website: z.string().trim().min(1, "required_website").transform(normalizeWebsiteValue),
    businessType: z.enum(businessTypeValues),
    mainGoal: z.enum(mainGoalValues),
    visitorNextStep: z.enum(visitorNextStepValues),
    opportunityText: z.string().trim().min(12, "required_opportunity").max(2000, "invalid_opportunity"),
    dashboardData: z
      .unknown()
      .transform(normalizeOptionArray)
      .refine(
        (items) => items.length > 0 && items.every((item) => dashboardDataValues.includes(item as AiCustomProposalDashboardData)),
        "invalid_dashboard_data",
      )
      .transform((items) => items as AiCustomProposalDashboardData[]),
    successMetric: z.string().trim().min(12, "required_success_metric").max(2000, "invalid_success_metric"),
    name: z.string().trim().min(1, "required_name").max(120, "invalid_name"),
    email: z.string().trim().min(1, "required_email").email("invalid_email").max(180, "invalid_email"),
    phone: z.string().trim().max(80, "invalid_phone").optional().or(z.literal("")),
    company: z.string().trim().max(160, "invalid_company").optional().or(z.literal("")),
  })
  .transform((value): AiCustomProposalSubmission => {
    const normalizedDomain = getNormalizedDomainFromUrl(value.website);

    if (!normalizedDomain) {
      throw new Error("AI custom proposal schema accepted invalid website normalization.");
    }

    return {
      locale: value.locale,
      website: value.website,
      businessType: value.businessType,
      mainGoal: value.mainGoal,
      visitorNextStep: value.visitorNextStep,
      opportunityText: value.opportunityText,
      dashboardData: value.dashboardData,
      successMetric: value.successMetric,
      name: value.name,
      email: value.email.toLowerCase(),
      phone: normalizeOptionalText(value.phone),
      company: normalizeOptionalText(value.company),
      normalizedDomain,
    };
  });

export function parseAiCustomProposalSubmission(value: unknown) {
  return aiCustomProposalSchema.safeParse(value);
}

export function generateAiCustomProposalRecommendation(
  submission: AiCustomProposalSubmission,
): AiCustomProposalRecommendation {
  if (submission.locale === "en") return englishProposal(submission);
  const businessLens = getBusinessLens(submission.businessType);
  const goalLens = getGoalLens(submission.mainGoal);
  const nextStepLens = getNextStepLens(submission.visitorNextStep);
  const dashboardValue = submission.dashboardData.map(getDashboardLine);
  const recommendationTitle =
    submission.mainGoal === "other" ? businessLens.suggestion : goalLens.title;
  const opportunitySignal = getOpportunitySignal(submission.opportunityText);

  const summary = `Podľa odpovedí by najväčší zmysel dávala ${recommendationTitle.toLowerCase()}, ktorá pomôže návštevníkovi rýchlejšie nájsť ${businessLens.audienceTarget}, pripraví lepší ďalší krok a zároveň dá tímu kvalitnejší kontext pre follow-up.`;

  return {
    summary,
    recommendedLayerTitle: recommendationTitle,
    visitorValue: [
      `${goalLens.visitorLine}`,
      `${nextStepLens.line}`,
      `Na vašom webe by nebolo treba meniť celý flow. AI vrstva by len pomohla človeku rýchlejšie trafiť ${businessLens.audienceTarget}.`,
    ],
    teamValue: [
      `${goalLens.teamLine}`,
      `Tím by získal ${businessLens.teamOutput}.`,
      `${opportunitySignal}`,
    ],
    dashboardValue,
    phaseOne: [
      `Nasadiť krátky vstup ${businessLens.phaseEntry} bez prerábky existujúceho webu.`,
      `${goalLens.phaseLine}`,
      "Výsledok odkladať do dashboardu zámerov a do leadu tak, aby obchod videl, čo človek riešil ešte pred callom.",
    ],
    nextStep: `Odporúčam prejsť 15-min call nad webom ${submission.normalizedDomain} a vybrať jednu konkrétnu stránku alebo flow, kde sa táto AI vrstva otestuje ako prvá. Ako úspech po 30 dňoch má zmysel merať: ${submission.successMetric}`,
  };
}

export function buildAiCustomProposalLeadMessage(
  submission: AiCustomProposalSubmission,
  recommendation: AiCustomProposalRecommendation,
) {
  const dashboardLabels = submission.dashboardData.map((item) => getOptionLabel(dashboardDataOptions, item));
  const generatedRecommendationLines = [
    recommendation.summary,
    "",
    `Odporúčaný typ AI vrstvy: ${recommendation.recommendedLayerTitle}`,
    `Čo by riešila pre návštevníka: ${joinHumanList(recommendation.visitorValue)}`,
    `Čo by získal tím: ${joinHumanList(recommendation.teamValue)}`,
    `Dashboard: ${joinHumanList(recommendation.dashboardValue)}`,
    `Najjednoduchšia prvá fáza: ${joinHumanList(recommendation.phaseOne)}`,
    `Odporúčaný ďalší krok: ${recommendation.nextStep}`,
  ].join("\n");

  return [
    `request_type: ${AI_CUSTOM_PROPOSAL_REQUEST_TYPE}`,
    `source: ${AI_CUSTOM_PROPOSAL_SOURCE}`,
    `website: ${submission.website}`,
    `business_type: ${getOptionLabel(businessTypeOptions, submission.businessType)}`,
    `main_goal: ${getOptionLabel(mainGoalOptions, submission.mainGoal)}`,
    `visitor_next_step: ${getOptionLabel(visitorNextStepOptions, submission.visitorNextStep)}`,
    `opportunity_text: ${submission.opportunityText}`,
    `dashboard_data: ${dashboardLabels.join(", ")}`,
    `success_metric: ${submission.successMetric}`,
    `name: ${submission.name}`,
    `email: ${submission.email}`,
    `phone: ${submission.phone || "-"}`,
    `company: ${submission.company || "-"}`,
    "",
    "generated_recommendation:",
    generatedRecommendationLines,
  ].join("\n");
}
