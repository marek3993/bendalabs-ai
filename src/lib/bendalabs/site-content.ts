export type SiteLocale = "sk" | "cs";

export type SiteCard = {
  title: string;
  text: string;
};

export type ServicePageSection = {
  id: string;
  label: string;
  title: string;
  description: string;
  surface: "white" | "soft" | "tint";
  cards?: ReadonlyArray<SiteCard>;
  bullets?: ReadonlyArray<string>;
  statements?: ReadonlyArray<string>;
  columns?: 2 | 3;
};

type SiteNavLink = {
  href: string;
  label: string;
};

type HomeExample = {
  title: string;
  prompt: string;
  answer: string;
};

type HomeAuditBlock = {
  badge: string;
  title: string;
  subtext: string;
  description?: string;
  benefits?: ReadonlyArray<string>;
  trustItems?: ReadonlyArray<string>;
  explainerLine?: string;
  previewIdleTitle?: string;
  previewIdleSteps?: ReadonlyArray<string>;
  loadingSteps?: ReadonlyArray<string>;
  placeholder: string;
  submitLabel: string;
  variant?: "featured";
};

type JourneyStep = {
  title: string;
  text: string;
};

type HomePricingTier = {
  variant: string;
  name: string;
  price: string;
  cadenceLabel?: string;
  text: string;
  tone: "light" | "muted";
};

type HomePricingBlock = {
  implementationLabel: string;
  implementationDescription: string;
  supportLabel: string;
  supportPrice: string;
  supportCadenceLabel: string;
  supportLines: ReadonlyArray<string>;
  computeLabel: string;
  computePrice: string;
  computeCadenceLabel: string;
  computeLines: ReadonlyArray<string>;
  tiers: ReadonlyArray<HomePricingTier>;
};

type HomeFlexibilityBlock = {
  tag: string;
  title: string;
  body: string;
  supportingLine?: string;
};

type AuditBotCopy = {
  badge: string;
  title: string;
  subtext: string;
  description: string;
  submitLabel: string;
  loadingLabel: string;
  loadingSteps: ReadonlyArray<string>;
  placeholder: string;
  invalidUrlMessage: string;
  genericErrorMessage: string;
  activeAuditLabel: string;
  fitCardTitle: string;
  scoreLabel: string;
  solutionCardTitle: string;
  whyFitTitle: string;
  frictionTitle: string;
  upsellTitle: string;
  phaseOneTitle: string;
  exampleFlowsTitle: string;
  userIntentLabel: string;
  aiActionLabel: string;
  businessValueLabel: string;
  nextStepLabel: string;
  proposalTitle: string;
  proposalDescription: string;
  proposalButtonLabel: string;
  fitLabels: {
    low: string;
    borderline: string;
    good: string;
    strong: string;
  };
};

type HomePageContent = {
  brandTagline: string;
  sections: ReadonlyArray<{ id: string; label: string }>;
  heroTag: string;
  heroTitle: string;
  heroDescription: string;
  heroChips: ReadonlyArray<string>;
  heroPrimaryCta: string;
  heroSecondaryCta: string;
  auditBlock?: HomeAuditBlock;
  audiencesTag: string;
  audiencesTitle: string;
  audiencesDescription: string;
  audiences: ReadonlyArray<SiteCard>;
  featuresTag: string;
  featuresTitle: string;
  featuresDescription: string;
  features: ReadonlyArray<string>;
  outcomes: ReadonlyArray<string>;
  examplesTag: string;
  examplesTitle: string;
  examples: ReadonlyArray<HomeExample>;
  journeyTag: string;
  journeyTitle: string;
  journeyDescription: string;
  activeStepLabel: string;
  stepLabel: string;
  journeySteps: ReadonlyArray<JourneyStep>;
  flexibilityBlock: HomeFlexibilityBlock;
  pricingTag: string;
  pricingTitle: string;
  pricing: HomePricingBlock;
  contactTag: string;
  contactTitle: string;
  contactDescription: string;
  contactCardLabel: string;
  contactButtonLabel: string;
  contactMailSubject: string;
  contactMailBody: string;
};

type ServicePageContent = {
  metadataTitle: string;
  metadataDescription: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  heroChips: ReadonlyArray<string>;
  auditBot: Pick<
    AuditBotCopy,
    "badge" | "proposalTitle" | "proposalDescription" | "proposalButtonLabel"
  >;
  sections: ReadonlyArray<ServicePageSection>;
  ctaTitle: string;
  ctaText: string;
  ctaButtonLabel: string;
  ctaMailSubject: string;
};

const sitePaths = {
  sk: {
    home: "/",
    audit: "/ai-audit-webu",
    finance: "/ai-vrstva-pre-financne-a-poistne-weby",
    marketplace: "/ai-vrstva-pre-marketplace-a-rental-weby",
  },
  cs: {
    home: "/cs",
    audit: "/cs/ai-audit-webu",
    finance: "/cs/ai-vrstva-pro-financni-a-pojistne-weby",
    marketplace: "/cs/ai-vrstva-pro-marketplace-a-rental-weby",
  },
} as const;

const chromeContent = {
  sk: {
    brandTagline: "AI vrstva pre weby s viacerými cestami ku konverzii",
    nav: [
      { href: sitePaths.sk.home, label: "Domov" },
      { href: sitePaths.sk.finance, label: "Financie a poistenie" },
      { href: sitePaths.sk.marketplace, label: "Marketplace a rental" },
      { href: sitePaths.sk.audit, label: "AI audit webu" },
    ],
    openCtaLabel: "Otvoriť CTA",
    openAuditLabel: "Pozrieť AI audit webu",
    ctaTag: "CTA",
    contactLabel: "Kontakt",
  },
  cs: {
    brandTagline: "AI vrstva pro weby s více cestami ke konverzi",
    nav: [
      { href: sitePaths.cs.home, label: "Domů" },
      { href: sitePaths.cs.finance, label: "Finance a pojištění" },
      { href: sitePaths.cs.marketplace, label: "Marketplace a rental" },
      { href: sitePaths.cs.audit, label: "AI audit webu" },
    ],
    openCtaLabel: "Otevřít CTA",
    openAuditLabel: "Zobrazit AI audit webu",
    ctaTag: "CTA",
    contactLabel: "Kontakt",
  },
} as const;

const auditBotDefaults = {
  sk: {
    badge: "AI audit bot",
    title: "Zadajte adresu svojho webu a do 5 sekúnd uvidíte, kde vám unikajú zákazníci.",
    subtext: "Bez registrácie. Bez zadávania e-mailu. Len rýchly audit webu.",
    description:
      "Audit načíta homepage aj relevantné podstránky a vyhodnotí, kde by AI vrstva vedela zjednodušiť navigáciu, odporúčanie a lead flow.",
    submitLabel: "Spustiť bezplatný audit",
    loadingLabel: "Analyzujem web",
    loadingSteps: [
      "Načítavam web...",
      "Vyhodnocujem, kde by AI vrstva vedela urýchliť výber služby...",
      "Vyhodnocujem potenciál AI vrstvy...",
      "Pripravujem odporúčanie...",
    ] as const,
    placeholder: "napr. https://vasafirma.sk",
    invalidUrlMessage: "Zadajte platnú webovú adresu. Stačí aj doména ako bendalabs.sk.",
    genericErrorMessage: "Audit sa teraz nepodarilo vygenerovať.",
    activeAuditLabel: "Práve beží audit",
    fitCardTitle: "Vhodnosť pre AI vrstvu",
    scoreLabel: "Skóre",
    solutionCardTitle: "Odporúčaný typ riešenia",
    whyFitTitle: "Prečo je alebo nie je web vhodný",
    frictionTitle: "Kde by AI vrstva pravdepodobne pomohla pred ďalším krokom",
    upsellTitle: "Kde je priestor na upsell alebo cross-sell",
    phaseOneTitle: "Ako by mohla vyzerať 1. fáza nasadenia",
    exampleFlowsTitle: "3 príklady, ako by AI vrstva pomáhala návštevníkom",
    userIntentLabel: "Používateľský zámer",
    aiActionLabel: "AI akcia",
    businessValueLabel: "Biznisová hodnota",
    nextStepLabel: "Ďalší krok",
    proposalTitle: "Chcete plný audit a konkrétny návrh pre váš web?",
    proposalDescription:
      "Pošlite web a pripravím konkrétny návrh AI vrstvy, prioritné miesta zásahu a realistickú prvú fázu nasadenia.",
    proposalButtonLabel: "Požiadať o konkrétny návrh",
    fitLabels: {
      low: "Slabý fit",
      borderline: "Hraničný fit",
      good: "Dobrý fit",
      strong: "Veľmi silný fit",
    },
  },
  cs: {
    badge: "AI audit bot",
    title: "Zadejte URL a hned uvidíte, kde by AI vrstva dokázala změnit způsob používání webu.",
    subtext: "",
    description:
      "Audit načte homepage, projde relevantní podstránky a vyhodnotí, kde by AI vrstva dokázala zjednodušit navigaci, doporučení, lead flow a další krok uživatele.",
    submitLabel: "Analyzovat web",
    loadingLabel: "Analyzuji web",
    loadingSteps: [
      "Načítám web...",
      "Vyhodnocuji, kde by AI vrstva dokazala urychlit vyber sluzby...",
      "Vyhodnocuji potenciál AI vrstvy...",
      "Připravuji doporučení...",
    ] as const,
    placeholder: "např. bendalabs.cz nebo https://bendalabs.cz",
    invalidUrlMessage: "Zadejte platnou webovou adresu. Stačí i doména jako bendalabs.cz.",
    genericErrorMessage: "Audit se teď nepodařilo vygenerovat.",
    activeAuditLabel: "Audit právě probíhá",
    fitCardTitle: "Vhodnost pro AI vrstvu",
    scoreLabel: "Skóre",
    solutionCardTitle: "Doporučený typ řešení",
    whyFitTitle: "Proč web vhodný je nebo není",
    frictionTitle: "Kde by AI vrstva pravdepodobne pomohla pred dalsim krokem",
    upsellTitle: "Kde je prostor pro upsell nebo cross-sell",
    phaseOneTitle: "Jak může vypadat 1. fáze nasazení",
    exampleFlowsTitle: "3 příklady, jak by AI vrstva pomáhala návštěvníkům",
    userIntentLabel: "Uživatelský záměr",
    aiActionLabel: "AI akce",
    businessValueLabel: "Byznysová hodnota",
    nextStepLabel: "Další krok",
    proposalTitle: "Chcete plný audit a konkrétní návrh pro váš web?",
    proposalDescription:
      "Pošlete web a připravím konkrétní návrh AI vrstvy, prioritní místa zásahu a realistickou první fázi nasazení.",
    proposalButtonLabel: "Požádat o konkrétní návrh",
    fitLabels: {
      low: "Slabý fit",
      borderline: "Hraniční fit",
      good: "Dobrý fit",
      strong: "Velmi silný fit",
    },
  },
} as const satisfies Record<SiteLocale, AuditBotCopy>;

