"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";
import type { ReactNode } from "react";
import AuditBot from "@/components/bendalabs/audit-bot";

const sections = [
  { id: "hero", label: "Hero" },
  { id: "audit", label: "Audit" },
  { id: "pre-koho", label: "Pre koho" },
  { id: "co-robi", label: "Co robi" },
  { id: "priklady", label: "Priklady" },
  { id: "ako-to-funguje", label: "Ako to funguje" },
  { id: "cennik", label: "Cennik" },
  { id: "kontakt", label: "Kontakt" },
] as const;

const audiences = [
  {
    title: "Marketplace a service weby",
    text: "Weby, kde clovek prichadza s potrebou, ale nevie, ktoru kategoriu, ponuku alebo flow ma otvorit ako prvy.",
  },
  {
    title: "Financne a poistne portaly",
    text: "Komplexne rozhodovanie medzi produktmi, refinancovanim, kalkulackami, formularmi a spravnou vetvou dopytu.",
  },
  {
    title: "Rental a discovery use-casy",
    text: "Weby typu Rentulo, kde navstevnik nehlada nazov kategorie, ale co chce vyriesit, prenajat alebo objavit.",
  },
  {
    title: "Katalogy produktov a sluzieb",
    text: "Siroka ponuka, viacero ciest ku konverzii a potreba dostat cloveka k spravnej volbe bez trenia a zbytocneho klikania.",
  },
];

const features = [
  "Pochopi, co chce clovek realne urobit, aj ked to nepovie nazvom produktu alebo kategorie.",
  "Posle ho do spravnej cesty bez bludenia cez menu, filtre, porovnavania alebo nespravne formulare.",
  "Odporuci vhodnejsi alebo doplnkovy krok presne v momente, ked je navstevnik pripraveny konat.",
  "Ukaze, kde sa lame konverzia a na ktorych miestach sa ludia najcastejsie zaseknu.",
];

const outcomes = [
  "Kratsia cesta k vysledku a menej stratenych navstevnikov",
  "Vyssia konverzia z existujucej navstevnosti",
  "Lepsie odporucanie relevantneho dalsieho kroku",
  "Presnejsie data o tom, kde web brzdi pouzivatela",
];

const examples = [
  {
    title: "Financny web",
    prompt: "Chcem znizit mesacnu splatku hypoteky.",
    answer:
      "AI vrstva rozpozna intent, odlisi refinancovanie od novej hypoteky a posle navstevnika rovno do spravneho flowu.",
  },
  {
    title: "Marketplace / sluzby",
    prompt: "Potrebujem niekoho na rekonstrukciu kupelne.",
    answer:
      "Namiesto hladania cez kategorie alebo filtre dostane clovek relevantnu sluzbu, spravny dopytovy formular a odporucany dalsi krok.",
  },
  {
    title: "Rental / discovery",
    prompt: "Na vikend potrebujem naradie na brusenie stareho plotu.",
    answer:
      "AI vrstva rozpozna situaciu, navrhne spravny typ naradia alebo sluzby a dovedie pouzivatela k rezervacii bez bludenia.",
  },
];

const journeySteps = [
  {
    title: "Pouzivatel napise, co chce vyriesit",
    text: "Namiesto klikania cez menu, filtre alebo komplikovany formular jednoducho napise svoj zamer vlastnymi slovami.",
  },
  {
    title: "AI rozpozna intent a kontext webu",
    text: "Vrstva vyhodnoti, ci ide o navigaciu, odporucanie produktu, kvalifikaciu leadu alebo prilezitost na upsell.",
  },
  {
    title: "AI vyberie najvhodnejsi flow",
    text: "System urci, ktora vetva webu, ponuky alebo formulara ma najvyssiu sancu dostat cloveka k vysledku bez trenia.",
  },
  {
    title: "Pouzivatel ide rovno na spravne miesto",
    text: "Navstevnik sa dostane priamo na relevantnu podstranku, ponuku, formular alebo kombinaciu dalsich krokov.",
  },
  {
    title: "AI odporuci dalsi relevantny krok",
    text: "Ked je vhodny moment, vrstva navrhne lepsiu variantu, doplnkovu sluzbu alebo dalsiu akciu s vyssou pravdepodobnostou dokoncenia.",
  },
  {
    title: "Z interakcii vznikaju pouzitelne insighty",
    text: "Kazda konverzacia ukazuje, kde je web nejasny, kde sa ludia stracaju a ktore trasy vedu najspolahlivejsie ku konverzii.",
  },
];

