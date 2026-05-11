import { z } from "zod";
import { getNormalizedDomainFromUrl } from "@/lib/leads/domain-utils";
import { normalizeWebsiteUrl } from "@/lib/site-audit/url";

export const AI_CUSTOM_PROPOSAL_PATH = "/ai-navrh-na-mieru";
export const AI_CUSTOM_PROPOSAL_REQUEST_TYPE = "ai_custom_proposal";
export const AI_CUSTOM_PROPOSAL_SOURCE = "ai_navrh_na_mieru";

export const businessTypeOptions = [
  { value: "real_estate", label: "Realitny web / realitna kancelaria" },
  { value: "finance", label: "Financne sluzby / poistenie / hypoteky" },
  { value: "clinic", label: "Klinika / zdravotne alebo esteticke sluzby" },
  { value: "marketplace", label: "Inzertny alebo marketplace portal" },
  { value: "recruitment", label: "Recruitment / HR / pracovny portal" },
  { value: "b2b_services", label: "B2B sluzby / poradenstvo" },
  { value: "ecommerce", label: "E-shop alebo katalog produktov" },
  { value: "other", label: "Ine" },
] as const;

export const mainGoalOptions = [
  {
    value: "choose_right_offer",
    label: "Pomoct navstevnikovi vybrat spravnu sluzbu alebo ponuku",
  },
  { value: "better_leads", label: "Ziskat lepsie pripravene dopyty" },
  { value: "simplify_contact", label: "Zjednodusit objednanie alebo kontakt" },
  { value: "discover_intent", label: "Zistit, co ludia na webe realne hladaju" },
  { value: "reduce_unclear_questions", label: "Znizit pocet nejasnych otazok pre tim/recepciu" },
  { value: "increase_existing_traffic_value", label: "Zvysit hodnotu existujucej navstevnosti" },
  { value: "other", label: "Ine" },
] as const;

export const visitorNextStepOptions = [
  { value: "send_inquiry", label: "Odoslat dopyt" },
  { value: "book_appointment", label: "Objednat termin" },
  { value: "choose_service", label: "Vybrat sluzbu" },
  { value: "find_offer", label: "Najst vhodnu ponuku / inzerat / produkt" },
  { value: "contact_right_person", label: "Kontaktovat spravneho cloveka" },
  { value: "fill_form", label: "Vyplnit formular" },
  { value: "other", label: "Ine" },
] as const;