const homeContent = {
  sk: {
    brandTagline: chromeContent.sk.brandTagline,
    sections: [
      { id: "hero", label: "Hero" },
      { id: "audit", label: "Audit" },
      { id: "priklady", label: "Príklady" },
      { id: "pre-koho", label: "Pre koho" },
      { id: "ako-to-funguje", label: "Ako to funguje" },
      { id: "cennik", label: "Cenník" },
      { id: "kontakt", label: "Kontakt" },
    ],
    heroTag: "AI vrstva pre weby",
    heroTitle: "Návštevník nemusí hľadať v menu. Napíše, čo chce, a web spraví prácu za neho.",
    heroDescription:
      "AI vrstva pre weby, ktorá mení spôsob používania webu. Namiesto blúdenia cez menu, filtre a formuláre návštevník napíše svoj zámer a dostane správny ďalší krok.",
    heroChips: [
      "Komplexné weby s viacerými cestami ku konverzii",
      "Jeden vstup pre intent, navigáciu a odporúčanie",
      "Nasadenie nad existujúci web bez prerábky celej stránky",
    ],
    heroPrimaryCta: "Spustiť rýchly audit",
    heroSecondaryCta: "Kontakt / CTA",
    auditBlock: {
      badge: "● VYSKÚŠAJTE NA VLASTNOM WEBE",
      title: "Zadajte adresu svojho webu a do 5 sekúnd uvidíte, kde vám unikajú zákazníci.",
      subtext: "Bez registrácie. Bez e-mailu. Len výsledok, nie otrava.",
      description: "",
      trustItems: ["\u2248 5 sek\u00fand", "bez e-mailu", "bez registr\u00e1cie"],
      explainerLine:
        "Na\u010d\u00edta homepage | prejde relevantn\u00e9 podstr\u00e1nky | uk\u00e1\u017ee slab\u00e9 miesta",
      previewIdleTitle: "Zadajte URL a spustite audit",
      previewIdleSteps: [
        "Na\u010d\u00edta homepage",
        "Prejde relevantn\u00e9 podstr\u00e1nky",
        "Vyhodnot\u00ed navig\u00e1ciu",
        "N\u00e1jde slab\u00e9 miesta v lead flow",
      ],
      loadingSteps: [
        "Na\u010d\u00edtavam web...",
        "H\u013ead\u00e1m miesta, kde n\u00e1v\u0161tevn\u00edk str\u00e1ca orient\u00e1ciu...",
        "Vyhodnocujem potenci\u00e1l AI vrstvy...",
        "Pripravujem odpor\u00fa\u010danie...",
      ],
      benefits: [
        "✓ načíta homepage",
        "✓ prejde relevantné podstránky",
        "✓ ukáže, kde AI vrstva pomôže s navigáciou, odporúčaním a lead flow",
      ],
      placeholder: "napr. https://vasafirma.sk",
      submitLabel: "Spustiť bezplatný audit →",
      variant: "featured",
    },
    audiencesTag: "Pre koho to je",
    audiencesTitle: "Pre weby, kde je silná ponuka, ale návštevník sa k správnemu výsledku nemusí dostať hneď.",
    audiencesDescription:
      "Funguje naprieč rôznymi biznis use-case-mi. Nielen pre financie. Dôležitá je komplexita ponuky, množstvo ciest a moment, keď návštevník potrebuje rýchlo nájsť správny ďalší krok.",
    audiences: [
      {
        title: "Marketplace a service weby",
        text: "Weby, kde človek prichádza s potrebou, ale nevie, ktorú kategóriu, ponuku alebo flow má otvoriť ako prvý.",
      },
      {
        title: "Finančné a poistné portály",
        text: "Komplexné rozhodovanie medzi produktmi, refinancovaním, kalkulačkami, formulármi a správnou vetvou dopytu.",
      },
      {
        title: "Rental a discovery use-casy",
        text: "Weby typu Rentulo, kde návštevník nehľadá názov kategórie, ale čo chce vyriešiť, prenajať alebo objaviť.",
      },
      {
        title: "Katalógy produktov a služieb",
        text: "Široká ponuka, viacero ciest ku konverzii a potreba dostať človeka k správnej voľbe bez trenia a zbytočného klikania.",
      },
    ],
    featuresTag: "Čo robí AI vrstva",
    featuresTitle: "Nie ďalší widget. Nová vrstva rozhodovania, navigácie a odporúčania.",
    featuresDescription:
      "Človek neprichádza s názvom produktu ani s presnou kategóriou. Prichádza s tým, čo chce vyriešiť. Práve tam sa láme konverzia.",
    features: [
      "Pochopí, čo chce človek reálne urobiť, aj keď to nepovie názvom produktu alebo kategórie.",
      "Pošle ho do správnej cesty bez blúdenia cez menu, filtre, porovnávania alebo nesprávne formuláre.",
      "Odporučí vhodnejší alebo doplnkový krok presne v momente, keď je návštevník pripravený konať.",
      "Ukáže, kde sa láme konverzia a na ktorých miestach sa ľudia najčastejšie zaseknú.",
    ],
    outcomes: [
      "Kratšia cesta k výsledku a menej stratených návštevníkov",
      "Vyššia konverzia z existujúcej návštevnosti",
      "Lepšie odporúčanie relevantného ďalšieho kroku",
      "Presnejšie dáta o tom, kde web brzdí používateľa",
    ],
    examplesTag: "Príklady použitia",
    examplesTitle: "AI nevedie človeka cez menu. Vedie ho cez jeho zámer.",
    examples: [
      {
        title: "Finančný web",
        prompt: "Chcem znížiť mesačnú splátku hypotéky.",
        answer:
          "AI vrstva rozpozná intent, odlíši refinancovanie od novej hypotéky a pošle návštevníka rovno do správneho flowu.",
      },
      {
        title: "Marketplace / služby",
        prompt: "Potrebujem niekoho na rekonštrukciu kúpeľne.",
        answer:
          "Namiesto hľadania cez kategórie alebo filtre dostane človek relevantnú službu, správny dopytový formulár a odporúčaný ďalší krok.",
      },
      {
        title: "Rental / discovery",
        prompt: "Na víkend potrebujem náradie na brúsenie starého plotu.",
        answer:
          "AI vrstva rozpozná situáciu, navrhne správny typ náradia alebo služby a dovedie používateľa k rezervácii bez blúdenia.",
      },
    ],
    journeyTag: "Ako to funguje",
    journeyTitle: "Stabilný flow od intentu po insighty, bez preskakovania krokov.",
    journeyDescription:
      "Návštevník napíše, čo chce vyriešiť. AI vrstva nad webom pochopí jeho zámer, zohľadní kontext webu a navedie ho na správny ďalší krok bez prerábky celej stránky.",
    activeStepLabel: "Aktívny krok",
    stepLabel: "Krok",
    journeySteps: [
      {
        title: "Používateľ napíše, čo chce vyriešiť",
        text: "Namiesto klikania cez menu, filtre alebo komplikovaný formulár jednoducho napíše svoj zámer vlastnými slovami.",
      },
      {
        title: "AI rozpozná intent a kontext webu",
        text: "Vrstva vyhodnotí, či ide o navigáciu, odporúčanie produktu, kvalifikáciu leadu alebo príležitosť na upsell.",
      },
      {
        title: "AI vyberie najvhodnejší flow",
        text: "Systém určí, ktorá vetva webu, ponuky alebo formulára má najvyššiu šancu dostať človeka k výsledku bez trenia.",
      },
      {
        title: "Používateľ ide rovno na správne miesto",
        text: "Návštevník sa dostane priamo na relevantnú podstránku, ponuku, formulár alebo kombináciu ďalších krokov.",
      },
      {
        title: "AI odporučí ďalší relevantný krok",
        text: "Keď je vhodný moment, vrstva navrhne lepší variant, doplnkovú službu alebo ďalšiu akciu s vyššou pravdepodobnosťou dokončenia.",
      },
      {
        title: "Z interakcií vznikajú použiteľné insighty",
        text: "Každá konverzácia ukazuje, kde je web nejasný, kde sa ľudia strácajú a ktoré trasy vedú najspoľahlivejšie ku konverzii.",
      },
    ],
    flexibilityBlock: {
      tag: "FLEXIBILITA RIEŠENIA",
      title: "Možnosti sú prakticky neobmedzené.",
      body:
        "AI vrstvu vieme navrhnúť presne podľa vášho webu, ponuky a cieľov. Nemusíte prerábať celú stránku. Pridáme novú vrstvu nad existujúci web a nastavíme ju tak, aby sedela vášmu flowu.",
      supportingLine: "Bez prerábky webu. Bez zložitej migrácie. Presne podľa vášho use-case.",
    },
    pricingTag: "Cenník",
    pricingTitle: "Jasný pricing pre prvú fázu aj priebežné doladenie.",
    pricing: {
      implementationLabel: "Implementácia",
      implementationDescription:
        "Vyberáte si jednu z dvoch úrovní nasadenia podľa komplexity webu a počtu rozhodovacích miest.",
      supportLabel: "Mesačné doladenie",
      supportPrice: "190 EUR",
      supportCadenceLabel: "/ mesiac",
      supportLines: [
        "Optimalizácia podľa dát a reálneho správania návštevníkov.",
        "Úpravy pri zmene webu, obsahu alebo rozhodovacích ciest.",
        "1 väčšia mesačná zmena v rámci nasadenej AI vrstvy.",
      ],
      computeLabel: "AI výpočtový výkon",
      computePrice: "odhad 10 až 100 EUR",
      computeCadenceLabel: "/ mesiac",
      computeLines: [
        "Podľa reálneho používania, návštevnosti a náročnosti nasadenia.",
        "Spotreba ide priamo cez vlastný OpenAI Developer Platform účet klienta.",
        "BendaLabs zabezpečuje implementáciu, napojenie, logiku a priebežné doladenie.",
      ],
      tiers: [
        {
          variant: "Varianta 1",
          name: "Jednoduchšia implementácia",
          price: "1 500 EUR",
          cadenceLabel: "jednorazovo",
          text: "Pre jednoduchšie weby alebo jednu hlavnú rozhodovaciu vrstvu.",
          tone: "light",
        },
        {
          variant: "Varianta 2",
          name: "Zložitejšia implementácia",
          price: "2 500 EUR",
          cadenceLabel: "jednorazovo",
          text: "Pre väčšie weby s viacerými vetvami, ponukami a miestami, kde sa láme konverzia.",
          tone: "muted",
        },
      ],
    },
    contactTag: "Kontakt / CTA",
    contactTitle: "Pošlite svoj web a ukážem vám, kde sa láme konverzia.",
    contactDescription:
      "Stačí poslať URL a krátko pomenovať, kde sa podľa vás návštevníci strácajú alebo čo má byť pre nich citeľne jednoduchšie.",
    contactCardLabel: "Kontakt",
    contactButtonLabel: "Požiadať o konkrétny návrh",
    contactMailSubject: "AI audit webu",
    contactMailBody: "Ahoj, posielam URL na audit: ",
  },
  cs: {
    brandTagline: chromeContent.cs.brandTagline,
    sections: [
      { id: "hero", label: "Hero" },
      { id: "audit", label: "Audit" },
      { id: "priklady", label: "Příklady" },
      { id: "pro-koho", label: "Pro koho" },
      { id: "jak-to-funguje", label: "Jak to funguje" },
      { id: "cenik", label: "Ceník" },
      { id: "kontakt", label: "Kontakt" },
    ],
    heroTag: "AI vrstva pro weby",
    heroTitle: "Návštěvník nemusí hledat v menu. Napíše, co chce, a web ho tam dovede.",
    heroDescription:
      "AI vrstva pro weby, která mění způsob používání webu. Místo bloudění přes menu, filtry a formuláře návštěvník napíše svůj záměr a dostane správný další krok.",
    heroChips: [
      "Komplexní weby s více cestami ke konverzi",
      "Jeden vstup pro intent, navigaci a doporučení",
      "Nasazení nad existující web bez předělávání celé stránky",
    ],
    heroPrimaryCta: "Spustit rychlý audit",
    heroSecondaryCta: "Kontakt / CTA",
    audiencesTag: "Pro koho to je",
    audiencesTitle: "Pro weby, kde je silná nabídka, ale návštěvník se ke správnému výsledku nemusí dostat hned.",
    audiencesDescription:
      "Funguje napříč různými business use-case-y. Nejen pro finance. Důležitá je komplexita nabídky, množství cest a moment, kdy návštěvník potřebuje rychle najít správný další krok.",
    audiences: [
      {
        title: "Marketplace a service weby",
        text: "Weby, kde člověk přichází s potřebou, ale neví, kterou kategorii, nabídku nebo flow má otevřít jako první.",
      },
      {
        title: "Finanční a pojistné portály",
        text: "Komplexní rozhodování mezi produkty, refinancováním, kalkulačkami, formuláři a správnou větví poptávky.",
      },
      {
        title: "Rental a discovery use-casy",
        text: "Weby typu Rentulo, kde návštěvník nehledá název kategorie, ale co chce vyřešit, pronajmout nebo objevit.",
      },
      {
        title: "Katalogy produktů a služeb",
        text: "Široká nabídka, více cest ke konverzi a potřeba dostat člověka ke správné volbě bez tření a zbytečného klikání.",
      },
    ],
    featuresTag: "Co dělá AI vrstva",
    featuresTitle: "Ne další widget. Nová vrstva rozhodování, navigace a doporučení.",
    featuresDescription:
      "Člověk nepřichází s názvem produktu ani s přesnou kategorií. Přichází s tím, co chce vyřešit. Právě tam se láme konverze.",
    features: [
      "Pochopí, co chce člověk reálně udělat, i když to nepojmenuje názvem produktu nebo kategorie.",
      "Pošle ho do správné cesty bez bloudění přes menu, filtry, porovnávání nebo špatné formuláře.",
      "Doporučí vhodnější nebo doplňkový krok přesně ve chvíli, kdy je návštěvník připraven jednat.",
      "Ukáže, kde se láme konverze a na kterých místech se lidé nejčastěji zaseknou.",
    ],
    outcomes: [
      "Kratší cesta k výsledku a méně ztracených návštěvníků",
      "Vyšší konverze ze stávající návštěvnosti",
      "Lepší doporučení relevantního dalšího kroku",
      "Přesnější data o tom, kde web brzdí uživatele",
    ],
    examplesTag: "Příklady použití",
    examplesTitle: "AI nevede člověka přes menu. Vede ho přes jeho záměr.",
    examples: [
      {
        title: "Finanční web",
        prompt: "Chci snížit měsíční splátku hypotéky.",
        answer:
          "AI vrstva rozpozná intent, odliší refinancování od nové hypotéky a pošle návštěvníka rovnou do správného flowu.",
      },
      {
        title: "Marketplace / služby",
        prompt: "Potřebuji někoho na rekonstrukci koupelny.",
        answer:
          "Místo hledání přes kategorie nebo filtry dostane člověk relevantní službu, správný poptávkový formulář a doporučený další krok.",
      },
      {
        title: "Rental / discovery",
        prompt: "Na víkend potřebuji nářadí na broušení starého plotu.",
        answer:
          "AI vrstva rozpozná situaci, navrhne správný typ nářadí nebo služby a dovede uživatele k rezervaci bez bloudění.",
      },
    ],
    journeyTag: "Jak to funguje",
    journeyTitle: "Stabilní flow od intentu po insighty, bez přeskakování kroků.",
    journeyDescription:
      "Návštěvník napíše, co chce vyřešit. AI vrstva nad webem pochopí jeho záměr, zohlední kontext webu a navede ho na správný další krok bez předělávání celé stránky.",
    activeStepLabel: "Aktivní krok",
    stepLabel: "Krok",
    journeySteps: [
      {
        title: "Uživatel napíše, co chce vyřešit",
        text: "Místo klikání přes menu, filtry nebo komplikovaný formulář jednoduše napíše svůj záměr vlastními slovy.",
      },
      {
        title: "AI rozpozná intent a kontext webu",
        text: "Vrstva vyhodnotí, jestli jde o navigaci, doporučení produktu, kvalifikaci leadu nebo příležitost na upsell.",
      },
      {
        title: "AI vybere nejvhodnější flow",
        text: "Systém určí, která větev webu, nabídky nebo formuláře má nejvyšší šanci dostat člověka k výsledku bez tření.",
      },
      {
        title: "Uživatel jde rovnou na správné místo",
        text: "Návštěvník se dostane přímo na relevantní podstránku, nabídku, formulář nebo kombinaci dalších kroků.",
      },
      {
        title: "AI doporučí další relevantní krok",
        text: "Když nastane vhodný moment, vrstva navrhne lepší variantu, doplňkovou službu nebo další akci s vyšší pravděpodobností dokončení.",
      },
      {
        title: "Z interakcí vznikají použitelné insighty",
        text: "Každá konverzace ukazuje, kde je web nejasný, kde se lidé ztrácejí a které trasy vedou nejspolehlivěji ke konverzi.",
      },
    ],
    flexibilityBlock: {
      tag: "FLEXIBILITA ŘEŠENÍ",
      title: "Možnosti jsou prakticky neomezené.",
      body:
        "AI vrstvu umíme navrhnout přesně podle vašeho webu, nabídky a cílů. Nemusíte předělávat celý web. Přidáme novou vrstvu nad existující web a nastavíme ji tak, aby seděla vašemu flow.",
      supportingLine: "Bez předělávky webu. Bez složité migrace. Přesně podle vašeho use-case.",
    },
    pricingTag: "Ceník",
    pricingTitle: "Jasný pricing pro první fázi i průběžné ladění.",
    pricing: {
      implementationLabel: "Implementace",
      implementationDescription:
        "Vybíráte si jednu ze dvou úrovní nasazení podle komplexity webu a počtu rozhodovacích míst.",
      supportLabel: "Měsíční ladění",
      supportPrice: "190 EUR",
      supportCadenceLabel: "/ měsíc",
      supportLines: [
        "Optimalizace podle dat a reálného chování návštěvníků.",
        "Úpravy při změně webu, obsahu nebo rozhodovacích cest.",
        "1 větší měsíční změna v rámci nasazené AI vrstvy.",
      ],
      computeLabel: "AI výpočetní výkon",
      computePrice: "odhad 10 až 100 EUR",
      computeCadenceLabel: "/ měsíc",
      computeLines: [
        "Podle reálného používání, návštěvnosti a náročnosti nasazení.",
        "Spotřeba jde přímo přes vlastní OpenAI Developer Platform účet klienta.",
        "BendaLabs zajišťuje implementaci, napojení, logiku a průběžné ladění.",
      ],
      tiers: [
        {
          variant: "Varianta 1",
          name: "Jednodušší implementace",
          price: "1 500 EUR",
          cadenceLabel: "jednorázově",
          text: "Pro jednodušší weby nebo jednu hlavní rozhodovací vrstvu.",
          tone: "light",
        },
        {
          variant: "Varianta 2",
          name: "Složitější implementace",
          price: "2 500 EUR",
          cadenceLabel: "jednorázově",
          text: "Pro větší weby s více větvemi, nabídkami a místy, kde se láme konverze.",
          tone: "muted",
        },
      ],
    },
    contactTag: "Kontakt / CTA",
    contactTitle: "Pošlete svůj web a ukážu vám, kde se láme konverze.",
    contactDescription:
      "Stačí poslat URL a krátce pojmenovat, kde se podle vás návštěvníci ztrácejí nebo co má být pro ně citelně jednodušší.",
    contactCardLabel: "Kontakt",
    contactButtonLabel: "Požádat o konkrétní návrh",
    contactMailSubject: "AI audit webu",
    contactMailBody: "Ahoj, posílám URL na audit: ",
  },
} as const satisfies Record<SiteLocale, HomePageContent>;