const pricing = [
  {
    name: "Jednoduchšia implementácia",
    price: "1 500 € jednorazovo",
    text: "Pre jednoduchšie weby alebo jednu hlavnú rozhodovaciu vrstvu.",
  },
  {
    name: "Zložitejšia implementácia",
    price: "2 500 € jednorazovo",
    text: "Pre väčšie weby s viacerými vetvami, ponukami a miestami, kde sa láme konverzia.",
  },
  {
    name: "Mesačné doladenie",
    price: "190 € / mesiac",
    text: "Optimalizácia podľa dát a reálneho správania návštevníkov. Úpravy pri zmene webu, obsahu alebo rozhodovacích ciest. 1 väčšia zmena mesačne v rámci nasadenej AI vrstvy.",
  },
];

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

function AudienceCard({ title, text }: { title: string; text: string }) {
  return (
    <div data-reveal className="glass-panel rounded-[28px] p-6">
      <div className="mb-5 h-px w-16 bg-gradient-to-r from-black/35 to-black/0" />
      <h3 className="text-xl font-semibold tracking-[-0.03em] text-neutral-950">{title}</h3>
      <p className="mt-3 text-sm leading-7 text-neutral-600">{text}</p>
    </div>
  );
}

export default function BendaLabsLandingPage() {
  const [activeSection, setActiveSection] = useState<string>("hero");
  const [activeStep, setActiveStep] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isDesktopStory, setIsDesktopStory] = useState(false);
  const stepRefs = useRef<Array<HTMLDivElement | null>>([]);
  const storyFrameRef = useRef<number | null>(null);

  const activeJourneyStep = journeySteps[activeStep] ?? journeySteps[0];

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
            <div className="text-xs text-neutral-500">AI vrstva, ktora meni sposob pouzivania webu</div>
          </div>

          <nav className="hidden items-center gap-6 text-sm text-neutral-500 lg:flex">
            {sections.slice(1).map((section) => (
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
            {sections.map((section) => (
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

      <main>
        <section
          id="hero"
          data-section
          className="section-surface-white mx-auto max-w-7xl px-6 pb-8 pt-6 sm:pb-10 sm:pt-8"
        >
          <div data-reveal className="max-w-4xl pt-1">
            <SectionTag>AI vrstva pre weby</SectionTag>
            <h1
              className="mt-5 text-[3rem] font-semibold leading-[0.94] tracking-[-0.06em] text-neutral-950 sm:text-[4.2rem] xl:text-[4.8rem]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Navstevnik nemusi hladat v menu. Napise, co chce, a web ho tam dovedie.
            </h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-neutral-600 sm:text-xl">
              AI vrstva pre weby, ktora meni sposob pouzivania webu. Namiesto bludenia cez menu,
              filtre a formulare navstevnik napise svoj zamer a dostane spravny dalsi krok.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              {[
                "Komplexne weby s viacerymi cestami ku konverzii",
                "Jeden vstup pre intent, navigaciu a odporucanie",
                "Audit bot ukaze realne miesta, kde sa lame konverzia",
              ].map((item) => (
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
                Spustit rychly audit
              </button>
              <button
                type="button"
                onClick={() => scrollToSection("kontakt")}
                className="rounded-full border border-black/10 bg-black/[0.03] px-6 py-3.5 text-sm font-medium text-neutral-700 hover:bg-black/[0.06]"
              >
                Kontakt / CTA
              </button>
            </div>
          </div>
        </section>

        <section
          id="audit"
          data-section
          className="section-divider section-surface-soft scroll-mt-24"
        >
          <div className="mx-auto max-w-7xl px-6 py-8 sm:py-10">
            <div data-reveal className="mx-auto max-w-6xl">
              <AuditBot onRequestProposal={() => scrollToSection("kontakt")} />
            </div>
          </div>
        </section>

        <section id="pre-koho" data-section className="section-divider section-surface-tint">
          <div className="mx-auto max-w-7xl px-6 py-16 sm:py-20">
            <div data-reveal className="max-w-3xl">
              <SectionTag>Pre koho to je</SectionTag>
              <h2
                className="mt-5 text-3xl font-semibold tracking-[-0.05em] text-neutral-950 sm:text-5xl"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Pre weby, kde je silna ponuka, ale clovek sa pred vysledkom stale straca.
              </h2>
              <p className="mt-5 text-lg leading-8 text-neutral-600">
                Funguje napriec business use-casmi. Nie len pre financie. Dolezita je komplexita
                ponuky, mnozstvo ciest a moment, ked navstevnik nevie, kam presne patri.
              </p>
            </div>

            <div className="mt-10 grid gap-4 md:grid-cols-2">
              {audiences.map((item) => (
                <AudienceCard key={item.title} title={item.title} text={item.text} />
              ))}
            </div>
          </div>
        </section>

        <section id="co-robi" data-section className="section-divider section-surface-white">
          <div className="mx-auto max-w-7xl px-6 py-16 sm:py-20">
            <div className="grid gap-12 lg:grid-cols-[0.88fr_1.12fr]">
              <div data-reveal>
                <SectionTag>Co robi AI vrstva</SectionTag>
                <h2
                  className="mt-5 text-3xl font-semibold tracking-[-0.05em] text-neutral-950 sm:text-5xl"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  Nie dalsi widget. Nova vrstva rozhodovania, navigacie a odporucania.
                </h2>
                <p className="mt-5 text-lg leading-8 text-neutral-600">
                  Clovek neprichadza s nazvom produktu ani s presnou kategoriou. Prichadza s tym,
                  co chce vyriesit. Prave tam sa lame konverzia.
                </p>

                <div className="mt-8 grid gap-3">
                  {outcomes.map((item) => (
                    <div
                      key={item}
                      className="rounded-[22px] border border-black/8 bg-white/72 px-4 py-4 text-sm text-neutral-700 shadow-[0_12px_36px_rgba(17,17,17,0.04)]"
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {features.map((item, index) => (
                  <div key={item} data-reveal className="glass-panel rounded-[28px] p-6">
                    <div className="text-[11px] uppercase tracking-[0.22em] text-neutral-500">
                      0{index + 1}
                    </div>
                    <div className="mt-4 text-xl font-semibold tracking-[-0.03em] text-neutral-950">
                      {item}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="priklady" data-section className="section-divider section-surface-soft">
          <div className="mx-auto max-w-7xl px-6 py-16 sm:py-20">
            <div data-reveal className="max-w-3xl">
              <SectionTag>Priklady pouzitia</SectionTag>
              <h2
                className="mt-5 text-3xl font-semibold tracking-[-0.05em] text-neutral-950 sm:text-5xl"
                style={{ fontFamily: "var(--font-display)" }}
              >
                AI nevedie cloveka cez menu. Vedie ho cez jeho zamer.
              </h2>
            </div>

            <div className="mt-10 grid gap-4 lg:grid-cols-3">
              {examples.map((example, index) => (
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

        <section id="ako-to-funguje" data-section className="section-divider section-surface-tint">
          <div className="mx-auto max-w-7xl px-6 py-16 sm:py-20">
            <div data-reveal className="max-w-3xl">
              <SectionTag>Ako to funguje</SectionTag>
              <h2
                className="mt-5 text-3xl font-semibold tracking-[-0.05em] text-neutral-950 sm:text-5xl"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Stabilny flow od intentu po insighty, bez preskakovania krokov.
              </h2>
              <p className="mt-5 text-lg leading-8 text-neutral-600">
                Na desktope sa aktivny krok urcuje podla triggeru, ktory je najblizsie stredu
                viewportu. Na mobile a tablete sa sekcia prepne do jednoducheho stacked layoutu bez
                sticky spravania.
              </p>
            </div>

            <div className="mt-12 hidden gap-8 xl:grid xl:grid-cols-[0.92fr_1.08fr] xl:items-start">
              <div className="xl:sticky xl:top-28">
                <div data-card-active="true" className="glass-panel rounded-[32px] p-6 sm:p-8">
                  <div className="text-[11px] uppercase tracking-[0.22em] text-neutral-500">
                    Aktivny krok
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
                {journeySteps.map((step, index) => (
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
                      Krok 0{index + 1}
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
              {journeySteps.map((step, index) => (
                <div key={step.title} data-reveal className="glass-panel rounded-[28px] p-6">
                  <div className="text-[11px] uppercase tracking-[0.22em] text-neutral-500">
                    Krok 0{index + 1}
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

        <section id="cennik" data-section className="section-divider section-surface-white">
          <div className="mx-auto max-w-7xl px-6 py-16 sm:py-20">
            <div data-reveal className="max-w-3xl">
              <SectionTag>Cennik</SectionTag>
              <h2
                className="mt-5 text-3xl font-semibold tracking-[-0.05em] text-neutral-950 sm:text-5xl"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Jasny pricing pre prvu fazu aj priebezne doladenie.
              </h2>
            </div>

            <div className="mt-10 grid gap-4 lg:grid-cols-[1fr_1fr_0.88fr]" data-tier-count={3}>
              <div data-reveal className="glass-panel rounded-[30px] p-6">
                <div className="text-[11px] uppercase tracking-[0.22em] text-neutral-500">Implementácia</div>
                <p className="mt-4 text-sm leading-7 text-neutral-600">
                  Vyberáte si jednu z dvoch úrovní nasadenia podľa komplexity webu a počtu rozhodovacích miest.
                </p>

                <div className="mt-6 space-y-4">
                  <div className="rounded-[24px] border border-black/8 bg-white/70 p-5 shadow-[0_12px_30px_rgba(17,17,17,0.04)]">
                    <div className="text-[11px] uppercase tracking-[0.22em] text-neutral-500">Varianta 1</div>
                    <h3 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-neutral-950">
                      Jednoduchšia implementácia
                    </h3>
                    <div className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-neutral-950">
                      1 500 € <span className="text-lg text-neutral-500">jednorazovo</span>
                    </div>
                    <p className="mt-4 text-sm leading-7 text-neutral-600">
                      Pre jednoduchšie weby alebo jednu hlavnú rozhodovaciu vrstvu.
                    </p>
                  </div>

                  <div className="rounded-[24px] border border-black/8 bg-black/[0.02] p-5">
                    <div className="text-[11px] uppercase tracking-[0.22em] text-neutral-500">Varianta 2</div>
                    <h3 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-neutral-950">
                      Zložitejšia implementácia
                    </h3>
                    <div className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-neutral-950">
                      2 500 € <span className="text-lg text-neutral-500">jednorazovo</span>
                    </div>
                    <p className="mt-4 text-sm leading-7 text-neutral-600">
                      Pre väčšie weby s viacerými vetvami, ponukami a miestami, kde sa láme konverzia.
                    </p>
                  </div>
                </div>
              </div>

              <div data-reveal className="glass-panel rounded-[30px] p-6">
                <div className="text-[11px] uppercase tracking-[0.22em] text-neutral-500">Mesačné doladenie</div>
                <div className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-neutral-950">
                  190 € <span className="text-lg text-neutral-500">/ mesiac</span>
                </div>
                <div className="mt-5 space-y-3 text-sm leading-7 text-neutral-600">
                  <div>Optimalizácia podľa dát a reálneho správania návštevníkov.</div>
                  <div>Úpravy pri zmene webu, obsahu alebo rozhodovacích ciest.</div>
                  <div>1 väčšia mesačná zmena v rámci nasadenej AI vrstvy.</div>
                </div>
              </div>

              <div data-reveal className="glass-panel rounded-[30px] p-6">
                <div className="text-[11px] uppercase tracking-[0.22em] text-neutral-500">
                  AI computing power
                </div>
                <div className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-neutral-950">
                  odhad 10 až 100 €
                  <span className="text-lg text-neutral-500"> / mesiac</span>
                </div>
                <div className="mt-5 space-y-3 text-sm leading-7 text-neutral-600">
                  <div>Podľa reálneho používania, návštevnosti a náročnosti nasadenia.</div>
                  <div>Spotreba ide priamo cez vlastný OpenAI Developer Platform účet klienta.</div>
                  <div>BendaLabs zabezpečuje implementáciu, napojenie, logiku a priebežné doladenie.</div>
                </div>
              </div>
            </div>

              {pricing.length === 4 && (
            <div className="mt-10 grid gap-4 lg:grid-cols-[1fr_1fr_0.88fr]">
              {pricing.map((tier) => (
                <div key={tier.name} data-reveal className="glass-panel rounded-[30px] p-6">
                  <div className="text-[11px] uppercase tracking-[0.22em] text-neutral-500">
                    {tier.name}
                  </div>
                  <div className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-neutral-950">
                    {tier.price}
                  </div>
                  <p className="mt-5 text-sm leading-7 text-neutral-600">{tier.text}</p>
                </div>
              ))}

              <div data-reveal className="glass-panel rounded-[30px] p-6">
                <div className="text-[11px] uppercase tracking-[0.22em] text-neutral-500">
                  AI computing power
                </div>
                <div className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-neutral-950">
                  odhad 10 až 100 €
                  <span className="text-lg text-neutral-500"> / mesiac</span>
                </div>
                <div className="mt-5 space-y-3 text-sm leading-7 text-neutral-600">
                  <div>Podľa reálneho používania, návštevnosti a náročnosti nasadenia.</div>
                  <div>Spotreba ide priamo cez vlastný OpenAI Developer Platform účet klienta.</div>
                  <div>BendaLabs zabezpečuje implementáciu, napojenie, logiku a priebežné doladenie.</div>
                </div>
              </div>
            </div>
              )}
          </div>
        </section>

        <section id="kontakt" data-section className="section-divider section-surface-soft">
          <div className="mx-auto max-w-7xl px-6 py-16 sm:py-20">
            <div className="glass-panel rounded-[34px] p-8 sm:p-10">
              <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
                <div data-reveal>
                  <SectionTag>Kontakt / CTA</SectionTag>
                  <h2
                    className="mt-5 text-3xl font-semibold tracking-[-0.05em] text-neutral-950 sm:text-5xl"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    Poslite svoj web a ukazem vam, kde sa lame konverzia.
                  </h2>
                  <p className="mt-5 max-w-2xl text-lg leading-8 text-neutral-600">
                    Staci poslat URL a kratko pomenovat, kde sa podla vas navstevnici stracaju alebo
                    co ma byt pre nich citelne jednoduchsie.
                  </p>
                </div>

                <div
                  data-reveal
                  className="rounded-[28px] border border-black/10 bg-black p-6 text-white lg:justify-self-end"
                >
                  <div className="text-[11px] uppercase tracking-[0.22em] text-white/55">Kontakt</div>
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
                        "mailto:hello@bendalabs.sk?subject=AI%20audit%20webu&body=Ahoj,%20posielam%20URL%20na%20audit:%20",
                        "_self",
                      )
                    }
                    className="mt-6 rounded-full border border-white bg-white px-5 py-3 text-sm font-medium text-black hover:bg-neutral-200"
                  >
                    Poziadat o konkretny navrh
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
