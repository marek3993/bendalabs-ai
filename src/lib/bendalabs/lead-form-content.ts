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

type LeadFormSharedCopy = {
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
      message: "Co chcete zlepsit?",
      source: "Zdroj",
    },
    placeholders: {
      name: "Vase meno",
      email: "vas@email.sk",
      website: "https://vasweb.sk",
      message: "Strucne popiste, kde sa dnes lame konverzia alebo co ma byt jednoduchsie.",
      phone: "+421 9xx xxx xxx",
      preferredTime: "Napriklad utorok 10:00-12:00",
      note: "Volitelne doplnte kratky kontext alebo otazku.",
    },
    callFields: {
      phone: "Telefon",
      preferredTime: "Preferovany cas",
      emailOptional: "Email (volitelne)",
      note: "Kratka poznamka (volitelne)",
      website: "Auditovany web",
      websiteFallback: "Web",
    },
    validation: {
      required_name: "Zadajte meno.",
      invalid_name: "Zadajte platne meno.",
      required_email: "Zadajte email.",
      invalid_email: "Zadajte platny email.",
      required_website: "Zadajte web alebo domenu.",
      invalid_website: "Zadajte platny web alebo domenu.",
      required_message: "Zadajte spravu.",
      invalid_message: "Sprava musi mat aspon 10 znakov.",
      invalid_source: "Nepodarilo sa urcit zdroj dopytu.",
    },
    genericErrorMessage: "Odoslanie sa nepodarilo. Skuste to este raz.",
    audit: {
      badge: "Konkretny navrh",
      title: "Poslat kontakt / ziskat navrh",
      description:
        "Poslite kontakt a zamer. Vratim sa s konkretnym navrhom, kde by AI vrstva na tomto webe davala najvacsi zmysel.",
      submitLabel: "Odoslat dopyt",
      submittingLabel: "Odosielam...",
      successTitle: "Dakujem, dopyt je odoslany.",
      successMessage: "Ozvem sa s konkretnym navrhom pre vas web.",
    },
    contact: {
      badge: "\u25cf CHCETE TO AJ NA SVOJ WEB?",
      title: "Poslite web a obchodny ciel",
      description:
        "Strucne napiste, co ma web predavat lepsie alebo kde dnes navstevnik odpada. Staci kratky kontext.",
      submitLabel: "Poslat dopyt",
      submittingLabel: "Odosielam...",
      successTitle: "Dakujem, dopyt je odoslany.",
      successMessage: "Ozvem sa s dalsim konkretnym krokom.",
    },
    call: {
      badge: "Kratky call",
      title: "Dohodnut kratky call",
      description:
        "Nechajte nam kontakt a preferovany cas. Ozveme sa vam s kratkym navrhom, kde by AI vrstva davala najvacsi zmysel.",
      submitLabel: "Poziadat o call",
      submittingLabel: "Odosielam...",
      successTitle: "Dakujem, call poziadavka je odoslana.",
      successMessage: "Ozveme sa s dalsim krokom.",
    },
    sourceLabels: {
      audit_result: "Po audite",
      contact_section: "Kontakt sekcia",
      ai_navrh_na_mieru: "AI navrh na mieru",
    },
  },
  cs: {
    fields: {
      name: "Jmeno",
      email: "Email",
      website: "Web",
      message: "Co chcete zlepsit?",
      source: "Zdroj",
    },
    placeholders: {
      name: "Vase jmeno",
      email: "vas@email.cz",
      website: "https://vasweb.cz",
      message: "Strucne popiste, kde se dnes lame konverze nebo co ma byt jednodussi.",
      phone: "+420 7xx xxx xxx",
      preferredTime: "Napriklad utery 10:00-12:00",
      note: "Volitelne doplnte kratky kontext nebo otazku.",
    },
    callFields: {
      phone: "Telefon",
      preferredTime: "Preferovany cas",
      emailOptional: "Email (volitelne)",
      note: "Kratka poznamka (volitelne)",
      website: "Auditovany web",
      websiteFallback: "Web",
    },
    validation: {
      required_name: "Zadejte jmeno.",
      invalid_name: "Zadejte platne jmeno.",
      required_email: "Zadejte email.",
      invalid_email: "Zadejte platny email.",
      required_website: "Zadejte web nebo domenu.",
      invalid_website: "Zadejte platny web nebo domenu.",
      required_message: "Zadejte zpravu.",
      invalid_message: "Zprava musi mit alespon 10 znaku.",
      invalid_source: "Nepodarilo se urcit zdroj poptavky.",
    },
    genericErrorMessage: "Odeslani se nepodarilo. Zkuste to znovu.",
    audit: {
      badge: "Konkretni navrh",
      title: "Poslat kontakt / ziskat navrh",
      description:
        "Poslete kontakt a zamer. Vratim se s konkretnim navrhem, kde by AI vrstva na tomto webu davala nejvetsi smysl.",
      submitLabel: "Odeslat poptavku",
      submittingLabel: "Odesilam...",
      successTitle: "Dekuji, poptavka je odeslana.",
      successMessage: "Ozvu se s konkretnim navrhem pro vas web.",
    },
    contact: {
      badge: "\u25cf CHCETE TO TAKE NA SVUJ WEB?",
      title: "Poslete web a obchodni cil",
      description:
        "Strucne napiste, co ma web prodavat lepe nebo kde dnes navstevnik odpada. Staci kratky kontext.",
      submitLabel: "Poslat poptavku",
      submittingLabel: "Odesilam...",
      successTitle: "Dekuji, poptavka je odeslana.",
      successMessage: "Ozvu se s dalsim konkretnim krokem.",
    },
    call: {
      badge: "Kratky call",
      title: "Domluvit kratky call",
      description:
        "Nechte nam kontakt a preferovany cas. Ozveme se vam s kratkym navrhem, kde by AI vrstva davala nejvetsi smysl.",
      submitLabel: "Pozadat o call",
      submittingLabel: "Odesilam...",
      successTitle: "Dekuji, call pozadavek je odeslan.",
      successMessage: "Ozveme se s dalsim krokem.",
    },
    sourceLabels: {
      audit_result: "Po auditu",
      contact_section: "Kontaktni sekce",
      ai_navrh_na_mieru: "AI navrh na miru",
    },
  },
} as const satisfies Record<SiteLocale, LeadFormSharedCopy>;

export function getLeadFormCopy(locale: SiteLocale) {
  return leadFormCopy[locale];
}