export const dashboardDataOptions = [
  { value: "top_questions", label: "Najcastejsie otazky navstevnikov" },
  { value: "interest_types", label: "Typy sluzieb / produktov / ponuk, o ktore je zaujem" },
  { value: "contact_reasons", label: "Dovody, preco ludia kontaktuju firmu" },
  { value: "unfinished_inquiries", label: "Neodoslane alebo nedokoncene dopyty" },
  { value: "lead_quality", label: "Kvalita leadov / dopytov" },
  { value: "timing_or_urgency", label: "Preferovane terminy alebo urgentnost" },
  { value: "customer_segments", label: "Segmenty zakaznikov" },
  { value: "other", label: "Ine" },
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
      audienceTarget: "spravnu ponuku, inzerat alebo maklera",
      teamOutput: "presnejsie realitne dopyty a jasnejsi kontext pred kontaktom",
      suggestion: "AI vrstva pre vyber ponuky a pripravu kvalitnejsieho dopytu",
      phaseEntry: "na homepage, listingoch alebo pri dopytovom formulari",
    },
    finance: {
      audienceTarget: "spravne financne riesenie alebo dalsi konzultacny krok",
      teamOutput: "lepsie pripravene dopyty pre obchod a menej vseobecnych otazok",
      suggestion: "AI vrstva pre vyber spravnej sluzby a kvalifikaciu dopytu",
      phaseEntry: "na produktovych vetvach, kalkulackach alebo pred formularom",
    },
    clinic: {
      audienceTarget: "spravnu sluzbu, zakrok alebo termin",
      teamOutput: "menej nejasnych otazok pre recepciu a viac pripravenych objednani",
      suggestion: "AI vrstva pre vyber sluzby a zjednodusenie objednania",
      phaseEntry: "na strankach sluzieb alebo pred objednanim terminu",
    },
    marketplace: {
      audienceTarget: "spravnu ponuku, inzerat alebo kategoriu",
      teamOutput: "viac relevantnych dopytov a lepsie obchodne data o zaujme",
      suggestion: "AI vrstva pre vyber spravnej ponuky a dalsieho kroku",
      phaseEntry: "nad katalogom, vyhladavanim alebo pri detailoch ponuk",
    },
    recruitment: {
      audienceTarget: "spravnu poziciu, sluzbu alebo kontakt",
      teamOutput: "lepsie kvalifikovane leady od firiem aj kandidatov",
      suggestion: "AI vrstva pre smerovanie navstevnika a pripravu dopytu",
      phaseEntry: "na kariernych strankach, pri kontaktnych bodoch alebo formuleroch",
    },
    b2b_services: {
      audienceTarget: "spravnu sluzbu, konzultaciu alebo dalsi krok",
      teamOutput: "cistejsie leady s kontextom a jasnejsim zadanim",
      suggestion: "AI vrstva pre vyber sluzby a lepsie pripraveny dopyt",
      phaseEntry: "na klucovych sluzbovych strankach alebo pred kontaktom",
    },
    ecommerce: {
      audienceTarget: "spravny produkt, kategoriu alebo formular",
      teamOutput: "vyssiu hodnotu existujucej navstevnosti a menej opakujucich sa otazok",
      suggestion: "AI vrstva pre vyber produktu a odporucenie dalsieho kroku",
      phaseEntry: "na kategoriach, detailoch produktov alebo v kontaktnom flowe",
    },
    other: {
      audienceTarget: "spravny dalsi krok bez zbytocneho hladania",
      teamOutput: "lepsie pripraveny inbound a nove obchodne data",
      suggestion: "AI vrstva pre smerovanie navstevnika a pripravu kvalitnejsieho dopytu",
      phaseEntry: "na miestach, kde sa dnes rozhoduje o dalsom kroku",
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
      title: "AI vrstva pre vyber spravnej sluzby alebo ponuky",
      visitorLine: "Pomohla by cloveku rychlo sa zorientovat a netlacit ho do nespravnej vetvy webu.",
      teamLine: "Do timu by chodili ludia, ktori uz vedia, o aku oblast maju zaujem.",
      phaseLine: "Nastavit otazky, ktore rychlo rozlisuju, co je pre navstevnika najrelevantnejsie.",
    },
    better_leads: {
      title: "AI vrstva pre lepsie pripravene dopyty",
      visitorLine: "Pred odoslanim by doplnila dolezity kontext a pomohla cloveku spresnit potrebu.",
      teamLine: "Vas tim by dostaval lepsie pripravene dopyty namiesto vseobecnych sprav.",
      phaseLine: "Prepojit vystup z otazok priamo do dopytu, aby ostal zachovany kontext.",
    },
    simplify_contact: {
      title: "AI vrstva pre zjednodusenie objednania alebo kontaktu",
      visitorLine: "Skratila by cestu od prveho zaujmu k objednaniu alebo kontaktu.",
      teamLine: "Znizil by sa pocet odchodov pred formularom alebo pred objednanim terminu.",
      phaseLine: "Nasadit vrstvu pred klucovy kontakt alebo objednavkovy krok.",
    },
    discover_intent: {
      title: "AI vrstva pre zachytenie zamerov navstevnikov",
      visitorLine: "Navstevnik by sa dostal k spravnej ponuke a vy by ste zaroven videli, co realne hlada.",
      teamLine: "Vznikli by nove obchodne data o temach, zaujmoch a miestach, kde ludia vahaju.",
      phaseLine: "Zachytavat intent a odkladat ho do dashboardu zamerov bez prerabky existujuceho webu.",
    },
    reduce_unclear_questions: {
      title: "AI vrstva pre odfiltrovanie nejasnych otazok",
      visitorLine: "Najskor by vysvetlila rozdiely a az potom poslala cloveka na kontakt alebo formular.",
      teamLine: "Tim by mal menej opakujucich sa otazok a viac pripravenych kontaktov.",
      phaseLine: "Najprv pokryt najcastejsie nejasne otazky a routovanie na spravny dalsi krok.",
    },
    increase_existing_traffic_value: {
      title: "AI vrstva pre vyssiu hodnotu existujucej navstevnosti",
      visitorLine: "Viac ludi by sa z existujucej navstevnosti dostalo k spravnemu dalsiemu kroku.",
      teamLine: "Z webu by ste vytazili viac bez prerabky existujuceho webu.",
      phaseLine: "Vybrat jedno miesto s navstevnostou a vysokym rozhodovacim trenim a nasadit tam prvu fazu.",
    },
    other: {
      title: "AI vrstva prispodobena vasmu cielu",
      visitorLine: "Priblizila by navstevnika k dalsiemu kroku podla toho, co chce naozaj vyriesit.",
      teamLine: "Timu by pridala lepsi kontext a nove obchodne data o zaujme navstevnikov.",
      phaseLine: "Zacal by sa jeden uzky flow, kde sa najrychlejsie ukaze dopad.",
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
      label: "odoslat dopyt",
      line: "Viedla by cloveka k odoslaniu dopytu az vo chvili, ked ma vybrany spravny smer a doplneny kontext.",
    },
    book_appointment: {
      label: "objednat termin",
      line: "Pomohla by rychlo vybrat vhodnu sluzbu a plynulo prejst do objednania terminu.",
    },
    choose_service: {
      label: "vybrat sluzbu",
      line: "Najprv by pomohla porovnat moznosti a az potom ukazala spravny dalsi krok.",
    },
    find_offer: {
      label: "najst vhodnu ponuku",
      line: "Zrychlila by orientaciu medzi ponukami a odporucila to, co je pre dany zamer najsilnejsie.",
    },
    contact_right_person: {
      label: "kontaktovat spravneho cloveka",
      line: "Rozlisila by potrebu a poslala cloveka na spravny kontakt bez zbytocneho preklikavania.",
    },
    fill_form: {
      label: "vyplnit formular",
      line: "Pomohla by pripravit cloveka na formular tak, aby ho vedel dokoncit bez vazania.",
    },
    other: {
      label: "spravit spravny dalsi krok",
      line: "Zmenila by nejasny zaciatok navstevy na konkretny dalsi krok.",
    },
  };

  return lenses[value];
}