const auditPageContent = {
  sk: {
    metadataTitle: "AI audit webu | BendaLabs",
    metadataDescription:
      "AI audit webu ukáže, či sa web hodí na AI vrstvu, kde sa láme konverzia a ako má vyzerať prvá fáza nasadenia.",
    eyebrow: "AI audit webu",
    title: "AI audit webu",
    subtitle:
      "Ukážem, či sa váš web hodí na AI vrstvu, kde sa láme konverzia a ako môže vyzerať prvá fáza nasadenia.",
    heroChips: [
      "Audit vhodnosti pre AI vrstvu",
      "Miesta, kde sa láme konverzia",
      "Prvá fáza nasadenia",
    ],
    auditBot: {
      badge: "AI audit webu",
      proposalTitle: "Chcete plný audit a konkrétny návrh pre váš web?",
      proposalDescription:
        "Po rýchlom audite vieme prejsť na plný návrh AI vrstvy, prioritné miesta zásahu a realistickú prvú fázu nasadenia.",
      proposalButtonLabel: "Prejsť na CTA",
    },
    sections: [
      {
        id: "hodnoti",
        label: "Čo audit hodnotí",
        title: "Audit nehodnotí, či je web pekný. Hodnotí, či vie človeka dostať do správneho flowu.",
        description:
          "Pozriem sa na to, ako sa návštevník rozhoduje, kde sa stráca a či má AI vrstva reálny priestor zlepšiť výkon. Zaujíma ma, či je problém v navigácii, produktovej logike, formulároch alebo v tom, že web nevie pracovať s intentom.",
        surface: "soft",
        cards: [
          {
            title: "Rozhodovacie miesta",
            text: "Kde musí návštevník zvoliť kategóriu, produkt, kalkulačku alebo formulár skôr, ako má dosť informácií na správne rozhodnutie.",
          },
          {
            title: "Lomy konverzie",
            text: "Kde ľudia odpadajú pred formulárom, medzi detailom a objednávkou alebo pri prechode do kontaktu.",
          },
          {
            title: "Sila intentu",
            text: "Či návštevníci prichádzajú s konkrétnou úlohou a či im web vie odporučiť správny ďalší krok bez blúdenia.",
          },
          {
            title: "Pripravenosť na AI vrstvu",
            text: "Či je obsah, štruktúra a flow webu dosť jasný na to, aby AI vrstva priniesla merateľný efekt už v prvej fáze.",
          },
        ],
      },
      {
        id: "dostanete",
        label: "Čo dostanete",
        title: "Výstupom nie je všeobecný report. Výstupom je rozhodnutie, čo nasadiť ako prvé.",
        description:
          "Audit má pomôcť rozhodnúť, či nasadenie dáva zmysel, kde začať a čo nemá zmysel robiť hneď. Bez tejto vrstvy sa často rieši dizajn alebo obsah, kým skutočný problém zostáva v nesprávnom toku návštevníka.",
        surface: "white",
        bullets: [
          "Zrozumiteľný názor, či je web vhodný na AI vrstvu a ktoré scenáre majú najvyššiu šancu na prínos.",
          "Zoznam miest, kde sa dnes láme konverzia a prečo tam ľudia odpadajú.",
          "Návrh prvej fázy nasadenia: kde začať, čo presne má AI vrstva robiť a aké vetvy riešiť najprv.",
          "Odporúčanie, čo sa oplatí merať hneď po spustení, aby bolo jasné, či nasadenie funguje.",
        ],
      },
      {
        id: "meranie",
        label: "Čo sa bude merať po nasadení",
        title: "Po nasadení sa nehodnotí dojem. Hodnotí sa pohyb návštevníka a dopad na dopyt.",
        description:
          "Ak sa AI vrstva nasadí, musí byť od prvého dňa jasné, čo je úspech. Zaujíma nás, či ľudia trafia správne flowy, či sa skracuje cesta ku konverzii a či obchod dostáva kvalitnejšie vstupy.",
        surface: "tint",
        bullets: [
          "Koľko návštevníkov sa z intent vstupu dostalo do správneho flowu bez blúdenia cez menu a filtre.",
          "Pokles odpadu pred formulárom, rezerváciou alebo objednávkou.",
          "Zmena v počte dokončených dopytov alebo rezervácií po nasadení prvej fázy.",
          "Miera prijatia odporúčaných ďalších krokov alebo súvisiacich produktov.",
          "Kde sa stále objavuje trenie a čo treba doladiť v ďalšom kole.",
        ],
      },
      {
        id: "cennik",
        label: "Cenník",
        title: "Cenník je pevný. Rozdiel je len v tom, aká zložitosť dáva zmysel pre váš web.",
        description:
          "Ak web potrebuje len jednu rozhodovaciu vrstvu, implementácia je jednoduchšia. Ak má viac vetiev, viac typov formulárov alebo silnejšiu produktovú logiku, ide o zložitejšie nasadenie.",
        surface: "white",
        statements: [
          "Jednoduchšia implementácia - 1 500 EUR jednorazovo",
          "Zložitejšia implementácia - 2 500 EUR jednorazovo",
          "Mesačné doladenie - 190 EUR / mesiac",
          "AI výpočtový výkon - odhad 10 až 100 EUR / mesiac podľa reálneho používania, cez OpenAI účet klienta",
        ],
      },
    ],
    ctaTitle: "Pošlite web a poviem vám, či má AI vrstva zmysel už teraz alebo až po úprave flowov.",
    ctaText:
      "Stačí URL a krátky popis, kde sa dnes strácajú návštevníci alebo dopyty. Vrátim sa s konkrétnym názorom na vhodnosť, prvú fázu a reálny rozsah implementácie.",
    ctaButtonLabel: "Objednať AI audit webu",
    ctaMailSubject: "AI audit webu",
  },
  cs: {
    metadataTitle: "AI audit webu | BendaLabs",
    metadataDescription:
      "AI audit webu ukáže, jestli se web hodí na AI vrstvu, kde se láme konverze a jak má vypadat první fáze nasazení.",
    eyebrow: "AI audit webu",
    title: "AI audit webu",
    subtitle:
      "Ukážu, jestli se váš web hodí na AI vrstvu, kde se láme konverze a jak může vypadat první fáze nasazení.",
    heroChips: [
      "Audit vhodnosti pro AI vrstvu",
      "Místa, kde se láme konverze",
      "První fáze nasazení",
    ],
    auditBot: {
      badge: "AI audit webu",
      proposalTitle: "Chcete plný audit a konkrétní návrh pro váš web?",
      proposalDescription:
        "Po rychlém auditu můžeme přejít na plný návrh AI vrstvy, prioritní místa zásahu a realistickou první fázi nasazení.",
      proposalButtonLabel: "Přejít na CTA",
    },
    sections: [
      {
        id: "hodnoti",
        label: "Co audit hodnotí",
        title: "Audit nehodnotí, jestli je web hezký. Hodnotí, jestli umí dostat člověka do správného flowu.",
        description:
          "Podívám se na to, jak se návštěvník rozhoduje, kde se ztrácí a jestli má AI vrstva reálný prostor zlepšit výkon. Zajímá mě, jestli je problém v navigaci, produktové logice, formulářích nebo v tom, že web neumí pracovat s intentem.",
        surface: "soft",
        cards: [
          {
            title: "Rozhodovací místa",
            text: "Kde musí návštěvník zvolit kategorii, produkt, kalkulačku nebo formulář dřív, než má dost informací pro správné rozhodnutí.",
          },
          {
            title: "Zlomy konverze",
            text: "Kde lidé odpadají před formulářem, mezi detailem a objednávkou nebo při přechodu do kontaktu.",
          },
          {
            title: "Síla intentu",
            text: "Jestli návštěvníci přicházejí s konkrétním úkolem a jestli jim web umí doporučit správný další krok bez bloudění.",
          },
          {
            title: "Připravenost na AI vrstvu",
            text: "Jestli je obsah, struktura a flow webu dostatečně jasný na to, aby AI vrstva přinesla měřitelný efekt už v první fázi.",
          },
        ],
      },
      {
        id: "dostanete",
        label: "Co dostanete",
        title: "Výstupem není obecný report. Výstupem je rozhodnutí, co nasadit jako první.",
        description:
          "Audit má pomoct rozhodnout, jestli nasazení dává smysl, kde začít a co nemá smysl dělat hned. Bez této vrstvy se často řeší design nebo obsah, zatímco skutečný problém zůstává ve špatném toku návštěvníka.",
        surface: "white",
        bullets: [
          "Srozumitelný názor, jestli je web vhodný pro AI vrstvu a které scénáře mají nejvyšší šanci na přínos.",
          "Seznam míst, kde se dnes láme konverze a proč tam lidé odpadají.",
          "Návrh první fáze nasazení: kde začít, co přesně má AI vrstva dělat a které větve řešit nejdřív.",
          "Doporučení, co se vyplatí měřit hned po spuštění, aby bylo jasné, jestli nasazení funguje.",
        ],
      },
      {
        id: "merani",
        label: "Co se bude měřit po nasazení",
        title: "Po nasazení se nehodnotí dojem. Hodnotí se pohyb návštěvníka a dopad na poptávku.",
        description:
          "Když se AI vrstva nasadí, musí být od prvního dne jasné, co je úspěch. Zajímá nás, jestli lidé trefí správné flow, jestli se zkracuje cesta ke konverzi a jestli obchod dostává kvalitnější vstupy.",
        surface: "tint",
        bullets: [
          "Kolik návštěvníků se z intent vstupu dostalo do správného flowu bez bloudění přes menu a filtry.",
          "Pokles odpadu před formulářem, rezervací nebo objednávkou.",
          "Změna v počtu dokončených poptávek nebo rezervací po nasazení první fáze.",
          "Míra přijetí doporučených dalších kroků nebo souvisejících produktů.",
          "Kde se stále objevuje tření a co je potřeba doladit v dalším kole.",
        ],
      },
      {
        id: "cenik",
        label: "Ceník",
        title: "Ceník je pevný. Rozdíl je jen v tom, jaká složitost dává smysl pro váš web.",
        description:
          "Pokud web potřebuje jen jednu rozhodovací vrstvu, implementace je jednodušší. Pokud má více větví, více typů formulářů nebo silnější produktovou logiku, jde o složitější nasazení.",
        surface: "white",
        statements: [
          "Jednodušší implementace - 1 500 EUR jednorázově",
          "Složitější implementace - 2 500 EUR jednorázově",
          "Měsíční ladění - 190 EUR / měsíc",
          "AI výpočetní výkon - odhad 10 až 100 EUR / měsíc podle reálného používání, přes OpenAI účet klienta",
        ],
      },
    ],
    ctaTitle: "Pošlete web a řeknu vám, jestli dává AI vrstva smysl už teď, nebo až po úpravě flowů.",
    ctaText:
      "Stačí URL a krátký popis, kde se dnes ztrácejí návštěvníci nebo poptávky. Vrátím se s konkrétním názorem na vhodnost, první fázi a reálný rozsah implementace.",
    ctaButtonLabel: "Objednat AI audit webu",
    ctaMailSubject: "AI audit webu",
  },
} as const satisfies Record<SiteLocale, ServicePageContent>;

