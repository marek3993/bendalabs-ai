import type { ReactNode } from "react";
import { PageShell } from "./brand-shell";
import ProjectContact from "./project-contact";
import type { ServicePageSection, SiteLocale } from "@/lib/bendalabs/site-content";

type ServicePageTemplateProps = {
  locale: SiteLocale; title: string; subtitle: string; eyebrow: string;
  heroChips: ReadonlyArray<string>; heroAddon?: ReactNode;
  sections: ReadonlyArray<ServicePageSection>;
  ctaTitle: string; ctaText: string; ctaButtonLabel: string; ctaMailSubject: string;
};

export default function ServicePageTemplate({ locale, title, subtitle, eyebrow, heroChips, heroAddon, sections, ctaTitle, ctaText, ctaButtonLabel, ctaMailSubject }: ServicePageTemplateProps) {
  return <PageShell locale={locale} contactHref="#kontakt"><main id="main">
    <section className="bl-product-hero bl-wrap"><p className="bl-eyebrow">BendaLabs / {eyebrow}</p><h1>{title}</h1><p>{subtitle}</p><div className="bl-inline-links">{heroChips.map(chip => <span className="bl-eyebrow" key={chip}>{chip}</span>)}</div></section>
    {heroAddon && <div className="bl-product-content bl-wrap">{heroAddon}</div>}
    {sections.map(section => <section key={section.id} id={section.id} className="bl-product-sections bl-wrap"><p className="bl-eyebrow">{section.label}</p><h2>{section.title}</h2><p>{section.description}</p>
      {section.cards && <div className="bl-product-cards">{section.cards.map(card => <article key={card.title}><h3>{card.title}</h3><p>{card.text}</p></article>)}</div>}
      {(section.bullets || section.statements) && <ul className="bl-product-bullets">{(section.bullets || section.statements)?.map(item => <li key={item}>{item}</li>)}</ul>}
    </section>)}
    <div id="cta"><ProjectContact locale={locale} invitation={{ title: ctaTitle, text: ctaText, buttonLabel: ctaButtonLabel, mailSubject: ctaMailSubject }} /></div>
  </main></PageShell>;
}

