import type { ReactNode } from "react";
import Link from "next/link";
import {
  getSiteChrome,
  getSitePaths,
  getPageLinks,
  type ServicePageSection,
  type SiteCard,
  type SiteLocale,
} from "@/lib/bendalabs/site-content";

type ServicePageTemplateProps = {
  locale: SiteLocale;
  title: string;
  subtitle: string;
  eyebrow: string;
  heroChips: ReadonlyArray<string>;
  heroAddon?: ReactNode;
  sections: ReadonlyArray<ServicePageSection>;
  ctaTitle: string;
  ctaText: string;
  ctaButtonLabel: string;
  ctaMailSubject: string;
};

const surfaceClassName: Record<ServicePageSection["surface"], string> = {
  white: "section-surface-white",
  soft: "section-surface-soft",
  tint: "section-surface-tint",
};

function SectionTag({ children }: { children: ReactNode }) {
  return (
    <div className="inline-flex rounded-full border border-black/10 bg-white/78 px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-neutral-600">
      {children}
    </div>
  );
}

function SectionCards({ cards, columns = 2 }: { cards: ReadonlyArray<SiteCard>; columns?: 2 | 3 }) {
  return (
    <div className={`mt-10 grid gap-4 ${columns === 3 ? "lg:grid-cols-3" : "lg:grid-cols-2"}`}>
      {cards.map((card) => (
        <div key={card.title} className="glass-panel rounded-[28px] p-6">
          <div className="mb-5 h-px w-16 bg-gradient-to-r from-black/35 to-black/0" />
          <h3 className="text-xl font-semibold tracking-[-0.03em] text-neutral-950">{card.title}</h3>
          <p className="mt-3 text-sm leading-7 text-neutral-600">{card.text}</p>
        </div>
      ))}
    </div>
  );
}

function SectionBullets({ bullets }: { bullets: ReadonlyArray<string> }) {
  return (
    <div className="mt-8 grid gap-3">
      {bullets.map((bullet) => (
        <div
          key={bullet}
          className="rounded-[22px] border border-black/8 bg-white/72 px-4 py-4 text-sm leading-7 text-neutral-700 shadow-[0_12px_36px_rgba(17,17,17,0.04)]"
        >
          {bullet}
        </div>
      ))}
    </div>
  );
}

function SectionStatements({ statements }: { statements: ReadonlyArray<string> }) {
  return (
    <div className="mt-10 grid gap-4">
      {statements.map((statement) => (
        <div
          key={statement}
          className="glass-panel rounded-[26px] px-6 py-5 text-base leading-8 text-neutral-800"
        >
          {statement}
        </div>
      ))}
    </div>
  );
}

export default function ServicePageTemplate({
  locale,
  title,
  subtitle,
  eyebrow,
  heroChips,
  heroAddon,
  sections,
  ctaTitle,
  ctaText,
  ctaButtonLabel,
  ctaMailSubject,
}: ServicePageTemplateProps) {
  const chrome = getSiteChrome(locale);
  const pageLinks = getPageLinks(locale);
  const sitePaths = getSitePaths(locale);

  return (
    <div className="site-shell min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-black/8 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-4">
          <div>
            <Link href={sitePaths.home} className="text-lg font-semibold tracking-[-0.04em] text-neutral-950">
              BendaLabs
            </Link>
            <div className="text-xs text-neutral-500">{chrome.brandTagline}</div>
          </div>

          <nav className="hidden items-center gap-6 text-sm text-neutral-500 xl:flex">
            {pageLinks.map((link) => (
              <Link key={link.href} href={link.href} className="hover:text-neutral-950">
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main lang={locale === "cs" ? "cs" : "sk"}>
        <section className="section-surface-white mx-auto max-w-7xl px-6 pb-10 pt-8 sm:pb-12 sm:pt-10">
          <div className="max-w-4xl">
            <SectionTag>{eyebrow}</SectionTag>
            <h1
              className="mt-5 text-[3rem] font-semibold leading-[0.94] tracking-[-0.06em] text-neutral-950 sm:text-[4.2rem] xl:text-[4.8rem]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {title}
            </h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-neutral-600 sm:text-xl">{subtitle}</p>

            <div className="mt-6 flex flex-wrap gap-3">
              {heroChips.map((chip) => (
                <div
                  key={chip}
                  className="rounded-full border border-black/8 bg-white/72 px-4 py-2.5 text-sm text-neutral-700 shadow-[0_12px_36px_rgba(17,17,17,0.04)]"
                >
                  {chip}
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="#cta"
                className="rounded-full border border-black/10 bg-white px-6 py-3.5 text-sm font-medium text-neutral-950 hover:bg-neutral-100"
              >
                {chrome.openCtaLabel}
              </Link>
              <Link
                href={sitePaths.audit}
                className="rounded-full border border-black/10 bg-black/[0.03] px-6 py-3.5 text-sm font-medium text-neutral-700 hover:bg-black/[0.06]"
              >
                {chrome.openAuditLabel}
              </Link>
            </div>
          </div>

          {heroAddon ? <div className="mt-10">{heroAddon}</div> : null}
        </section>

        {sections.map((section) => (
          <section
            key={section.id}
            className={`section-divider ${surfaceClassName[section.surface]}`}
            id={section.id}
          >
            <div className="mx-auto max-w-7xl px-6 py-16 sm:py-20">
              <div className="max-w-3xl">
                <SectionTag>{section.label}</SectionTag>
                <h2
                  className="mt-5 text-3xl font-semibold tracking-[-0.05em] text-neutral-950 sm:text-5xl"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {section.title}
                </h2>
                <p className="mt-5 text-lg leading-8 text-neutral-600">{section.description}</p>
              </div>

              {section.cards ? <SectionCards cards={section.cards} columns={section.columns} /> : null}
              {section.bullets ? <SectionBullets bullets={section.bullets} /> : null}
              {section.statements ? <SectionStatements statements={section.statements} /> : null}
            </div>
          </section>
        ))}

        <section id="cta" className="section-divider section-surface-soft">
          <div className="mx-auto max-w-7xl px-6 py-16 sm:py-20">
            <div className="glass-panel rounded-[34px] p-8 sm:p-10">
              <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
                <div>
                  <SectionTag>{chrome.ctaTag}</SectionTag>
                  <h2
                    className="mt-5 text-3xl font-semibold tracking-[-0.05em] text-neutral-950 sm:text-5xl"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    {ctaTitle}
                  </h2>
                  <p className="mt-5 max-w-2xl text-lg leading-8 text-neutral-600">{ctaText}</p>
                </div>

                <div className="rounded-[28px] border border-black/10 bg-black p-6 text-white lg:justify-self-end">
                  <div className="text-[11px] uppercase tracking-[0.22em] text-white/55">
                    {chrome.contactLabel}
                  </div>
                  <div className="mt-4 text-2xl font-semibold tracking-[-0.04em]">Marek Benda</div>
                  <div className="mt-5 space-y-3 text-base text-white/76">
                    <a href="tel:+421944388123" className="block hover:text-white">
                      0944 388 123
                    </a>
                    <a href="mailto:hello@bendalabs.sk" className="block hover:text-white">
                      hello@bendalabs.sk
                    </a>
                  </div>

                  <a
                    href={`mailto:hello@bendalabs.sk?subject=${encodeURIComponent(ctaMailSubject)}`}
                    className="mt-6 inline-flex rounded-full border border-white bg-white px-5 py-3 text-sm font-medium text-black hover:bg-neutral-200"
                  >
                    {ctaButtonLabel}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