const financePageContent = {
  sk: {
    metadataTitle: "AI vrstva pre financne a poistne weby | BendaLabs",
    metadataDescription:
      "AI vrstva, ktorá dostane návštevníka do správnej kalkulačky, formulára alebo produktu skôr a s menším odpadom pred odoslaním dopytu.",
    eyebrow: "AI vrstva pre finančné a poistné weby",
    title: "AI vrstva pre finančné a poistné weby",
    subtitle:
      "Dostane viac ľudí do správnej kalkulačky, zníži odpad pred formulárom a zvýši počet dokončených dopytov.",
    heroChips: [
      "Hypotéky a refinancovanie",
      "PZP a havarijné poistenie",
      "Investovanie, sporenie, kontakt",
    ],
    auditBot: {
      badge: "AI audit webu",
      proposalTitle: "Chcete audit a konkrétny návrh AI vrstvy pre váš finančný alebo poistný web?",
      proposalDescription:
        "Po audite sa vieme pozrieť na miesta, kde dnes ľudia netrafia správny flow, odpadajú pred formulárom alebo končia vo všeobecnej sekcii bez dopytu.",
      proposalButtonLabel: "Prejsť na CTA",
    },
    sections: [
      {
        id: "problem",
        label: "Problém",
        title: "Najväčší problém nie je traffic. Je to zlý výber prvého kroku.",
        description:
          "Na finančných a poistných weboch ľudia neprichádzajú s názvom produktu. Prichádzajú s potrebou. Chcú znížiť splátku, vyriešiť PZP, zistiť, či má zmysel investovanie, alebo sa len dostať ku kontaktu. Ak web od nich hneď pýta správnu kategóriu, veľká časť sa odpojí skôr, ako otvorí relevantný flow.",
        surface: "soft",
        cards: [
          {
            title: "Hypotéky a refinancovanie",
            text: "Používateľ často nevie, či patrí do novej hypotéky, refinancovania alebo len orientačného prepočtu. Keď netrafí správnu kalkulačku, konverzia padá už na vstupe.",
          },
          {
            title: "PZP a havarijné poistenie",
            text: "Rozhodovanie sa láme medzi cenou, rozsahom krytia a tým, či človek rieši novú zmluvu alebo zmenu. Menu a filtre tu nestačia.",
          },
          {
            title: "Investovanie a sporenie",
            text: "Návštevník vie povedať cieľ, nie produkt. Ak ho web núti vybrať nesprávnu vetvu, odíde bez kontaktu aj bez dopytu.",
          },
          {
            title: "Kontakt a formulár",
            text: "Aj človek pripravený odoslať dopyt sa často stratí medzi viacerými formulármi. Odpad pred formulárom býva drahší ako slabší closing.",
          },
        ],
      },
      {
        id: "co-robi",
        label: "Čo robí AI vrstva",
        title: "AI vrstva nepredáva. Preradí človeka do správneho flowu skôr, ako sa pomýli.",
        description:
          "Vrstva číta intent návštevníka jeho vlastnými slovami, rozpozná hlavný zámer a pošle ho do konkrétneho ďalšieho kroku. Nie do všeobecnej sekcie. Do kalkulačky, formulára, produktovej vetvy alebo kontaktu, ktorý dáva zmysel pre daný dopyt.",
        surface: "white",
        cards: [
          {
            title: "Intent namiesto menu",
            text: "Používateľ napíše, že chce znížiť mesačnú splátku, poistiť auto alebo odkladať peniaze na rezervu. Systém nemusí čakať, kým sám nájde správny produkt.",
          },
          {
            title: "Menej odpadu pred formulárom",
            text: "AI vrstva odfiltruje slepé odbočky a posúva návštevníka len do formulára, kde má reálnu šancu dokončiť dopyt.",
          },
          {
            title: "Odporúčanie súvisiacich produktov",
            text: "Ak je človek v správnom momente, vrstva odporučí ďalší logický krok. Napríklad popri refinancovaní navrhne poistenie nehnuteľnosti alebo popri sporiacom produkte investičnú vetvu.",
          },
          {
            title: "Lepšie presmerovanie na kontakt",
            text: "Tam, kde nemá zmysel ďalšie klikanie, pošle AI človeka rovno na kontakt alebo na presne ten formulár, ktorý vie obchodný tím spracovať.",
          },
        ],
      },
      {
        id: "konverzia",
        label: "Kde sa láme konverzia",
        title: "Lom nenastáva v poslednom kroku. Zvyčajne nastane o dve obrazovky skôr.",
        description:
          "Najväčší prepad býva medzi prvým intentom a prvým relevantným flowom. Keď sa človek pomýli v tom, či otvorí refinancovanie, PZP kalkulačku, investičný obsah alebo kontakt, web už iba dobieha zlé rozhodnutie.",
        surface: "tint",
        bullets: [
          "Používateľ nevie, či má otvoriť hypotéku, refinancovanie alebo len orientačný prepočet.",
          "Pri PZP a havarijnom poistení sa zasekne medzi krytím, cenou a nejasným ďalším krokom.",
          "Pri investovaní a sporení nenájde vetvu, ktorá zodpovedá cieľu a rizikovému profilu.",
          "Pred formulárom odpadne, lebo si nie je istý, či je na správnom mieste.",
          "Web neponúkne súvisiaci produkt v momente, keď je návštevník pripravený pokračovať.",
        ],
      },
      {
        id: "meranie",
        label: "Čo sa bude merať",
        title: "Ak sa to nemá merať, nemá zmysel to nasadzovať.",
        description:
          "Po nasadení sa nesleduje iba počet chat interakcií. Sleduje sa, či vrstva skracuje cestu k dopytu, posiela viac ľudí do správnych kalkulačiek a či obchod dostáva čistejšie leady.",
        surface: "white",
        bullets: [
          "Podiel návštevníkov, ktorí sa z intent vstupu dostanú do správnej kalkulačky alebo formulára.",
          "Pokles odpadu pred formulárom a počet dokončených dopytov na hypotéky, poistenie a investičné produkty.",
          "Koľko ľudí AI presmerovala zo všeobecného vstupu na kontakt s reálnym obchodným potenciálom.",
          "Miera prijatia odporúčaných súvisiacich produktov alebo ďalších krokov.",
          "Kde sa ľudia stále zasekávajú a ktoré vetvy webu treba doladiť ako ďalšie.",
        ],
      },
    ],
    ctaTitle: "Ak máte finančný alebo poistný web, pozriem sa, kde dnes strácate dopyty.",
    ctaText:
      "Pošlite URL, hlavné produktové vetvy a miesto, kde sa vám dnes láme konverzia. Vrátim sa s konkrétnym názorom, či tam AI vrstva vie reálne zlepšiť výkon.",
    ctaButtonLabel: "Poslať web na posúdenie",
    ctaMailSubject: "AI vrstva pre finančný alebo poistný web",
  },
  cs: {
    metadataTitle: "AI vrstva pro financni a pojistne weby | BendaLabs",
    metadataDescription:
      "AI vrstva, která dostane návštěvníka do správné kalkulačky, formuláře nebo produktu dřív a s menším odpadem před odesláním poptávky.",
    eyebrow: "AI vrstva pro finanční a pojistné weby",
    title: "AI vrstva pro finanční a pojistné weby",
    subtitle:
      "Dostane víc lidí do správné kalkulačky, sníží odpad před formulářem a zvýší počet dokončených poptávek.",
    heroChips: [
      "Hypotéky a refinancování",
      "Povinné ručení a havarijní pojištění",
      "Investování, spoření, kontakt",
    ],
    auditBot: {
      badge: "AI audit webu",
      proposalTitle: "Chcete audit a konkrétní návrh AI vrstvy pro váš finanční nebo pojistný web?",
      proposalDescription:
        "Po auditu se můžeme podívat na místa, kde dnes lidé netrefí správný flow, odpadají před formulářem nebo končí v obecné sekci bez poptávky.",
      proposalButtonLabel: "Přejít na CTA",
    },
    sections: [
      {
        id: "problem",
        label: "Problém",
        title: "Největší problém není traffic. Je to špatný výběr prvního kroku.",
        description:
          "Na finančních a pojistných webech lidé nepřicházejí s názvem produktu. Přicházejí s potřebou. Chtějí snížit splátku, vyřešit povinné ručení, zjistit, jestli dává smysl investování, nebo se jen dostat ke kontaktu. Pokud web hned vyžaduje správnou kategorii, velká část se odpojí dřív, než otevře relevantní flow.",
        surface: "soft",
        cards: [
          {
            title: "Hypotéky a refinancování",
            text: "Uživatel často neví, jestli patří do nové hypotéky, refinancování nebo jen orientačního přepočtu. Když netrefí správnou kalkulačku, konverze padá už na vstupu.",
          },
          {
            title: "Povinné ručení a havarijní pojištění",
            text: "Rozhodování se láme mezi cenou, rozsahem krytí a tím, jestli člověk řeší novou smlouvu nebo změnu. Menu a filtry tu nestačí.",
          },
          {
            title: "Investování a spoření",
            text: "Návštěvník umí popsat cíl, ne produkt. Když ho web nutí vybrat špatnou větev, odchází bez kontaktu i bez poptávky.",
          },
          {
            title: "Kontakt a formulář",
            text: "I člověk připravený odeslat poptávku se často ztratí mezi více formuláři. Odpad před formulářem bývá dražší než slabší closing.",
          },
        ],
      },
      {
        id: "co-dela",
        label: "Co dělá AI vrstva",
        title: "AI vrstva neprodává. Přeřadí člověka do správného flowu dřív, než se splete.",
        description:
          "Vrstva čte intent návštěvníka jeho vlastními slovy, rozpozná hlavní záměr a pošle ho do konkrétního dalšího kroku. Ne do obecné sekce. Do kalkulačky, formuláře, produktové větve nebo kontaktu, který dává smysl pro danou poptávku.",
        surface: "white",
        cards: [
          {
            title: "Intent místo menu",
            text: "Uživatel napíše, že chce snížit měsíční splátku, pojistit auto nebo odkládat peníze na rezervu. Systém nemusí čekat, až sám najde správný produkt.",
          },
          {
            title: "Méně odpadu před formulářem",
            text: "AI vrstva odfiltruje slepé odbočky a posouvá návštěvníka jen do formuláře, kde má reálnou šanci dokončit poptávku.",
          },
          {
            title: "Doporučení souvisejících produktů",
            text: "Když je člověk ve správném momentu, vrstva doporučí další logický krok. Třeba vedle refinancování navrhne pojištění nemovitosti nebo vedle spořicího produktu investiční větev.",
          },
          {
            title: "Lepší přesměrování na kontakt",
            text: "Tam, kde nemá smysl další klikání, pošle AI člověka rovnou na kontakt nebo na přesně ten formulář, který umí obchodní tým zpracovat.",
          },
        ],
      },
      {
        id: "konverze",
        label: "Kde se láme konverze",
        title: "Zlom nenastává v posledním kroku. Obvykle přijde o dvě obrazovky dřív.",
        description:
          "Největší propad bývá mezi prvním intentem a prvním relevantním flowem. Když se člověk splete v tom, jestli otevřít refinancování, kalkulačku povinného ručení, investiční obsah nebo kontakt, web už jen dobíhá špatné rozhodnutí.",
        surface: "tint",
        bullets: [
          "Uživatel neví, jestli má otevřít hypotéku, refinancování nebo jen orientační přepočet.",
          "U povinného ručení a havarijního pojištění se zasekne mezi krytím, cenou a nejasným dalším krokem.",
          "U investování a spoření nenajde větev, která odpovídá cíli a rizikovému profilu.",
          "Před formulářem odpadne, protože si není jistý, jestli je na správném místě.",
          "Web nenabídne související produkt ve chvíli, kdy je návštěvník připraven pokračovat.",
        ],
      },
      {
        id: "mereni",
        label: "Co se bude měřit",
        title: "Když se to nemá měřit, nemá smysl to nasazovat.",
        description:
          "Po nasazení se nesleduje jen počet chat interakcí. Sleduje se, jestli vrstva zkracuje cestu k poptávce, posílá víc lidí do správných kalkulaček a jestli obchod dostává čistší leady.",
        surface: "white",
        bullets: [
          "Podíl návštěvníků, kteří se z intent vstupu dostanou do správné kalkulačky nebo formuláře.",
          "Pokles odpadu před formulářem a počet dokončených poptávek na hypotéky, pojištění a investiční produkty.",
          "Kolik lidí AI přesměrovala z obecného vstupu na kontakt s reálným obchodním potenciálem.",
          "Míra přijetí doporučených souvisejících produktů nebo dalších kroků.",
          "Kde se lidé stále zasekávají a které větve webu je potřeba doladit jako další.",
        ],
      },
    ],
    ctaTitle: "Pokud máte finanční nebo pojistný web, podívám se, kde dnes ztrácíte poptávky.",
    ctaText:
      "Pošlete URL, hlavní produktové větve a místo, kde se vám dnes láme konverze. Vrátím se s konkrétním názorem, jestli tam AI vrstva umí reálně zlepšit výkon.",
    ctaButtonLabel: "Poslat web k posouzení",
    ctaMailSubject: "AI vrstva pro finanční nebo pojistný web",
  },
} as const satisfies Record<SiteLocale, ServicePageContent>;