function getDashboardLine(value: AiCustomProposalDashboardData) {
  const lines: Record<AiCustomProposalDashboardData, string> = {
    top_questions: "Najcastejsie otazky navstevnikov a temy, pri ktorych sa opakuje vahanie.",
    interest_types: "Typy sluzieb, produktov alebo ponuk, o ktore je na webe najsilnejsi zaujem.",
    contact_reasons: "Dovody, preco ludia kontaktuju firmu a s akym zamerom prichadzaju.",
    unfinished_inquiries: "Miesta, kde ludia dopyt rozpracuju, ale nedokoncia ho.",
    lead_quality: "Kvalitu leadov a rozdiel medzi vseobecnym a dobre pripravenym dopytom.",
    timing_or_urgency: "Preferovane terminy, urgentnost a signal, kedy chce clovek konat hned.",
    customer_segments: "Segmenty zakaznikov podla toho, co hladaju a aky dalsi krok preferuju.",
    other: "Dalsie obchodne data podla toho, co je pre vas tim dnes najdolezitejsie.",
  };

  return lines[value];
}

function getOpportunitySignal(opportunityText: string) {
  const value = opportunityText.toLowerCase();

  if (/(dopyt|formular|lead)/.test(value)) {
    return "Najvacsi signal je kvalita dopytu a to, co clovek vie doplnit este pred odoslanim.";
  }

  if (/(objed|termin|rezerv)/.test(value)) {
    return "Najvacsi signal je zjednodusenie cesty k objednaniu alebo rezervacii bez zbytocnych medzikrokov.";
  }

  if (/(otaz|recepci|tim|vola|pise)/.test(value)) {
    return "Najvacsi signal je odfiltrovanie opakujucich sa otazok a lepsie smerovanie na spravny dalsi krok.";
  }

  if (/(sluzb|ponuk|produkt|inzer)/.test(value)) {
    return "Najvacsi signal je rychlejsie nasmerovanie cloveka na spravnu sluzbu, ponuku alebo produkt.";
  }

  return "Najvacsi signal je zjednodusenie rozhodovania bez prerabky existujuceho webu.";
}

export const aiCustomProposalSchema = z
  .object({
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
  const businessLens = getBusinessLens(submission.businessType);
  const goalLens = getGoalLens(submission.mainGoal);
  const nextStepLens = getNextStepLens(submission.visitorNextStep);
  const dashboardValue = submission.dashboardData.map(getDashboardLine);
  const recommendationTitle =
    submission.mainGoal === "other" ? businessLens.suggestion : goalLens.title;
  const opportunitySignal = getOpportunitySignal(submission.opportunityText);

  const summary = `Podla odpovedi by najvacsi zmysel davala ${recommendationTitle.toLowerCase()}, ktora pomoze navstevnikovi rychlejsie najst ${businessLens.audienceTarget}, pripravi lepsi dalsi krok a zaroven da timu kvalitnejsi kontext pre follow-up.`;

  return {
    summary,
    recommendedLayerTitle: recommendationTitle,
    visitorValue: [
      `${goalLens.visitorLine}`,
      `${nextStepLens.line}`,
      `Na vasom webe by nebolo treba menit cely flow. AI vrstva by len pomohla cloveku rychlejsie trafit ${businessLens.audienceTarget}.`,
    ],
    teamValue: [
      `${goalLens.teamLine}`,
      `Tim by ziskal ${businessLens.teamOutput}.`,
      `${opportunitySignal}`,
    ],
    dashboardValue,
    phaseOne: [
      `Nasadit kratky vstup ${businessLens.phaseEntry} bez prerabky existujuceho webu.`,
      `${goalLens.phaseLine}`,
      "Vysledok odkladat do dashboardu zamerov a do leadu tak, aby obchod videl, co clovek riesil este pred callom.",
    ],
    nextStep: `Odporucam prejst 15-min call nad webom ${submission.normalizedDomain} a vybrat jednu konkretnu stranku alebo flow, kde sa tato AI vrstva otestuje ako prva. Ako uspech po 30 dnoch ma zmysel merat: ${submission.successMetric}`,
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
    `Odporucany typ AI vrstvy: ${recommendation.recommendedLayerTitle}`,
    `Co by riesila pre navstevnika: ${joinHumanList(recommendation.visitorValue)}`,
    `Co by ziskal tim: ${joinHumanList(recommendation.teamValue)}`,
    `Dashboard: ${joinHumanList(recommendation.dashboardValue)}`,
    `Najjednoduchsia prva faza: ${joinHumanList(recommendation.phaseOne)}`,
    `Odporucany dalsi krok: ${recommendation.nextStep}`,
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
