"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";
import type { ReactNode } from "react";
import AuditBot from "@/components/bendalabs/audit-bot";
import LeadCaptureForm from "@/components/bendalabs/lead-capture-form";
import {
  getHomePageContent,
  type SiteCard,
  type SiteLocale,
} from "@/lib/bendalabs/site-content";

function scrollToSection(sectionId: string) {
  document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function SectionTag({ children }: { children: ReactNode }) {
  return (
    <div className="inline-flex rounded-full border border-black/10 bg-white/78 px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-neutral-600">
      {children}
    </div>
  );
}

function AudienceCard({ title, text }: SiteCard) {
  return (
    <div data-reveal className="glass-panel rounded-[28px] p-6">
      <div className="mb-5 h-px w-16 bg-gradient-to-r from-black/35 to-black/0" />
      <h3 className="text-xl font-semibold tracking-[-0.03em] text-neutral-950">{title}</h3>
      <p className="mt-3 text-sm leading-7 text-neutral-600">{text}</p>
    </div>
  );
}

type BendaLabsLandingPageProps = {
  locale: SiteLocale;
};

export default function BendaLabsLandingPage({ locale }: BendaLabsLandingPageProps) {
  const content = getHomePageContent(locale);
  const auditBlock = locale === "sk" ? content.auditBlock : undefined;
  const [activeSection, setActiveSection] = useState<string>("hero");
  const [activeStep, setActiveStep] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isDesktopStory, setIsDesktopStory] = useState(false);
  const stepRefs = useRef<Array<HTMLDivElement | null>>([]);
  const storyFrameRef = useRef<number | null>(null);

  const activeJourneyStep = content.journeySteps[activeStep] ?? content.journeySteps[0];

  const updateScrollState = useEffectEvent(() => {
    const documentHeight = document.documentElement.scrollHeight - window.innerHeight;
    setScrollProgress(documentHeight <= 0 ? 0 : window.scrollY / documentHeight);
  });

  const syncActiveStoryStep = useEffectEvent(() => {
    const viewportCenter = window.innerHeight / 2;

    let nextIndex = 0;
    let nextDistance = Number.POSITIVE_INFINITY;

    stepRefs.current.forEach((element, index) => {
      if (!element) {
        return;
      }

      const bounds = element.getBoundingClientRect();
      const distance = Math.abs(bounds.top + bounds.height / 2 - viewportCenter);

      if (distance < nextDistance) {
        nextDistance = distance;
        nextIndex = index;
      }
    });

    setActiveStep((current) => (current === nextIndex ? current : nextIndex));
  });

  useEffect(() => {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.setAttribute("data-visible", "true");
          }
        }
      },
      {
        threshold: 0.18,
      },
    );

    const sectionObserver = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((left, right) => right.intersectionRatio - left.intersectionRatio)[0];

        if (visible?.target.id) {
          setActiveSection(visible.target.id);
        }
      },
      {
        threshold: [0.2, 0.4, 0.6],
        rootMargin: "-12% 0px -42% 0px",
      },
    );

    document.querySelectorAll<HTMLElement>("[data-reveal]").forEach((element) => revealObserver.observe(element));
    document.querySelectorAll<HTMLElement>("[data-section]").forEach((element) => sectionObserver.observe(element));

    const onScroll = () => updateScrollState();
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      revealObserver.disconnect();
      sectionObserver.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 1280px)");
    const updateMediaMatch = () => setIsDesktopStory(mediaQuery.matches);

    updateMediaMatch();
    mediaQuery.addEventListener("change", updateMediaMatch);

    return () => mediaQuery.removeEventListener("change", updateMediaMatch);
  }, []);

  useEffect(() => {
    if (!isDesktopStory) {
      return undefined;
    }

    const queueStepSync = () => {
      if (storyFrameRef.current !== null) {
        return;
      }

      storyFrameRef.current = window.requestAnimationFrame(() => {
        storyFrameRef.current = null;
        syncActiveStoryStep();
      });
    };

    queueStepSync();
    window.addEventListener("scroll", queueStepSync, { passive: true });
    window.addEventListener("resize", queueStepSync);

    return () => {
      if (storyFrameRef.current !== null) {
        window.cancelAnimationFrame(storyFrameRef.current);
        storyFrameRef.current = null;
      }

      window.removeEventListener("scroll", queueStepSync);
      window.removeEventListener("resize", queueStepSync);
    };
  }, [isDesktopStory]);

  return (
    <div className="site-shell min-h-screen bg-background text-foreground">
      <div className="fixed inset-x-0 top-0 z-50 h-px bg-black/6">
        <div
          className="h-full bg-black"
          style={{ width: `${Math.max(4, Math.min(scrollProgress * 100, 100))}%` }}
        />
      </div>

      <header className="sticky top-0 z-40 border-b border-black/8 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <div className="text-lg font-semibold tracking-[-0.04em] text-neutral-950">BendaLabs</div>
            <div className="text-xs text-neutral-500">{content.brandTagline}</div>
          </div>

          <nav className="hidden items-center gap-6 text-sm text-neutral-500 lg:flex">
            {content.sections.slice(1).map((section) => (
              <button
                key={section.id}
                type="button"
                onClick={() => scrollToSection(section.id)}
                className={activeSection === section.id ? "text-neutral-950" : "hover:text-neutral-950"}
              >
                {section.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <div className="pointer-events-none fixed right-6 top-1/2 z-30 hidden -translate-y-1/2 xl:block">
        <div className="rounded-full border border-black/8 bg-white/80 px-3 py-3 backdrop-blur-xl shadow-[0_12px_40px_rgba(17,17,17,0.06)]">
          <div className="flex flex-col gap-3">
            {content.sections.map((section) => (
              <button
                key={section.id}
                type="button"
                onClick={() => scrollToSection(section.id)}
                className="pointer-events-auto flex items-center gap-3"
              >
                <span
                  data-active={activeSection === section.id}
                  className={`section-progress-dot h-2.5 w-2.5 rounded-full border ${
                    activeSection === section.id ? "border-black bg-black" : "border-black/20 bg-transparent"
                  }`}
                />
                <span
                  className={`text-[11px] uppercase tracking-[0.22em] ${
                    activeSection === section.id ? "text-neutral-900" : "text-neutral-400"
                  }`}
                >
                  {section.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <main lang={locale === "cs" ? "cs" : "sk"}>
        <section
          id={content.sections[0]?.id}
          data-section
          className="section-surface-white mx-auto max-w-7xl px-6 pb-8 pt-6 sm:pb-10 sm:pt-8"
        >
          <div data-reveal className="max-w-4xl pt-1">
            <SectionTag>{content.heroTag}</SectionTag>
            <h1
              className="mt-5 text-[3rem] font-semibold leading-[0.94] tracking-[-0.06em] text-neutral-950 sm:text-[4.2rem] xl:text-[4.8rem]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {content.heroTitle}
            </h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-neutral-600 sm:text-xl">
              {content.heroDescription}
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              {content.heroChips.map((item) => (
                <div
                  key={item}
                  className="rounded-full border border-black/8 bg-white/72 px-4 py-2.5 text-sm text-neutral-700 shadow-[0_12px_36px_rgba(17,17,17,0.04)]"
                >
                  {item}
                </div>
              ))}
            </div>

            <div className="mt-6 flex flex-wrap gap-4">
              <button
                type="button"
                onClick={() => scrollToSection("audit")}
                className="rounded-full border border-black/10 bg-white px-6 py-3.5 text-sm font-medium text-neutral-950 hover:bg-neutral-100"
              >
                {content.heroPrimaryCta}
              </button>
              <button
                type="button"
                onClick={() => scrollToSection("kontakt")}
                className="rounded-full border border-black/10 bg-black/[0.03] px-6 py-3.5 text-sm font-medium text-neutral-700 hover:bg-black/[0.06]"
              >
                {content.heroSecondaryCta}
              </button>
            </div>
          </div>
        </section>

        <section id="audit" data-section className="section-divider section-surface-soft scroll-mt-24">
          <div className="mx-auto max-w-7xl px-6 py-8 sm:py-10">
            <div data-reveal className="mx-auto max-w-6xl">
              <AuditBot
                locale={locale}
                variant={auditBlock?.variant}
                badge={auditBlock?.badge}
                title={auditBlock?.title}
                subtext={auditBlock?.subtext}
                description={auditBlock?.description}
                benefits={auditBlock?.benefits}
                trustItems={auditBlock?.trustItems}
                explainerLine={auditBlock?.explainerLine}
                previewIdleTitle={auditBlock?.previewIdleTitle}
                previewIdleSteps={auditBlock?.previewIdleSteps}
                placeholder={auditBlock?.placeholder}
                submitLabel={auditBlock?.submitLabel}
                loadingSteps={auditBlock?.loadingSteps}
              />
            </div>
          </div>
        </section>

        <section id={content.sections[2]?.id} data-section className="section-divider section-surface-white">
          <div className="mx-auto max-w-7xl px-6 py-16 sm:py-20">
            <div data-reveal className="max-w-3xl">
              <SectionTag>{content.examplesTag}</SectionTag>
              <h2
                className="mt-5 text-3xl font-semibold tracking-[-0.05em] text-neutral-950 sm:text-5xl"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {content.examplesTitle}
              </h2>
            </div>

            <div className="mt-10 grid gap-4 lg:grid-cols-3">
              {content.examples.map((example, index) => (
                <div
                  key={example.title}
                  data-reveal
                  className="glass-panel rounded-[30px] p-6"
                  style={{ transitionDelay: `${index * 70}ms` }}
                >
                  <div className="text-[11px] uppercase tracking-[0.22em] text-neutral-500">
                    {example.title}
                  </div>
                  <div className="mt-4 text-2xl font-semibold leading-8 tracking-[-0.04em] text-neutral-950">
                    &quot;{example.prompt}&quot;
                  </div>
                  <p className="mt-5 text-sm leading-7 text-neutral-600">{example.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id={content.sections[3]?.id} data-section className="section-divider section-surface-tint">
          <div className="mx-auto max-w-7xl px-6 py-16 sm:py-20">
            <div data-reveal className="max-w-3xl">
              <SectionTag>{content.audiencesTag}</SectionTag>
              <h2
                className="mt-5 text-3xl font-semibold tracking-[-0.05em] text-neutral-950 sm:text-5xl"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {content.audiencesTitle}
              </h2>
              <p className="mt-5 text-lg leading-8 text-neutral-600">{content.audiencesDescription}</p>
            </div>

            <div className="mt-10 grid gap-4 md:grid-cols-2">
              {content.audiences.map((item) => (
                <AudienceCard key={item.title} title={item.title} text={item.text} />
              ))}
            </div>
          </div>
        </section>

        <section id={content.sections[4]?.id} data-section className="section-divider section-surface-soft">
          <div className="mx-auto max-w-7xl px-6 py-16 sm:py-20">
            <div data-reveal className="mt-12 max-w-3xl">
              <SectionTag>{content.journeyTag}</SectionTag>
              <h2
                className="mt-5 text-3xl font-semibold tracking-[-0.05em] text-neutral-950 sm:text-5xl"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {content.journeyTitle}
              </h2>
              <p className="mt-5 text-lg leading-8 text-neutral-600">{content.journeyDescription}</p>
            </div>

            <div className="mt-12 hidden gap-8 xl:grid xl:grid-cols-[0.92fr_1.08fr] xl:items-start">
              <div className="xl:sticky xl:top-28">
                <div data-card-active="true" className="glass-panel rounded-[32px] p-6 sm:p-8">
                  <div className="text-[11px] uppercase tracking-[0.22em] text-neutral-500">
                    {content.activeStepLabel}
                  </div>
                  <div className="mt-4 flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full border border-black/12 bg-black text-lg font-semibold text-white">
                      {activeStep + 1}
                    </div>
                    <div className="h-px flex-1 bg-gradient-to-r from-black/25 to-black/0" />
                  </div>
                  <h3 className="mt-6 text-3xl font-semibold tracking-[-0.04em] text-neutral-950">
                    {activeJourneyStep.title}
                  </h3>
                  <p className="mt-5 text-base leading-8 text-neutral-600">{activeJourneyStep.text}</p>
                </div>
              </div>

              <div className="space-y-6">
                {content.journeySteps.map((step, index) => (
                  <div
                    key={step.title}
                    ref={(element) => {
                      stepRefs.current[index] = element;
                    }}
                    data-reveal
                    data-card-active={activeStep === index}
                    className="glass-panel min-h-[320px] rounded-[30px] p-8"
                  >
                    <div className="text-[11px] uppercase tracking-[0.22em] text-neutral-500">
                      {content.stepLabel} 0{index + 1}
                    </div>
                    <h3 className="mt-4 text-2xl font-semibold tracking-[-0.04em] text-neutral-950">
                      {step.title}
                    </h3>
                    <p className="mt-4 max-w-2xl text-base leading-8 text-neutral-600">{step.text}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-12 grid gap-4 xl:hidden">
              {content.journeySteps.map((step, index) => (
                <div key={step.title} data-reveal className="glass-panel rounded-[28px] p-6">
                  <div className="text-[11px] uppercase tracking-[0.22em] text-neutral-500">
                    {content.stepLabel} 0{index + 1}
                  </div>
                  <h3 className="mt-4 text-2xl font-semibold tracking-[-0.04em] text-neutral-950">
                    {step.title}
                  </h3>
                  <p className="mt-4 text-base leading-8 text-neutral-600">{step.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id={content.sections[5]?.id} data-section className="section-divider section-surface-white">
          <div className="mx-auto max-w-7xl px-6 py-16 sm:py-20">
            <div data-reveal className="glass-panel rounded-[32px] p-8 sm:p-10">
              <SectionTag>{content.flexibilityBlock.tag}</SectionTag>
              <h2
                className="mt-5 max-w-3xl text-3xl font-semibold tracking-[-0.05em] text-neutral-950 sm:text-5xl"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {content.flexibilityBlock.title}
              </h2>
              <p className="mt-5 max-w-3xl text-lg leading-8 text-neutral-600">
                {content.flexibilityBlock.body}
              </p>
              {content.flexibilityBlock.supportingLine ? (
                <p className="mt-4 text-sm leading-7 text-neutral-500">
                  {content.flexibilityBlock.supportingLine}
                </p>
              ) : null}
            </div>

            <div data-reveal className="max-w-3xl">
              <SectionTag>{content.pricingTag}</SectionTag>
              <h2
                className="mt-5 text-3xl font-semibold tracking-[-0.05em] text-neutral-950 sm:text-5xl"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {content.pricingTitle}
              </h2>
            </div>

            <div className="mt-10 grid gap-4 lg:grid-cols-[1fr_1fr_0.88fr]">
              <div data-reveal className="glass-panel rounded-[30px] p-6">
                <div className="text-[11px] uppercase tracking-[0.22em] text-neutral-500">
                  {content.pricing.implementationLabel}
                </div>
                <p className="mt-4 text-sm leading-7 text-neutral-600">
                  {content.pricing.implementationDescription}
                </p>

                <div className="mt-6 space-y-4">
                  {content.pricing.tiers.map((tier) => (
                    <div
                      key={tier.name}
                      className={`rounded-[24px] border border-black/8 p-5 ${
                        tier.tone === "light"
                          ? "bg-white/70 shadow-[0_12px_30px_rgba(17,17,17,0.04)]"
                          : "bg-black/[0.02]"
                      }`}
                    >
                      <div className="text-[11px] uppercase tracking-[0.22em] text-neutral-500">
                        {tier.variant}
                      </div>
                      <h3 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-neutral-950">
                        {tier.name}
                      </h3>
                      <div className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-neutral-950">
                        {tier.price}
                        {tier.cadenceLabel ? (
                          <span className="text-lg text-neutral-500"> {tier.cadenceLabel}</span>
                        ) : null}
                      </div>
                      <p className="mt-4 text-sm leading-7 text-neutral-600">{tier.text}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div data-reveal className="glass-panel rounded-[30px] p-6">
                <div className="text-[11px] uppercase tracking-[0.22em] text-neutral-500">
                  {content.pricing.supportLabel}
                </div>
                <div className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-neutral-950">
                  {content.pricing.supportPrice}
                  <span className="text-lg text-neutral-500"> {content.pricing.supportCadenceLabel}</span>
                </div>
                <div className="mt-5 space-y-3 text-sm leading-7 text-neutral-600">
                  {content.pricing.supportLines.map((line) => (
                    <div key={line}>{line}</div>
                  ))}
                </div>
              </div>

              <div data-reveal className="glass-panel rounded-[30px] p-6">
                <div className="text-[11px] uppercase tracking-[0.22em] text-neutral-500">
                  {content.pricing.computeLabel}
                </div>
                <div className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-neutral-950">
                  {content.pricing.computePrice}
                  <span className="text-lg text-neutral-500"> {content.pricing.computeCadenceLabel}</span>
                </div>
                <div className="mt-5 space-y-3 text-sm leading-7 text-neutral-600">
                  {content.pricing.computeLines.map((line) => (
                    <div key={line}>{line}</div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="kontakt" data-section className="section-divider section-surface-soft">
          <div className="mx-auto max-w-7xl px-6 py-16 sm:py-20">
            <div className="relative overflow-hidden rounded-[36px] border border-[#8fb6a8]/55 bg-[radial-gradient(circle_at_top_right,rgba(196,231,214,0.46),transparent_32%),radial-gradient(circle_at_bottom_left,rgba(219,242,231,0.52),transparent_30%),linear-gradient(180deg,rgba(253,255,254,0.98),rgba(242,249,245,0.96))] p-8 shadow-[0_26px_72px_rgba(80,118,103,0.12)] sm:p-10">
              <div className="pointer-events-none absolute inset-0">
                <div className="grid-surface absolute inset-0 opacity-20" />
                <div className="absolute -right-12 top-10 h-36 w-36 rounded-full bg-[#dff3e6] blur-3xl" />
                <div className="absolute -left-10 bottom-8 h-28 w-28 rounded-full bg-[#edf8f2] blur-3xl" />
                <div className="absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-[#7da994]/35 to-transparent" />
              </div>

              <div className="relative z-10">
              <div className="grid gap-8 lg:grid-cols-[0.78fr_1.22fr] lg:items-start">
                <div data-reveal>
                  <SectionTag>{content.contactTag}</SectionTag>
                  <h2
                    className="mt-5 text-3xl font-semibold tracking-[-0.05em] text-neutral-950 sm:text-5xl"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    {content.contactTitle}
                  </h2>
                  <p className="mt-5 max-w-2xl text-lg leading-8 text-neutral-600">
                    {content.contactDescription}
                  </p>
                </div>

                <div data-reveal className="grid gap-4 lg:justify-self-end">
                  <LeadCaptureForm locale={locale} source="contact_section" variant="contact" />

                  <div className="rounded-[30px] border border-[#8fb6a8]/45 bg-[linear-gradient(180deg,rgba(28,52,44,0.96),rgba(35,66,56,0.92))] p-6 text-white shadow-[0_18px_48px_rgba(23,52,44,0.16)]">
                    <div className="text-[11px] uppercase tracking-[0.22em] text-emerald-50/60">
                      {content.contactCardLabel}
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

                    <button
                      type="button"
                      onClick={() =>
                        window.open(
                          `mailto:hello@bendalabs.sk?subject=${encodeURIComponent(content.contactMailSubject)}&body=${encodeURIComponent(content.contactMailBody)}`,
                          "_self",
                        )
                      }
                      className="mt-6 rounded-full border border-white/80 bg-white px-5 py-3 text-sm font-semibold text-[#17342c] shadow-[0_14px_30px_rgba(4,12,10,0.18)] hover:bg-[#f0fbf4]"
                    >
                      {content.contactButtonLabel}
                    </button>
                  </div>
                </div>
              </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