const marketplacePageContent = {
  sk: {
    metadataTitle: "AI vrstva pre marketplace a rental weby | BendaLabs",
    metadataDescription:
      "AI vrstva, ktorá naviguje návštevníka podľa úlohy, nie podľa názvu produktu, a skracuje cestu k rezervácii alebo objednávke.",
    eyebrow: "MARKETPLACE A RENTAL",
    title: "AI vrstva pre marketplace a rental weby",
    subtitle:
      "Používateľ často nepríde s presným názvom produktu alebo služby. Príde s úlohou, problémom alebo situáciou. AI vrstva z jeho zadania pochopí intent a navedie ho na správny produkt, ponuku alebo ďalší krok.",
    heroChips: [
      "Veľa kategórií a filtrov",
      "Intent podľa úlohy",
      "Kratšia cesta k rezervácii",
    ],
    auditBot: {
      badge: "AI audit webu",
      proposalTitle: "Chcete audit a konkrétny návrh AI vrstvy pre váš marketplace alebo rental web?",
      proposalDescription:
        "Po audite sa vieme pozrieť na miesta, kde dnes návštevník hľadá príliš dlho, netrafí správnu ponuku alebo odpadne pred rezerváciou.",
      proposalButtonLabel: "Prejsť na CTA",
    },
    sections: [
      {
        id: "problem",
        label: "Problém",
        title: "Marketplace a rental weby často neprehrávajú na ponuke. Prehrávajú na orientácii.",
        description:
          "Veľké množstvo kategórií, filtrov a typov ponúk vyzerá dobre v produktovej mape. Pre návštevníka je to často brzda. Neprichádza s názvom produktu. Prichádza s úlohou, ktorú chce vyriešiť teraz.",
        surface: "soft",
        cards: [
          {
            title: "Príliš veľa kategórií",
            text: "Ak má web veľa vetiev, človek musí najprv pochopiť internú logiku katalógu. To je zlá pozícia hneď na začiatku.",
          },
          {
            title: "Filtre nepracujú s intentom",
            text: "Používateľ nevie, či potrebuje konkrétny produkt, službu alebo celý set. Vie len, čo chce spraviť a v akom čase.",
          },
          {
            title: "Menu nepozná konkrétnu situáciu",
            text: "Klasická navigácia nepovie, čo je najlepší ďalší krok pre daný problém, termín, rozpočet alebo spôsob použitia.",
          },
          {
            title: "Rezervácia je príliš ďaleko",
            text: "Každý nadbytočný klik medzi prvou potrebou a rezerváciou zvyšuje šancu, že človek odíde alebo skončí bez akcie.",
          },
        ],
      },
      {
        id: "intent",
        label: "Ako sa hľadá",
        title: "Používateľ nepríde s názvom produktu. Príde s úlohou, problémom alebo situáciou.",
        description:
          "AI vrstva z textu pochopí intent a preloží ho na správny produkt, ponuku alebo ďalší krok. Nemusí čakať, kým človek trafí internú štruktúru katalógu alebo pozná správne názvy kategórií.",
        surface: "white",
        cards: [
          {
            title: "Úloha namiesto produktu",
            text: "Návštevník napíše, čo chce vyriešiť, a web to preloží na konkrétny typ produktu, služby alebo rezervačného flowu.",
          },
          {
            title: "Správna ponuka na prvý pokus",
            text: "AI odporučí správny produkt alebo ponuku bez toho, aby návštevník musel ručne prechádzať viac kategórií, filtrov a technických parametrov.",
          },
          {
            title: "Ďalší krok bez blúdenia",
            text: "Ak dopyt ešte nie je pripravený na rezerváciu, vrstva pošle človeka na relevantný detail, porovnanie, formulár alebo kontakt. Nie späť na zoznam.",
          },
          {
            title: "Menej prázdnych návštev",
            text: "Aj pri širšej ponuke sa zvýši podiel ľudí, ktorí sa dostanú do reálneho objednávkového alebo rezervačného procesu.",
          },
        ],
      },
      {
        id: "co-robi",
        label: "Čo robí AI vrstva",
        title: "AI vrstva chápe intent, nie len kľúčové slová.",
        description:
          "Vrstva priradí intent ku konkrétnej časti webu a odporučí správny produkt, službu, rental flow alebo ďalší krok. Pomáha hlavne tam, kde väčší katalóg a viac vetiev vytvára zbytočný chaos už na začiatku návštevy.",
        surface: "tint",
        bullets: [
          "Rozpozná, či človek hľadá produkt, rezerváciu, doplnkovú službu alebo len potrebuje pomôcť s výberom.",
          "Pomáha nájsť správny produkt, službu alebo rental flow aj vtedy, keď návštevník nepozná presný názov kategórie.",
          "Znižuje chaos pri väčšom katalógu, kde menu a filtre nestačia na rýchle rozhodnutie.",
          "Pošle človeka rovno na ďalší krok, ktorý zvyšuje šancu na dopyt, rezerváciu alebo objednávku.",
          "Vie odporučiť aj súvisiacu ponuku, ak dáva zmysel pre konkrétnu situáciu alebo termín použitia.",
        ],
      },
      {
        id: "prinos",
        label: "Čo to prinesie",
        title: "Prínos je jednoduchý. Menej hľadania, viac objednávok z existujúcej návštevnosti.",
        description:
          "Nasadenie sa oplatí tam, kde web nepotrebuje krajší filter, ale rýchlejšie priradenie potreby ku konkrétnej ponuke. To je priamo viditeľné na rezerváciách, objednávkach aj kvalite návštev, ktoré sa dostanú do finálneho kroku.",
        surface: "white",
        bullets: [
          "Kratšia cesta od prvého dopytu po rezerváciu alebo objednávku.",
          "Vyšší podiel návštevníkov, ktorí trafia správny produkt na prvý pokus.",
          "Menej odpadnutých návštev medzi zoznamom, detailom a košíkom alebo rezervačným formulárom.",
          "Lepšie dáta o tom, s akou úlohou ľudia reálne prichádzajú na web.",
          "Jasnejšie miesto, kde dolaďovať obsah, kategóriu alebo obchodné pravidlá.",
        ],
      },
    ],
    ctaTitle: "Ak máte marketplace alebo rental web, pozriem sa, kde sa dnes zbytočne predlžuje cesta k rezervácii.",
    ctaText:
      "Pošlite URL, hlavné vetvy katalógu a miesto, kde dnes ľudia najčastejšie blúdia alebo odpadajú. Vrátim sa s konkrétnym názorom, či AI vrstva vie skracovať cestu k dopytu, rezervácii alebo objednávke už v prvej fáze.",
    ctaButtonLabel: "Poslať marketplace alebo rental web",
    ctaMailSubject: "AI vrstva pre marketplace alebo rental web",
  },
  cs: {
    metadataTitle: "AI vrstva pro marketplace a rental weby | BendaLabs",
    metadataDescription:
      "AI vrstva, která naviguje návštěvníka podle úkolu, ne podle názvu produktu, a zkracuje cestu k rezervaci nebo objednávce.",
    eyebrow: "MARKETPLACE A RENTAL",
    title: "AI vrstva pro marketplace a rental weby",
    subtitle:
      "Uživatel často nepřijde s přesným názvem produktu nebo služby. Přijde s úkolem, problémem nebo situací. AI vrstva z jeho zadání pochopí intent a navede ho na správný produkt, nabídku nebo další krok.",
    heroChips: [
      "Hodně kategorií a filtrů",
      "Intent podle úkolu",
      "Kratší cesta k rezervaci",
    ],
    auditBot: {
      badge: "AI audit webu",
      proposalTitle: "Chcete audit a konkrétní návrh AI vrstvy pro váš marketplace nebo rental web?",
      proposalDescription:
        "Po auditu se můžeme podívat na místa, kde dnes návštěvník hledá příliš dlouho, netrefí správnou nabídku nebo odpadne před rezervací.",
      proposalButtonLabel: "Přejít na CTA",
    },
    sections: [
      {
        id: "problem",
        label: "Problém",
        title: "Marketplace a rental weby často neprohrávají na nabídce. Prohrávají na orientaci.",
        description:
          "Velké množství kategorií, filtrů a typů nabídek vypadá dobře v produktové mapě. Pro návštěvníka je to často brzda. Nepřichází s názvem produktu. Přichází s úkolem, který chce vyřešit teď.",
        surface: "soft",
        cards: [
          {
            title: "Příliš mnoho kategorií",
            text: "Když má web hodně větví, člověk musí nejdřív pochopit interní logiku katalogu. To je špatná pozice hned na začátku.",
          },
          {
            title: "Filtry nepracují s intentem",
            text: "Uživatel neví, jestli potřebuje konkrétní produkt, službu nebo celý set. Ví jen, co chce udělat a v jakém čase.",
          },
          {
            title: "Menu nezná konkrétní situaci",
            text: "Klasická navigace neřekne, co je nejlepší další krok pro daný problém, termín, rozpočet nebo způsob použití.",
          },
          {
            title: "Rezervace je příliš daleko",
            text: "Každý zbytečný klik mezi první potřebou a rezervací zvyšuje šanci, že člověk odejde nebo skončí bez akce.",
          },
        ],
      },
      {
        id: "intent",
        label: "Jak se hledá",
        title: "Uživatel nepřijde s názvem produktu. Přijde s úkolem, problémem nebo situací.",
        description:
          "AI vrstva z textu pochopí intent a přeloží ho na správný produkt, nabídku nebo další krok. Nemusí čekat, až člověk trefí interní strukturu katalogu nebo zná správné názvy kategorií.",
        surface: "white",
        cards: [
          {
            title: "Úkol místo produktu",
            text: "Návštěvník napíše, co chce vyřešit, a web to přeloží na konkrétní typ produktu, služby nebo rezervačního flowu.",
          },
          {
            title: "Správná nabídka na první pokus",
            text: "AI doporučí správný produkt nebo nabídku bez toho, aby návštěvník musel ručně procházet více kategorií, filtrů a technických parametrů.",
          },
          {
            title: "Další krok bez bloudění",
            text: "Pokud poptávka ještě není připravená na rezervaci, vrstva pošle člověka na relevantní detail, srovnání, formulář nebo kontakt. Ne zpět na seznam.",
          },
          {
            title: "Méně prázdných návštěv",
            text: "I při široké nabídce se zvýší podíl lidí, kteří se dostanou do reálného objednávkového nebo rezervačního procesu.",
          },
        ],
      },
      {
        id: "co-dela",
        label: "Co dělá AI vrstva",
        title: "AI vrstva chápe intent, ne jen klíčová slova.",
        description:
          "Vrstva přiřadí intent ke konkrétní části webu a doporučí správný produkt, službu, rental flow nebo další krok. Pomáhá hlavně tam, kde větší katalog a více větví vytváří zbytečný chaos už na začátku návštěvy.",
        surface: "tint",
        bullets: [
          "Rozpozná, jestli člověk hledá produkt, rezervaci, doplňkovou službu nebo jen potřebuje pomoct s výběrem.",
          "Pomáhá najít správný produkt, službu nebo rental flow i tehdy, když návštěvník nezná přesný název kategorie.",
          "Snižuje chaos u většího katalogu, kde menu a filtry nestačí na rychlé rozhodnutí.",
          "Pošle člověka rovnou na další krok, který zvyšuje šanci na poptávku, rezervaci nebo objednávku.",
          "Umí doporučit i související nabídku, pokud dává smysl pro konkrétní situaci nebo termín použití.",
        ],
      },
      {
        id: "prinos",
        label: "Co to přinese",
        title: "Přínos je jednoduchý. Méně hledání, víc objednávek ze stávající návštěvnosti.",
        description:
          "Nasazení se vyplatí tam, kde web nepotřebuje hezčí filtr, ale rychlejší přiřazení potřeby ke konkrétní nabídce. To je přímo viditelné na rezervacích, objednávkách i kvalitě návštěv, které se dostanou do finálního kroku.",
        surface: "white",
        bullets: [
          "Kratší cesta od prvního dotazu k rezervaci nebo objednávce.",
          "Vyšší podíl návštěvníků, kteří trefí správný produkt na první pokus.",
          "Méně odpadlých návštěv mezi seznamem, detailem a košíkem nebo rezervačním formulářem.",
          "Lepší data o tom, s jakým úkolem lidé reálně přicházejí na web.",
          "Jasnější místo, kde ladit obsah, kategorii nebo obchodní pravidla.",
        ],
      },
    ],
    ctaTitle: "Pokud máte marketplace nebo rental web, podívám se, kde se dnes zbytečně prodlužuje cesta k rezervaci.",
    ctaText:
      "Pošlete URL, hlavní větve katalogu a místo, kde dnes lidé nejčastěji bloudí nebo odpadají. Vrátím se s konkrétním názorem, jestli AI vrstva umí zkracovat cestu k poptávce, rezervaci nebo objednávce už v první fázi.",
    ctaButtonLabel: "Poslat marketplace nebo rental web",
    ctaMailSubject: "AI vrstva pro marketplace nebo rental web",
  },
} as const satisfies Record<SiteLocale, ServicePageContent>;

export function getSitePaths(locale: SiteLocale) {
  return sitePaths[locale];
}

export function getPageLinks(locale: SiteLocale): ReadonlyArray<SiteNavLink> {
  return chromeContent[locale].nav;
}

export function getSiteChrome(locale: SiteLocale) {
  return chromeContent[locale];
}

export function getAuditBotCopy(locale: SiteLocale): AuditBotCopy {
  return auditBotDefaults[locale];
}

export function getHomePageContent(locale: SiteLocale): HomePageContent {
  return homeContent[locale];
}

export function getAuditPageContent(locale: SiteLocale): ServicePageContent {
  return auditPageContent[locale];
}

export function getFinancePageContent(locale: SiteLocale): ServicePageContent {
  return financePageContent[locale];
}

export function getMarketplacePageContent(locale: SiteLocale): ServicePageContent {
  return marketplacePageContent[locale];
}

export function getPreferredLocaleFromHost(hostname: string | null | undefined): SiteLocale {
  if (hostname?.toLowerCase().endsWith(".cz")) {
    return "cs";
  }

  return "sk";
}
