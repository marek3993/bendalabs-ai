import { englishLeadForm } from "./lead-form-content.en";
import type { SiteLocale } from "@/lib/bendalabs/site-content";
import type { ContactRequestErrorCode, ContactRequestField } from "@/lib/leads/contact-request";
import type { ContactRequestSource } from "@/lib/leads/types";

type LeadFormVariantCopy = {
  badge: string;
  title: string;
  description: string;
  submitLabel: string;
  submittingLabel: string;
  successTitle: string;
  successMessage: string;
};

export type LeadFormSharedCopy = {
  fields: Record<ContactRequestField, string>;
  placeholders: {
    name: string;
    email: string;
    website: string;
    message: string;
    phone: string;
    preferredTime: string;
    note: string;
  };
  callFields: {
    phone: string;
    preferredTime: string;
    emailOptional: string;
    note: string;
    website: string;
    websiteFallback: string;
  };
  validation: Record<ContactRequestErrorCode, string>;
  genericErrorMessage: string;
  audit: LeadFormVariantCopy;
  contact: LeadFormVariantCopy;
  call: LeadFormVariantCopy;
  sourceLabels: Record<ContactRequestSource, string>;
};

const leadFormCopy = {
  sk: {
    fields: {
      name: "Meno",
      email: "Email",
      website: "Web",
      message: "Čo chcete zlepšiť?",
      source: "Zdroj",
    },
    placeholders: {
      name: "Vaše meno",
      email: "vas@email.sk",
      website: "https://vasweb.sk",
      message: "Stručne popíšte, kde sa dnes láme konverzia alebo čo má byť jednoduchšie.",
      phone: "+421 9xx xxx xxx",
      preferredTime: "Napríklad utorok 10:00-12:00",
      note: "Voliteľne doplňte krátky kontext alebo otázku.",
    },
    callFields: {
      phone: "Telefón",
      preferredTime: "Preferovaný čas",
      emailOptional: "Email (voliteľne)",
      note: "Krátka poznámka (voliteľne)",
      website: "Auditovaný web",
      websiteFallback: "Web",
    },
    validation: {
      required_name: "Zadajte meno.",
      invalid_name: "Zadajte platné meno.",
      required_email: "Zadajte email.",
      invalid_email: "Zadajte platný email.",
      required_website: "Zadajte web alebo doménu.",
      invalid_website: "Zadajte platný web alebo doménu.",
      required_message: "Zadajte správu.",
      invalid_message: "Správa musí mať aspoň 10 znakov.",
      invalid_source: "Nepodarilo sa určiť zdroj dopytu.",
    },
    genericErrorMessage: "Odoslanie sa nepodarilo. Skúste to ešte raz.",
    audit: {
      badge: "Konkrétny návrh",
      title: "Poslať kontakt / získať návrh",
      description:
        "Pošlite kontakt a zámer. Vrátim sa s konkrétnym návrhom, kde by AI vrstva na tomto webe dávala najväčší zmysel.",
      submitLabel: "Odoslať dopyt",
      submittingLabel: "Odosielam...",
      successTitle: "Ďakujem, dopyt je odoslaný.",
      successMessage: "Ozvem sa s konkrétnym návrhom pre váš web.",
    },
    contact: {
      badge: "\u25cf CHCETE TO AJ NA SVOJ WEB?",
      title: "Pošlite web a obchodný cieľ",
      description:
        "Stručne napíšte, čo má web predávať lepšie alebo kde dnes návštevník odpadá. Stačí krátky kontext.",
      submitLabel: "Poslať dopyt",
      submittingLabel: "Odosielam...",
      successTitle: "Ďakujem, dopyt je odoslaný.",
      successMessage: "Ozvem sa s ďalším konkrétnym krokom.",
    },
    call: {
      badge: "Krátky call",
      title: "Dohodnúť krátky call",
      description:
        "Nechajte nám kontakt a preferovaný čas. Ozveme sa vám s krátkym návrhom, kde by AI vrstva dávala najväčší zmysel.",
      submitLabel: "Požiadať o call",
      submittingLabel: "Odosielam...",
      successTitle: "Ďakujem, call požiadavka je odoslaná.",
      successMessage: "Ozveme sa s ďalším krokom.",
    },
    sourceLabels: {
      audit_result: "Po audite",
      contact_section: "Kontakt sekcia",
      ai_navrh_na_mieru: "AI návrh na mieru",
    },
  },
  cs: {
    fields: {
      name: "Jméno",
      email: "Email",
      website: "Web",
      message: "Co chcete zlepšit?",
      source: "Zdroj",
    },
    placeholders: {
      name: "Vaše jméno",
      email: "vas@email.cz",
      website: "https://vasweb.cz",
      message: "Stručně popište, kde se dnes láme konverze nebo co má být jednodušší.",
      phone: "+420 7xx xxx xxx",
      preferredTime: "Například úterý 10:00-12:00",
      note: "Volitelně doplňte krátký kontext nebo otázku.",
    },
    callFields: {
      phone: "Telefon",
      preferredTime: "Preferovaný čas",
      emailOptional: "Email (volitelně)",
      note: "Krátká poznámka (volitelně)",
      website: "Auditovaný web",
      websiteFallback: "Web",
    },
    validation: {
      required_name: "Zadejte jméno.",
      invalid_name: "Zadejte platné jméno.",
      required_email: "Zadejte email.",
      invalid_email: "Zadejte platný email.",
      required_website: "Zadejte web nebo doménu.",
      invalid_website: "Zadejte platný web nebo doménu.",
      required_message: "Zadejte zprávu.",
      invalid_message: "Zpráva musí mít alespoň 10 znaků.",
      invalid_source: "Nepodařilo se určit zdroj poptávky.",
    },
    genericErrorMessage: "Odeslání se nepodařilo. Zkuste to znovu.",
    audit: {
      badge: "Konkrétní návrh",
      title: "Poslat kontakt / získat návrh",
      description:
        "Pošlete kontakt a záměr. Vrátím se s konkrétním návrhem, kde by AI vrstva na tomto webu dávala největší smysl.",
      submitLabel: "Odeslat poptávku",
      submittingLabel: "Odesílám...",
      successTitle: "Děkuji, poptávka je odeslaná.",
      successMessage: "Ozvu se s konkrétním návrhem pro váš web.",
    },
    contact: {
      badge: "\u25cf CHCETE TO TAKÉ NA SVŮJ WEB?",
      title: "Pošlete web a obchodní cíl",
      description:
        "Stručně napište, co má web prodávat lépe nebo kde dnes návštěvník odpadá. Stačí krátký kontext.",
      submitLabel: "Poslat poptávku",
      submittingLabel: "Odesílám...",
      successTitle: "Děkuji, poptávka je odeslaná.",
      successMessage: "Ozvu se s dalším konkrétním krokem.",
    },
    call: {
      badge: "Krátký call",
      title: "Domluvit krátký call",
      description:
        "Nechte nám kontakt a preferovaný čas. Ozveme se vám s krátkým návrhem, kde by AI vrstva dávala největší smysl.",
      submitLabel: "Požádat o call",
      submittingLabel: "Odesílám...",
      successTitle: "Děkuji, call požadavek je odeslán.",
      successMessage: "Ozveme se s dalším krokem.",
    },
    sourceLabels: {
      audit_result: "Po auditu",
      contact_section: "Kontaktní sekce",
      ai_navrh_na_mieru: "AI návrh na míru",
    },
  },
} as const satisfies Record<Exclude<SiteLocale, "en">, LeadFormSharedCopy>;

export function getLeadFormCopy(locale: SiteLocale) {
  return locale === "en" ? englishLeadForm : leadFormCopy[locale];
}
