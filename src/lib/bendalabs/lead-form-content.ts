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
  };
  validation: Record<ContactRequestErrorCode, string>;
  genericErrorMessage: string;
  audit: LeadFormVariantCopy;
  contact: LeadFormVariantCopy;
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
    },
    validation: {
      invalid_name: "Zadajte meno aspon v dlzke 2 znaky.",
      invalid_email: "Zadajte platny email.",
      invalid_website: "Zadajte platny web alebo domenu.",
      invalid_message: "Strucne popiste, co chcete zlepsit.",
      invalid_source: "Nepodarilo sa urcit zdroj dopytu.",
    },
    genericErrorMessage: "Odoslanie sa nepodarilo. Skuste to este raz.",
    audit: {
      badge: "Konkretny navrh",
      title: "Poziadat o konkretny navrh pre moj web",
      description:
        "Poslite kontakt a ciel zmeny. Vratim sa s konkretnym navrhom AI vrstvy pre vas web.",
      submitLabel: "Odoslat dopyt",
      submittingLabel: "Odosielam...",
      successTitle: "Dakujem, dopyt je odoslany.",
      successMessage: "Ozvem sa s konkretnym navrhom pre vas web.",
    },
    contact: {
      badge: "Lead form",
      title: "Poslite web a obchodny ciel",
      description:
        "Strucne napiste, co ma web predavat lepsie alebo kde dnes navstevnik odpada. Staci kratky kontext.",
      submitLabel: "Poslat dopyt",
      submittingLabel: "Odosielam...",
      successTitle: "Dakujem, dopyt je odoslany.",
      successMessage: "Ozvem sa s dalsim konkretnym krokom.",
    },
    sourceLabels: {
      audit_result: "Po audite",
      contact_section: "Kontakt sekcia",
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
    },
    validation: {
      invalid_name: "Zadejte jmeno aspon o delce 2 znaky.",
      invalid_email: "Zadejte platny email.",
      invalid_website: "Zadejte platny web nebo domenu.",
      invalid_message: "Strucne popiste, co chcete zlepsit.",
      invalid_source: "Nepodarilo se urcit zdroj poptavky.",
    },
    genericErrorMessage: "Odeslani se nepodarilo. Zkuste to znovu.",
    audit: {
      badge: "Konkretni navrh",
      title: "Pozadat o konkretni navrh pro muj web",
      description:
        "Poslete kontakt a cil zmeny. Vratim se s konkretnim navrhem AI vrstvy pro vas web.",
      submitLabel: "Odeslat poptavku",
      submittingLabel: "Odesilam...",
      successTitle: "Dekuji, poptavka je odeslana.",
      successMessage: "Ozvu se s konkretnim navrhem pro vas web.",
    },
    contact: {
      badge: "Lead form",
      title: "Poslete web a obchodni cil",
      description:
        "Strucne napiste, co ma web prodavat lepe nebo kde dnes navstevnik odpada. Staci kratky kontext.",
      submitLabel: "Poslat poptavku",
      submittingLabel: "Odesilam...",
      successTitle: "Dekuji, poptavka je odeslana.",
      successMessage: "Ozvu se s dalsim konkretnim krokem.",
    },
    sourceLabels: {
      audit_result: "Po auditu",
      contact_section: "Kontaktni sekce",
    },
  },
} as const satisfies Record<SiteLocale, LeadFormSharedCopy>;

export function getLeadFormCopy(locale: SiteLocale) {
  return leadFormCopy[locale];
}
