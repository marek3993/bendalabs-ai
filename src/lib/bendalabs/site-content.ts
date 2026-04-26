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

type AuditBotCopy = {
  badge: string;
  title: string;
  description: string;
  submitLabel: string;
  loadingLabel: string;
  loadingSteps: readonly [string, string, string];
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
    "badge" | "title" | "description" | "proposalTitle" | "proposalDescription" | "proposalButtonLabel"
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
    brandTagline: "AI vrstva pre weby s viacerymi cestami ku konverzii",
    nav: [
      { href: sitePaths.sk.home, label: "Domov" },
      { href: sitePaths.sk.finance, label: "Financie a poistenie" },
      { href: sitePaths.sk.marketplace, label: "Marketplace a rental" },
      { href: sitePaths.sk.audit, label: "AI audit webu" },
    ],
    openCtaLabel: "Otvorit CTA",
    openAuditLabel: "Pozriet AI audit webu",
    ctaTag: "CTA",
    contactLabel: "Kontakt",
  },
  cs: {
    brandTagline: "AI vrstva pro weby s vice cestami ke konverzi",
    nav: [
      { href: sitePaths.cs.home, label: "Domov" },
      { href: sitePaths.cs.finance, label: "Finance a pojisteni" },
      { href: sitePaths.cs.marketplace, label: "Marketplace a rental" },
      { href: sitePaths.cs.audit, label: "AI audit webu" },
    ],
    openCtaLabel: "Otevrit CTA",
    openAuditLabel: "Zobrazit AI audit webu",
    ctaTag: "CTA",
    contactLabel: "Kontakt",
  },
} as const;

const auditBotDefaults = {
  sk: {
    badge: "AI audit bot",
    title: "Zadajte URL a hned uvidite, kde by AI vrstva vedela zmenit sposob pouzivania webu.",
    description:
      "Audit nacita homepage, prejde relevantne podstranky a vyhodnoti, kde by AI vrstva vedela zjednodusit navigaciu, odporucanie, lead flow a dalsi krok pouzivatela.",
    submitLabel: "Analyzovat web",
    loadingLabel: "Analyzujem web",
    loadingSteps: [
      "Nacitavam stranku...",
      "Analyzujem strukturu...",
      "Vyhodnocujem vhodnost pre AI vrstvu...",
    ] as const,
    placeholder: "napr. bendalabs.sk alebo https://bendalabs.sk",
    invalidUrlMessage: "Zadajte platnu webovu adresu. Staci aj domena ako bendalabs.sk.",
    genericErrorMessage: "Audit sa teraz nepodarilo vygenerovat.",
    activeAuditLabel: "Prave bezi audit",
    fitCardTitle: "Vhodnost pre AI vrstvu",
    scoreLabel: "Score",
    solutionCardTitle: "Odporucany typ riesenia",
    whyFitTitle: "Preco je alebo nie je web vhodny",
    frictionTitle: "Kde sa pouzivatelia pravdepodobne stracaju",
    upsellTitle: "Kde je priestor na upsell alebo cross-sell",
    phaseOneTitle: "Ako by mohla vyzerat 1. faza nasadenia",
    exampleFlowsTitle: "3 priklady, ako by AI vrstva pomahala navstevnikom",
    userIntentLabel: "Pouzivatelsky zamer",
    aiActionLabel: "AI akcia",
    businessValueLabel: "Biznisova hodnota",
    nextStepLabel: "Dalsi krok",
    proposalTitle: "Chcete plny audit a konkretny navrh pre vas web?",
    proposalDescription:
      "Poslite web a pripravim konkretny navrh AI vrstvy, prioritne miesta zasahu a realisticku prvu fazu nasadenia.",
    proposalButtonLabel: "Poziadat o konkretny navrh",
    fitLabels: {
      low: "Slaby fit",
      borderline: "Hranicny fit",
      good: "Dobry fit",
      strong: "Velmi silny fit",
    },
  },
  cs: {
    badge: "AI audit bot",
    title: "Zadejte URL a hned uvidite, kde by AI vrstva dokazala zmenit zpusob pouzivani webu.",
    description:
      "Audit nacte homepage, projde relevantni podstranky a vyhodnoti, kde by AI vrstva dokazala zjednodusit navigaci, doporuceni, lead flow a dalsi krok uzivatele.",
    submitLabel: "Analyzovat web",
    loadingLabel: "Analyzuji web",
    loadingSteps: [
      "Nacitam stranku...",
      "Analyzuji strukturu...",
      "Vyhodnocuji vhodnost pro AI vrstvu...",
    ] as const,
    placeholder: "napr. bendalabs.cz nebo https://bendalabs.cz",
    invalidUrlMessage: "Zadejte platnou webovou adresu. Staci i domena jako bendalabs.cz.",
    genericErrorMessage: "Audit se ted nepodarilo vygenerovat.",
    activeAuditLabel: "Audit prave probiha",
    fitCardTitle: "Vhodnost pro AI vrstvu",
    scoreLabel: "Skore",
    solutionCardTitle: "Doporuceny typ reseni",
    whyFitTitle: "Proc web vhodny je nebo neni",
    frictionTitle: "Kde se uzivatele pravdepodobne ztraceji",
    upsellTitle: "Kde je prostor pro upsell nebo cross-sell",
    phaseOneTitle: "Jak muze vypadat 1. faze nasazeni",
    exampleFlowsTitle: "3 priklady, jak by AI vrstva pomahala navstevnikum",
    userIntentLabel: "Uzivatelsky zamer",
    aiActionLabel: "AI akce",
    businessValueLabel: "Byznysova hodnota",
    nextStepLabel: "Dalsi krok",
    proposalTitle: "Chcete plny audit a konkretni navrh pro vas web?",
    proposalDescription:
      "Poslete web a pripravim konkretni navrh AI vrstvy, prioritni mista zasahu a realistickou prvni fazi nasazeni.",
    proposalButtonLabel: "Pozadat o konkretni navrh",
    fitLabels: {
      low: "Slaby fit",
      borderline: "Hranicni fit",
      good: "Dobry fit",
      strong: "Velmi silny fit",
    },
  },
} as const satisfies Record<SiteLocale, AuditBotCopy>;

const homeContent = {
  sk: {
    brandTagline: chromeContent.sk.brandTagline,
    sections: [
      { id: "hero", label: "Hero" },
      { id: "audit", label: "Audit" },
      { id: "pre-koho", label: "Pre koho" },
      { id: "co-robi", label: "Co robi" },
      { id: "priklady", label: "Priklady" },
      { id: "ako-to-funguje", label: "Ako to funguje" },
      { id: "cennik", label: "Cennik" },
      { id: "kontakt", label: "Kontakt" },
    ],
    heroTag: "AI vrstva pre weby",
    heroTitle: "Navstevnik nemusi hladat v menu. Napise, co chce, a web ho tam dovedie.",
    heroDescription:
      "AI vrstva pre weby, ktora meni sposob pouzivania webu. Namiesto bludenia cez menu, filtre a formulare navstevnik napise svoj zamer a dostane spravny dalsi krok.",
    heroChips: [
      "Komplexne weby s viacerymi cestami ku konverzii",
      "Jeden vstup pre intent, navigaciu a odporucanie",
      "Audit bot ukaze realne miesta, kde sa lame konverzia",
    ],
    heroPrimaryCta: "Spustit rychly audit",
    heroSecondaryCta: "Kontakt / CTA",
    audiencesTag: "Pre koho to je",
    audiencesTitle: "Pre weby, kde je silna ponuka, ale clovek sa pred vysledkom stale straca.",
    audiencesDescription:
      "Funguje napriec business use-casmi. Nie len pre financie. Dolezita je komplexita ponuky, mnozstvo ciest a moment, ked navstevnik nevie, kam presne patri.",
    audiences: [
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
    ],
    featuresTag: "Co robi AI vrstva",
    featuresTitle: "Nie dalsi widget. Nova vrstva rozhodovania, navigacie a odporucania.",
    featuresDescription:
      "Clovek neprichadza s nazvom produktu ani s presnou kategoriou. Prichadza s tym, co chce vyriesit. Prave tam sa lame konverzia.",
    features: [
      "Pochopi, co chce clovek realne urobit, aj ked to nepovie nazvom produktu alebo kategorie.",
      "Posle ho do spravnej cesty bez bludenia cez menu, filtre, porovnavania alebo nespravne formulare.",
      "Odporuci vhodnejsi alebo doplnkovy krok presne v momente, ked je navstevnik pripraveny konat.",
      "Ukaze, kde sa lame konverzia a na ktorych miestach sa ludia najcastejsie zaseknu.",
    ],
    outcomes: [
      "Kratsia cesta k vysledku a menej stratenych navstevnikov",
      "Vyssia konverzia z existujucej navstevnosti",
      "Lepsie odporucanie relevantneho dalsieho kroku",
      "Presnejsie data o tom, kde web brzdi pouzivatela",
    ],
    examplesTag: "Priklady pouzitia",
    examplesTitle: "AI nevedie cloveka cez menu. Vedie ho cez jeho zamer.",
    examples: [
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
    ],
    journeyTag: "Ako to funguje",
    journeyTitle: "Stabilny flow od intentu po insighty, bez preskakovania krokov.",
    journeyDescription:
      "Na desktope sa aktivny krok urcuje podla triggeru, ktory je najblizsie stredu viewportu. Na mobile a tablete sa sekcia prepne do jednoducheho stacked layoutu bez sticky spravania.",
    activeStepLabel: "Aktivny krok",
    stepLabel: "Krok",
    journeySteps: [
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
    ],
    pricingTag: "Cennik",
    pricingTitle: "Jasny pricing pre prvu fazu aj priebezne doladenie.",
    pricing: {
      implementationLabel: "Implementacia",
      implementationDescription:
        "Vyberate si jednu z dvoch urovni nasadenia podla komplexity webu a poctu rozhodovacich miest.",
      supportLabel: "Mesacne doladenie",
      supportPrice: "190 EUR",
      supportCadenceLabel: "/ mesiac",
      supportLines: [
        "Optimalizacia podla dat a realneho spravania navstevnikov.",
        "Upravy pri zmene webu, obsahu alebo rozhodovacich ciest.",
        "1 vacsia mesacna zmena v ramci nasadenej AI vrstvy.",
      ],
      computeLabel: "AI computing power",
      computePrice: "odhad 10 az 100 EUR",
      computeCadenceLabel: "/ mesiac",
      computeLines: [
        "Podla realneho pouzivania, navstevnosti a narocnosti nasadenia.",
        "Spotreba ide priamo cez vlastny OpenAI Developer Platform ucet klienta.",
        "BendaLabs zabezpecuje implementaciu, napojenie, logiku a priebezne doladenie.",
      ],
      tiers: [
        {
          variant: "Varianta 1",
          name: "Jednoduchsia implementacia",
          price: "1 500 EUR",
          cadenceLabel: "jednorazovo",
          text: "Pre jednoduchsie weby alebo jednu hlavnu rozhodovaciu vrstvu.",
          tone: "light",
        },
        {
          variant: "Varianta 2",
          name: "Zlozitejsia implementacia",
          price: "2 500 EUR",
          cadenceLabel: "jednorazovo",
          text: "Pre vacsie weby s viacerymi vetvami, ponukami a miestami, kde sa lame konverzia.",
          tone: "muted",
        },
      ],
    },
    contactTag: "Kontakt / CTA",
    contactTitle: "Poslite svoj web a ukazem vam, kde sa lame konverzia.",
    contactDescription:
      "Staci poslat URL a kratko pomenovat, kde sa podla vas navstevnici stracaju alebo co ma byt pre nich citelne jednoduchsie.",
    contactCardLabel: "Kontakt",
    contactButtonLabel: "Poziadat o konkretny navrh",
    contactMailSubject: "AI audit webu",
    contactMailBody: "Ahoj, posielam URL na audit: ",
  },
  cs: {
    brandTagline: chromeContent.cs.brandTagline,
    sections: [
      { id: "hero", label: "Hero" },
      { id: "audit", label: "Audit" },
      { id: "pro-koho", label: "Pro koho" },
      { id: "co-dela", label: "Co dela" },
      { id: "priklady", label: "Priklady" },
      { id: "jak-to-funguje", label: "Jak to funguje" },
      { id: "cenik", label: "Cenik" },
      { id: "kontakt", label: "Kontakt" },
    ],
    heroTag: "AI vrstva pro weby",
    heroTitle: "Navstevnik nemusi hledat v menu. Napise, co chce, a web ho tam dovede.",
    heroDescription:
      "AI vrstva pro weby, ktera meni zpusob pouzivani webu. Misto bloudeni pres menu, filtry a formulare navstevnik napise svuj zamer a dostane spravny dalsi krok.",
    heroChips: [
      "Komplexni weby s vice cestami ke konverzi",
      "Jeden vstup pro intent, navigaci a doporuceni",
      "Audit bot ukaze realna mista, kde se lame konverze",
    ],
    heroPrimaryCta: "Spustit rychly audit",
    heroSecondaryCta: "Kontakt / CTA",
    audiencesTag: "Pro koho to je",
    audiencesTitle: "Pro weby, kde je silna nabidka, ale clovek se pred vysledkem porad ztraci.",
    audiencesDescription:
      "Funguje napric business use-casy. Nejen pro finance. Dulezita je komplexita nabidky, mnozstvi cest a moment, kdy navstevnik nevi, kam presne patri.",
    audiences: [
      {
        title: "Marketplace a service weby",
        text: "Weby, kde clovek prichazi s potrebou, ale nevi, kterou kategorii, nabidku nebo flow ma otevrit jako prvni.",
      },
      {
        title: "Financni a pojistne portaly",
        text: "Komplexni rozhodovani mezi produkty, refinancovanim, kalkulackami, formulary a spravnou vetvi poptavky.",
      },
      {
        title: "Rental a discovery use-casy",
        text: "Weby typu Rentulo, kde navstevnik nehleda nazev kategorie, ale co chce vyresit, pronajmout nebo objevit.",
      },
      {
        title: "Katalogy produktu a sluzeb",
        text: "Siroka nabidka, vice cest ke konverzi a potreba dostat cloveka ke spravne volbe bez treni a zbytecneho klikani.",
      },
    ],
    featuresTag: "Co dela AI vrstva",
    featuresTitle: "Ne dalsi widget. Nova vrstva rozhodovani, navigace a doporuceni.",
    featuresDescription:
      "Clovek neprichazi s nazvem produktu ani s presnou kategorii. Prichazi s tim, co chce vyresit. Prave tam se lame konverze.",
    features: [
      "Pochopi, co chce clovek realne udelat, i kdyz to nepojmenuje nazvem produktu nebo kategorie.",
      "Posle ho do spravne cesty bez bloudeni pres menu, filtry, porovnavani nebo spatne formulare.",
      "Doporuci vhodnejsi nebo doplnkovy krok presne ve chvili, kdy je navstevnik pripraven jednat.",
      "Ukaze, kde se lame konverze a na kterych mistech se lide nejcasteji zaseknou.",
    ],
    outcomes: [
      "Kratsi cesta k vysledku a mene ztracenych navstevniku",
      "Vyssi konverze ze stavajici navstevnosti",
      "Lepsi doporuceni relevantniho dalsiho kroku",
      "Presnejsi data o tom, kde web brzdi uzivatele",
    ],
    examplesTag: "Priklady pouziti",
    examplesTitle: "AI nevede cloveka pres menu. Vede ho pres jeho zamer.",
    examples: [
      {
        title: "Financni web",
        prompt: "Chci snizit mesicni splatku hypoteky.",
        answer:
          "AI vrstva rozpozna intent, odlisi refinancovani od nove hypoteky a posle navstevnika rovnou do spravneho flow.",
      },
      {
        title: "Marketplace / sluzby",
        prompt: "Potrebuji nekoho na rekonstrukci koupelny.",
        answer:
          "Misto hledani pres kategorie nebo filtry dostane clovek relevantni sluzbu, spravny poptavkovy formular a doporuceny dalsi krok.",
      },
      {
        title: "Rental / discovery",
        prompt: "Na vikend potrebuji naradi na brouseni stareho plotu.",
        answer:
          "AI vrstva rozpozna situaci, navrhne spravny typ naradi nebo sluzby a dovede uzivatele k rezervaci bez bloudeni.",
      },
    ],
    journeyTag: "Jak to funguje",
    journeyTitle: "Stabilni flow od intentu po insighty, bez preskakovani kroku.",
    journeyDescription:
      "Na desktopu se aktivni krok urcuje podle triggeru, ktery je nejbliz stredu viewportu. Na mobilu a tabletu se sekce prepne do jednoducheho stacked layoutu bez sticky chovani.",
    activeStepLabel: "Aktivni krok",
    stepLabel: "Krok",
    journeySteps: [
      {
        title: "Uzivatel napise, co chce vyresit",
        text: "Misto klikani pres menu, filtry nebo komplikovany formular jednoduse napise svuj zamer vlastnimi slovy.",
      },
      {
        title: "AI rozpozna intent a kontext webu",
        text: "Vrstva vyhodnoti, jestli jde o navigaci, doporuceni produktu, kvalifikaci leadu nebo prilezitost na upsell.",
      },
      {
        title: "AI vybere nejvhodnejsi flow",
        text: "System urci, ktera vetev webu, nabidky nebo formularu ma nejvyssi sanci dostat cloveka k vysledku bez treni.",
      },
      {
        title: "Uzivatel jde rovnou na spravne misto",
        text: "Navstevnik se dostane primo na relevantni podstranku, nabidku, formular nebo kombinaci dalsich kroku.",
      },
      {
        title: "AI doporuci dalsi relevantni krok",
        text: "Kdyz nastane vhodny moment, vrstva navrhne lepsi variantu, doplnkovou sluzbu nebo dalsi akci s vyssi pravdepodobnosti dokonceni.",
      },
      {
        title: "Z interakci vznikaji pouzitelne insighty",
        text: "Kazda konverzace ukazuje, kde je web nejasny, kde se lide ztraceji a ktere trasy vedou nejspolehliveji ke konverzi.",
      },
    ],
    pricingTag: "Cenik",
    pricingTitle: "Jasny pricing pro prvni fazi i prubezne ladeni.",
    pricing: {
      implementationLabel: "Implementace",
      implementationDescription:
        "Vybirate si jednu ze dvou urovni nasazeni podle komplexity webu a poctu rozhodovacich mist.",
      supportLabel: "Mesicni ladeni",
      supportPrice: "190 EUR",
      supportCadenceLabel: "/ mesic",
      supportLines: [
        "Optimalizace podle dat a realneho chovani navstevniku.",
        "Upravy pri zmene webu, obsahu nebo rozhodovacich cest.",
        "1 vetsi mesicni zmena v ramci nasazene AI vrstvy.",
      ],
      computeLabel: "AI computing power",
      computePrice: "odhad 10 az 100 EUR",
      computeCadenceLabel: "/ mesic",
      computeLines: [
        "Podle realneho pouzivani, navstevnosti a narocnosti nasazeni.",
        "Spotreba jde primo pres vlastni OpenAI Developer Platform ucet klienta.",
        "BendaLabs zajistuje implementaci, napojeni, logiku a prubezne ladeni.",
      ],
      tiers: [
        {
          variant: "Varianta 1",
          name: "Jednodussi implementace",
          price: "1 500 EUR",
          cadenceLabel: "jednorazove",
          text: "Pro jednodussi weby nebo jednu hlavni rozhodovaci vrstvu.",
          tone: "light",
        },
        {
          variant: "Varianta 2",
          name: "Slozitejsi implementace",
          price: "2 500 EUR",
          cadenceLabel: "jednorazove",
          text: "Pro vetsi weby s vice vetvemi, nabidkami a misty, kde se lame konverze.",
          tone: "muted",
        },
      ],
    },
    contactTag: "Kontakt / CTA",
    contactTitle: "Poslete svuj web a ukazu vam, kde se lame konverze.",
    contactDescription:
      "Staci poslat URL a kratce pojmenovat, kde se podle vas navstevnici ztraceji nebo co ma byt pro ne citelne jednodussi.",
    contactCardLabel: "Kontakt",
    contactButtonLabel: "Pozadat o konkretni navrh",
    contactMailSubject: "AI audit webu",
    contactMailBody: "Ahoj, posilam URL na audit: ",
  },
} as const satisfies Record<SiteLocale, HomePageContent>;

const auditPageContent = {
  sk: {
    metadataTitle: "AI audit webu | BendaLabs",
    metadataDescription:
      "AI audit webu ukaze, ci sa web hodi na AI vrstvu, kde sa lame konverzia a ako ma vyzerat prva faza nasadenia.",
    eyebrow: "AI audit webu",
    title: "AI audit webu",
    subtitle:
      "Ukazem, ci sa vas web hodi na AI vrstvu, kde sa lame konverzia a ako moze vyzerat prva faza nasadenia.",
    heroChips: [
      "Audit vhodnosti pre AI vrstvu",
      "Miesta, kde sa lame konverzia",
      "Prva faza nasadenia",
    ],
    auditBot: {
      badge: "AI audit webu",
      title: "Zadajte URL a spustite rychly AI audit svojho webu.",
      description:
        "Audit preveri homepage aj klucove podstranky a ukaze, kde by AI vrstva vedela zjednodusit navigaciu, odporucanie, lead flow a dalsi krok pouzivatela.",
      proposalTitle: "Chcete plny audit a konkretny navrh pre vas web?",
      proposalDescription:
        "Po rychlom audite vieme prejst na plny navrh AI vrstvy, prioritne miesta zasahu a realisticku prvu fazu nasadenia.",
      proposalButtonLabel: "Prejst na CTA",
    },
    sections: [
      {
        id: "hodnoti",
        label: "Co audit hodnoti",
        title: "Audit nehodnoti, ci je web pekny. Hodnoti, ci vie cloveka dostat do spravneho flowu.",
        description:
          "Pozriem sa na to, ako sa navstevnik rozhoduje, kde sa straca a ci ma AI vrstva realny priestor zlepsit vykon. Zaujima ma, ci je problem v navigacii, produktovej logike, formularoch alebo v tom, ze web nevie pracovat s intentom.",
        surface: "soft",
        cards: [
          {
            title: "Rozhodovacie miesta",
            text: "Kde musi navstevnik zvolit kategoriu, produkt, kalkulacku alebo formular skor, ako ma dost informacii na spravne rozhodnutie.",
          },
          {
            title: "Lomy konverzie",
            text: "Kde ludia odpadaju pred formularom, medzi detailom a objednavkou alebo pri prechode do kontaktu.",
          },
          {
            title: "Sila intentu",
            text: "Ci navstevnici prichadzaju s konkretnou ulohou a ci im web vie odporucit spravny dalsi krok bez bludenia.",
          },
          {
            title: "Pripravenost na AI vrstvu",
            text: "Ci je obsah, struktura a flow webu dost jasny na to, aby AI vrstva priniesla meratelny efekt uz v prvej faze.",
          },
        ],
      },
      {
        id: "dostanete",
        label: "Co dostanete",
        title: "Vystupom nie je vseobecny report. Vystupom je rozhodnutie, co nasadit ako prve.",
        description:
          "Audit ma pomoct rozhodnut, ci nasadenie dava zmysel, kde zacat a co nema zmysel robit hned. Bez tejto vrstvy sa casto riesi design alebo obsah, kym skutocny problem zostava v nespravnom toku navstevnika.",
        surface: "white",
        bullets: [
          "Zrozumitelny nazor, ci je web vhodny na AI vrstvu a ktore scenare maju najvyssiu sancu na prinos.",
          "Zoznam miest, kde sa dnes lame konverzia a preco tam ludia odpadaju.",
          "Navrh prvej fazy nasadenia: kde zacat, co presne ma AI vrstva robit a ake vetvy riesit najprv.",
          "Odporucanie, co sa oplati merat hned po spusteni, aby bolo jasne, ci nasadenie funguje.",
        ],
      },
      {
        id: "meranie",
        label: "Co sa bude merat po nasadeni",
        title: "Po nasadeni sa nehodnoti dojem. Hodnoti sa pohyb navstevnika a dopad na dopyt.",
        description:
          "Ak sa AI vrstva nasadi, musi byt od prveho dna jasne, co je uspech. Zaujima nas, ci ludia trafia spravne flowy, ci sa skracuje cesta ku konverzii a ci obchod dostava kvalitnejsie vstupy.",
        surface: "tint",
        bullets: [
          "Kolko navstevnikov sa z intent vstupu dostalo do spravneho flowu bez bludenia cez menu a filtre.",
          "Pokles odpadu pred formularom, rezervaciou alebo objednavkou.",
          "Zmena v pocte dokoncenych dopytov alebo rezervacii po nasadeni prvej fazy.",
          "Miera prijatia odporucenych dalsich krokov alebo suvisiacich produktov.",
          "Kde sa stale objavuje trenie a co treba doladit v dalsom kole.",
        ],
      },
      {
        id: "cennik",
        label: "Cennik",
        title: "Cennik je pevny. Rozdiel je len v tom, aka zlozitost dava zmysel pre vas web.",
        description:
          "Ak web potrebuje len jednu rozhodovaciu vrstvu, implementacia je jednoduchsia. Ak ma viac vetiev, viac typov formularov alebo silnejsiu produktovu logiku, ide o zlozitejsie nasadenie.",
        surface: "white",
        statements: [
          "Jednoduchsia implementacia - 1 500 EUR jednorazovo",
          "Zlozitejsia implementacia - 2 500 EUR jednorazovo",
          "Mesacne doladenie - 190 EUR / mesiac",
          "AI computing power - odhad 10 az 100 EUR / mesiac podla realneho pouzivania, cez OpenAI ucet klienta",
        ],
      },
    ],
    ctaTitle:
      "Poslite web a poviem vam, ci ma AI vrstva zmysel uz teraz alebo az po uprave flowov.",
    ctaText:
      "Staci URL a kratky popis, kde sa dnes stracaju navstevnici alebo dopyty. Vratim sa s konkretnym nazorom na vhodnost, prvu fazu a realny rozsah implementacie.",
    ctaButtonLabel: "Objednat AI audit webu",
    ctaMailSubject: "AI audit webu",
  },
  cs: {
    metadataTitle: "AI audit webu | BendaLabs",
    metadataDescription:
      "AI audit webu ukaze, jestli se web hodi na AI vrstvu, kde se lame konverze a jak ma vypadat prvni faze nasazeni.",
    eyebrow: "AI audit webu",
    title: "AI audit webu",
    subtitle:
      "Ukazu, jestli se vas web hodi na AI vrstvu, kde se lame konverze a jak muze vypadat prvni faze nasazeni.",
    heroChips: [
      "Audit vhodnosti pro AI vrstvu",
      "Mista, kde se lame konverze",
      "Prvni faze nasazeni",
    ],
    auditBot: {
      badge: "AI audit webu",
      title: "Zadejte URL a spustte rychly AI audit sveho webu.",
      description:
        "Audit proveri homepage i klicove podstranky a ukaze, kde by AI vrstva dokazala zjednodusit navigaci, doporuceni, lead flow a dalsi krok uzivatele.",
      proposalTitle: "Chcete plny audit a konkretni navrh pro vas web?",
      proposalDescription:
        "Po rychlem auditu muzeme prejit na plny navrh AI vrstvy, prioritni mista zasahu a realistickou prvni fazi nasazeni.",
      proposalButtonLabel: "Prejit na CTA",
    },
    sections: [
      {
        id: "hodnoti",
        label: "Co audit hodnoti",
        title: "Audit nehodnoti, jestli je web hezky. Hodnoti, jestli umi dostat cloveka do spravneho flow.",
        description:
          "Podivam se na to, jak se navstevnik rozhoduje, kde se ztraci a jestli ma AI vrstva realny prostor zlepsit vykon. Zajima me, jestli je problem v navigaci, produktove logice, formularech nebo v tom, ze web neumi pracovat s intentem.",
        surface: "soft",
        cards: [
          {
            title: "Rozhodovaci mista",
            text: "Kde musi navstevnik zvolit kategorii, produkt, kalkulacku nebo formular driv, nez ma dost informaci pro spravne rozhodnuti.",
          },
          {
            title: "Zlomy konverze",
            text: "Kde lide odpadaji pred formularem, mezi detailem a objednavkou nebo pri prechodu do kontaktu.",
          },
          {
            title: "Sila intentu",
            text: "Jestli navstevnici prichazeji s konkretnim ukolem a jestli jim web umi doporucit spravny dalsi krok bez bloudeni.",
          },
          {
            title: "Pripravenost na AI vrstvu",
            text: "Jestli je obsah, struktura a flow webu dostatecne jasny na to, aby AI vrstva prinesla meritelny efekt uz v prvni fazi.",
          },
        ],
      },
      {
        id: "dostanete",
        label: "Co dostanete",
        title: "Vystupem neni obecny report. Vystupem je rozhodnuti, co nasadit jako prvni.",
        description:
          "Audit ma pomoct rozhodnout, jestli nasazeni dava smysl, kde zacit a co nema smysl delat hned. Bez teto vrstvy se casto resi design nebo obsah, zatimco skutecny problem zustava ve spatnem toku navstevnika.",
        surface: "white",
        bullets: [
          "Srozumitelny nazor, jestli je web vhodny pro AI vrstvu a ktere scenare maji nejvyssi sanci na prinos.",
          "Seznam mist, kde se dnes lame konverze a proc tam lide odpadaji.",
          "Navrh prvni faze nasazeni: kde zacit, co presne ma AI vrstva delat a ktere vetve resit nejdriv.",
          "Doporuceni, co se vyplati merit hned po spusteni, aby bylo jasne, jestli nasazeni funguje.",
        ],
      },
      {
        id: "merani",
        label: "Co se bude merit po nasazeni",
        title: "Po nasazeni se nehodnoti dojem. Hodnoti se pohyb navstevnika a dopad na poptavku.",
        description:
          "Kdyz se AI vrstva nasadi, musi byt od prvniho dne jasne, co je uspech. Zajima nas, jestli lide trefi spravne flow, jestli se zkracuje cesta ke konverzi a jestli obchod dostava kvalitnejsi vstupy.",
        surface: "tint",
        bullets: [
          "Kolik navstevniku se z intent vstupu dostalo do spravneho flow bez bloudeni pres menu a filtry.",
          "Pokles odpadu pred formularem, rezervaci nebo objednavkou.",
          "Zmena v poctu dokoncenych poptavek nebo rezervaci po nasazeni prvni faze.",
          "Mira prijeti doporucenych dalsich kroku nebo souvisejicich produktu.",
          "Kde se stale objevuje treni a co je potreba doladit v dalsim kole.",
        ],
      },
      {
        id: "cenik",
        label: "Cenik",
        title: "Cenik je pevny. Rozdil je jen v tom, jaka slozitost dava smysl pro vas web.",
        description:
          "Pokud web potrebuje jen jednu rozhodovaci vrstvu, implementace je jednodussi. Pokud ma vice vetvi, vice typu formularu nebo silnejsi produktovou logiku, jde o slozitejsi nasazeni.",
        surface: "white",
        statements: [
          "Jednodussi implementace - 1 500 EUR jednorazove",
          "Slozitejsi implementace - 2 500 EUR jednorazove",
          "Mesicni ladeni - 190 EUR / mesic",
          "AI computing power - odhad 10 az 100 EUR / mesic podle realneho pouzivani, pres OpenAI ucet klienta",
        ],
      },
    ],
    ctaTitle:
      "Poslete web a reknu vam, jestli dava AI vrstva smysl uz ted, nebo az po uprave flow.",
    ctaText:
      "Staci URL a kratky popis, kde se dnes ztraceji navstevnici nebo poptavky. Vratim se s konkretnim nazorem na vhodnost, prvni fazi a realny rozsah implementace.",
    ctaButtonLabel: "Objednat AI audit webu",
    ctaMailSubject: "AI audit webu",
  },
} as const satisfies Record<SiteLocale, ServicePageContent>;

const financePageContent = {
  sk: {
    metadataTitle: "AI vrstva pre financne a poistne weby | BendaLabs",
    metadataDescription:
      "AI vrstva, ktora dostane navstevnika do spravnej kalkulacky, formulara alebo produktu skor a s mensim odpadom pred odoslanim dopytu.",
    eyebrow: "AI vrstva pre financne a poistne weby",
    title: "AI vrstva pre financne a poistne weby",
    subtitle:
      "Dostane viac ludi do spravnej kalkulacky, znizi odpad pred formularom a zvysi pocet dokoncenych dopytov.",
    heroChips: [
      "Hypoteky a refinancovanie",
      "PZP a havarijne poistenie",
      "Investovanie, sporenie, kontakt",
    ],
    auditBot: {
      badge: "AI audit webu",
      title: "Zadajte URL a hned uvidite, kde sa na financnom alebo poistnom webe lame cesta ku dopytu.",
      description:
        "Audit preveri homepage aj klucove produktove vetvy a ukaze, kde by AI vrstva vedela rychlejsie dostat navstevnika do spravnej kalkulacky, formulara alebo kontaktu.",
      proposalTitle: "Chcete audit a konkretny navrh AI vrstvy pre vas financny alebo poistny web?",
      proposalDescription:
        "Po audite sa vieme pozriet na miesta, kde dnes ludia netrafia spravny flow, odpadaju pred formularom alebo koncia vo vseobecnej sekcii bez dopytu.",
      proposalButtonLabel: "Prejst na CTA",
    },
    sections: [
      {
        id: "problem",
        label: "Problem",
        title: "Najvacsi problem nie je traffic. Je to zly vyber prveho kroku.",
        description:
          "Na financnych a poistnych weboch ludia neprichadzaju s nazvom produktu. Prichadzaju s potrebou. Chcu znizit splatku, vyriesit PZP, zistit ci ma zmysel investovanie alebo sa len dostat ku kontaktu. Ak web od nich hned pyta spravnu kategoriu, velka cast sa odpoji skor, ako otvori relevantny flow.",
        surface: "soft",
        cards: [
          {
            title: "Hypoteky a refinancovanie",
            text: "Pouzivatel casto nevie, ci patri do novej hypoteky, refinancovania alebo len orientacneho prepocitu. Ked netrafi spravnu kalkulacku, konverzia pada uz na vstupe.",
          },
          {
            title: "PZP a havarijne",
            text: "Rozhodovanie sa lame medzi cenou, rozsahom krytia a tym, ci clovek riesi novu zmluvu alebo zmenu. Menu a filtre tu nestacia.",
          },
          {
            title: "Investovanie a sporenie",
            text: "Navstevnik vie povedat ciel, nie produkt. Ak ho web nuti vybrat nespravnu vetvu, odide bez kontaktu aj bez dopytu.",
          },
          {
            title: "Kontakt a formular",
            text: "Aj clovek pripraveny odoslat dopyt sa casto strati medzi viacerymi formularmi. Odpad pred formularom byva drahsi ako slabsi closing.",
          },
        ],
      },
      {
        id: "co-robi",
        label: "Co robi AI vrstva",
        title: "AI vrstva nepredava. Preradi cloveka do spravneho flowu skor, ako sa pomyli.",
        description:
          "Vrstva cita intent navstevnika vo vlastnych slovach, rozpozna hlavny zamer a posle ho do konkretneho dalsieho kroku. Nie do vseobecnej sekcie. Do kalkulacky, formulara, produktovej vetvy alebo kontaktu, ktory dava zmysel pre dany dopyt.",
        surface: "white",
        cards: [
          {
            title: "Intent namiesto menu",
            text: "Pouzivatel napise, ze chce znizit mesacnu splatku, poistit auto alebo odkladat peniaze na rezervu. System nemusi cakat, kym sam najde spravny produkt.",
          },
          {
            title: "Menej odpadu pred formularom",
            text: "AI vrstva odfiltruje slepe odbocky a posuva navstevnika len do formulara, kde ma realnu sancu dokoncit dopyt.",
          },
          {
            title: "Odporucanie suvisiacich produktov",
            text: "Ak je clovek v spravnom momente, vrstva odporuci dalsi logicky krok. Napriklad popri refinancovani navrhne poistenie nehnutelnosti alebo popri sporiacom produkte investicnu vetvu.",
          },
          {
            title: "Lepsie presmerovanie na kontakt",
            text: "Tam, kde nema zmysel dalsie klikanie, posle AI cloveka rovno na kontakt alebo na presne ten formular, ktory vie obchodny tim spracovat.",
          },
        ],
      },
      {
        id: "konverzia",
        label: "Kde sa lame konverzia",
        title: "Lom nenastava v poslednom kroku. Zvycajne nastane o dve obrazovky skor.",
        description:
          "Najvacsi prepad byva medzi prvym intentom a prvym relevantnym flowom. Ked sa clovek pomyli v tom, ci otvori refinancovanie, PZP kalkulacku, investicny obsah alebo kontakt, web uz iba dobieha zle rozhodnutie.",
        surface: "tint",
        bullets: [
          "Pouzivatel nevie, ci ma otvorit hypoteku, refinancovanie alebo len orientacny prepocet.",
          "Pri PZP a havarijnom poisteni sa zasekne medzi krytim, cenou a nejasnym dalsim krokom.",
          "Pri investovani a sporeni nenajde vetvu, ktora zodpoveda cielu a rizikovemu profilu.",
          "Pred formularom odpadne, lebo si nie je isty, ci je na spravnom mieste.",
          "Web neponukne suvisiaci produkt v momente, ked je navstevnik pripraveny pokracovat.",
        ],
      },
      {
        id: "meranie",
        label: "Co sa bude merat",
        title: "Ak sa to nema merat, nema zmysel to nasadzovat.",
        description:
          "Po nasadeni sa nesleduje iba pocet chat interakcii. Sleduje sa, ci vrstva skracuje cestu k dopytu, posiela viac ludi do spravnych kalkulaciek a ci obchod dostava cistejsie leady.",
        surface: "white",
        bullets: [
          "Podiel navstevnikov, ktori sa z intent vstupu dostanu do spravnej kalkulacky alebo formulara.",
          "Pokles odpadu pred formularom a pocet dokoncenych dopytov na hypoteky, poistenie a investicne produkty.",
          "Kolko ludi AI presmerovala z vseobecneho vstupu na kontakt s realnym obchodnym potencialom.",
          "Miera prijatia odporucenych suvisiacich produktov alebo dalsich krokov.",
          "Kde sa ludia stale zasekavaju a ktore vetvy webu treba doladit ako dalsie.",
        ],
      },
    ],
    ctaTitle: "Ak mate financny alebo poistny web, pozriem sa, kde dnes stracate dopyty.",
    ctaText:
      "Poslite URL, hlavne produktove vetvy a miesto, kde sa vam dnes lomi konverzia. Vratim sa s konkretnym nazorom, ci tam AI vrstva vie realne zlepsit vykon.",
    ctaButtonLabel: "Poslat web na posudenie",
    ctaMailSubject: "AI vrstva pre financny alebo poistny web",
  },
  cs: {
    metadataTitle: "AI vrstva pro financni a pojistne weby | BendaLabs",
    metadataDescription:
      "AI vrstva, ktera dostane navstevnika do spravne kalkulacky, formulare nebo produktu driv a s mensim odpadem pred odeslanim poptavky.",
    eyebrow: "AI vrstva pro financni a pojistne weby",
    title: "AI vrstva pro financni a pojistne weby",
    subtitle:
      "Dostane vic lidi do spravne kalkulacky, snizi odpad pred formularem a zvysi pocet dokoncenych poptavek.",
    heroChips: [
      "Hypoteky a refinancovani",
      "Povinne ruceni a havarijni pojisteni",
      "Investovani, sporeni, kontakt",
    ],
    auditBot: {
      badge: "AI audit webu",
      title: "Zadejte URL a hned uvidite, kde se na financnim nebo pojistnem webu lame cesta k poptavce.",
      description:
        "Audit proveri homepage i klicove produktove vetve a ukaze, kde by AI vrstva dokazala rychleji dostat navstevnika do spravne kalkulacky, formulare nebo kontaktu.",
      proposalTitle: "Chcete audit a konkretni navrh AI vrstvy pro vas financni nebo pojistny web?",
      proposalDescription:
        "Po auditu se muzeme podivat na mista, kde dnes lide netrefi spravny flow, odpadaji pred formularem nebo konci v obecne sekci bez poptavky.",
      proposalButtonLabel: "Prejit na CTA",
    },
    sections: [
      {
        id: "problem",
        label: "Problem",
        title: "Nejvetsi problem neni traffic. Je to spatny vyber prvniho kroku.",
        description:
          "Na financnich a pojistnych webech lide neprichazeji s nazvem produktu. Prichazeji s potrebou. Chteji snizit splatku, vyresit povinne ruceni, zjistit jestli dava smysl investovani nebo se jen dostat ke kontaktu. Pokud web hned vyzaduje spravnou kategorii, velka cast se odpoji driv, nez otevre relevantni flow.",
        surface: "soft",
        cards: [
          {
            title: "Hypoteky a refinancovani",
            text: "Uzivatel casto nevi, jestli patri do nove hypoteky, refinancovani nebo jen orientacniho prepocitu. Kdyz netrefi spravnou kalkulacku, konverze pada uz na vstupu.",
          },
          {
            title: "Povinne ruceni a havarijni pojisteni",
            text: "Rozhodovani se lame mezi cenou, rozsahem kryti a tim, jestli clovek resi novou smlouvu nebo zmenu. Menu a filtry tu nestaci.",
          },
          {
            title: "Investovani a sporeni",
            text: "Navstevnik umi popsat cil, ne produkt. Kdyz ho web nuti vybrat spatnou vetev, odchazi bez kontaktu i bez poptavky.",
          },
          {
            title: "Kontakt a formular",
            text: "I clovek pripraveny odeslat poptavku se casto ztrati mezi vice formulary. Odpad pred formularem byva drazsi nez slabsi closing.",
          },
        ],
      },
      {
        id: "co-dela",
        label: "Co dela AI vrstva",
        title: "AI vrstva neprodava. Preradi cloveka do spravneho flow driv, nez se splete.",
        description:
          "Vrstva cte intent navstevnika jeho vlastnimi slovy, rozpozna hlavni zamer a posle ho do konkretniho dalsiho kroku. Ne do obecne sekce. Do kalkulacky, formulare, produktove vetve nebo kontaktu, ktery dava smysl pro danou poptavku.",
        surface: "white",
        cards: [
          {
            title: "Intent misto menu",
            text: "Uzivatel napise, ze chce snizit mesicni splatku, pojistit auto nebo odkladat penize na rezervu. System nemusi cekat, az sam najde spravny produkt.",
          },
          {
            title: "Mene odpadu pred formularem",
            text: "AI vrstva odfiltruje slepe odbocky a posouva navstevnika jen do formulare, kde ma realnou sanci dokoncit poptavku.",
          },
          {
            title: "Doporuceni souvisejicich produktu",
            text: "Kdyz je clovek ve spravnem momentu, vrstva doporuci dalsi logicky krok. Treba vedle refinancovani navrhne pojisteni nemovitosti nebo vedle sporiciho produktu investicni vetev.",
          },
          {
            title: "Lepse presmerovani na kontakt",
            text: "Tam, kde nema smysl dalsi klikani, posle AI cloveka rovnou na kontakt nebo na presne ten formular, ktery umi obchodni tym zpracovat.",
          },
        ],
      },
      {
        id: "konverze",
        label: "Kde se lame konverze",
        title: "Zlom nenastava v poslednim kroku. Obvykle prijde o dve obrazovky driv.",
        description:
          "Nejvetsi propad byva mezi prvnim intentem a prvnim relevantnim flow. Kdyz se clovek splete v tom, jestli otevrit refinancovani, kalkulacku povinneho ruceni, investicni obsah nebo kontakt, web uz jen dobiha spatne rozhodnuti.",
        surface: "tint",
        bullets: [
          "Uzivatel nevi, jestli ma otevrit hypoteku, refinancovani nebo jen orientacni prepocet.",
          "U povinneho ruceni a havarijniho pojisteni se zasekne mezi krytim, cenou a nejasnym dalsim krokem.",
          "U investovani a sporeni nenajde vetev, ktera odpovida cili a rizikovemu profilu.",
          "Pred formularem odpadne, protoze si neni jisty, jestli je na spravnem miste.",
          "Web nenabidne souvisejici produkt ve chvili, kdy je navstevnik pripraven pokracovat.",
        ],
      },
      {
        id: "mereni",
        label: "Co se bude merit",
        title: "Kdyz se to nema merit, nema smysl to nasazovat.",
        description:
          "Po nasazeni se nesleduje jen pocet chat interakci. Sleduje se, jestli vrstva zkracuje cestu k poptavce, posila vic lidi do spravnych kalkulacek a jestli obchod dostava cistsi leady.",
        surface: "white",
        bullets: [
          "Podil navstevniku, kteri se z intent vstupu dostanou do spravne kalkulacky nebo formulare.",
          "Pokles odpadu pred formularem a pocet dokoncenych poptavek na hypoteky, pojisteni a investicni produkty.",
          "Kolik lidi AI presmerovala z obecneho vstupu na kontakt s realnym obchodnim potencialem.",
          "Mira prijeti doporucenych souvisejicich produktu nebo dalsich kroku.",
          "Kde se lide stale zasekavaji a ktere vetve webu je potreba doladit jako dalsi.",
        ],
      },
    ],
    ctaTitle: "Pokud mate financni nebo pojistny web, podivam se, kde dnes ztracite poptavky.",
    ctaText:
      "Poslete URL, hlavni produktove vetve a misto, kde se vam dnes lame konverze. Vratim se s konkretnim nazorem, jestli tam AI vrstva umi realne zlepsit vykon.",
    ctaButtonLabel: "Poslat web k posouzeni",
    ctaMailSubject: "AI vrstva pro financni nebo pojistny web",
  },
} as const satisfies Record<SiteLocale, ServicePageContent>;

const marketplacePageContent = {
  sk: {
    metadataTitle: "AI vrstva pre marketplace a rental weby | BendaLabs",
    metadataDescription:
      "AI vrstva, ktora naviguje navstevnika podla ulohy, nie podla nazvu produktu, a skracuje cestu k rezervacii alebo objednavke.",
    eyebrow: "MARKETPLACE A RENTAL",
    title: "AI vrstva pre marketplace a rental weby",
    subtitle:
      "Pouzivatel casto nepride s presnym nazvom produktu alebo sluzby. Pride s ulohou, problemom alebo situaciou. AI vrstva z jeho zadania pochopi intent a navedie ho na spravny produkt, ponuku alebo dalsi krok.",
    heroChips: [
      "Vela kategorii a filtrov",
      "Intent podla ulohy",
      "Kratsia cesta k rezervacii",
    ],
    auditBot: {
      badge: "AI audit webu",
      title: "Zadajte URL a hned uvidite, kde sa na marketplace alebo rental webe predlzuje cesta k rezervacii.",
      description:
        "Audit preveri homepage aj klucove podstranky a ukaze, kde by AI vrstva vedela lepsie priradit intent k produktu, ponuke alebo dalsiemu kroku.",
      proposalTitle: "Chcete audit a konkretny navrh AI vrstvy pre vas marketplace alebo rental web?",
      proposalDescription:
        "Po audite sa vieme pozriet na miesta, kde dnes navstevnik hlada prilis dlho, netrafi spravnu ponuku alebo odpadne pred rezervaciou.",
      proposalButtonLabel: "Prejst na CTA",
    },
    sections: [
      {
        id: "problem",
        label: "Problem",
        title: "Marketplace a rental weby casto neprehravaju na ponuke. Prehravaju na orientacii.",
        description:
          "Velke mnozstvo kategorii, filtrov a typov ponuk vyzera dobre v produktovej mape. Pre navstevnika je to casto brzda. Neprichadza s nazvom produktu. Prichadza s ulohou, ktoru chce vyriesit teraz.",
        surface: "soft",
        cards: [
          {
            title: "Prilis vela kategorii",
            text: "Ak ma web vela vetiev, clovek musi najprv pochopit internu logiku katalogu. To je zla pozicia hned na zaciatku.",
          },
          {
            title: "Filtre nepracuju s intentom",
            text: "Pouzivatel nevie, ci potrebuje konkretny produkt, sluzbu alebo cely set. Vie len, co chce spravit a v akom case.",
          },
          {
            title: "Menu nepozna konkretnu situaciu",
            text: "Klasicka navigacia nepovie, co je najlepsi dalsi krok pre dany problem, termin, rozpocet alebo sposob pouzitia.",
          },
          {
            title: "Rezervacia je prilis daleko",
            text: "Kazdy nadbytocny klik medzi prvou potrebou a rezervaciou zvysuje sancu, ze clovek odide alebo skonci bez akcie.",
          },
        ],
      },
      {
        id: "intent",
        label: "Ako sa hlada",
        title: "Pouzivatel nepride s nazvom produktu. Pride s ulohou, problemom alebo situaciou.",
        description:
          "AI vrstva z textu pochopi intent a prelozi ho na spravny produkt, ponuku alebo dalsi krok. Nemusi cakat, kym clovek trafi internu strukturu katalogu alebo pozna spravne nazvy kategorii.",
        surface: "white",
        cards: [
          {
            title: "Uloha namiesto produktu",
            text: "Navstevnik napise, co chce vyriesit, a web to prelozi na konkretny typ produktu, sluzby alebo rezervacneho flowu.",
          },
          {
            title: "Spravna ponuka na prvy pokus",
            text: "AI odporuci spravny produkt alebo ponuku bez toho, aby navstevnik musel rucne prechadzat viac kategorii, filtrov a technickych parametrov.",
          },
          {
            title: "Dalsi krok bez bludenia",
            text: "Ak dopyt este nie je pripraveny na rezervaciu, vrstva posle cloveka na relevantny detail, porovnanie, formular alebo kontakt. Nie spat na zoznam.",
          },
          {
            title: "Menej prazdnych navstev",
            text: "Aj pri sirsej ponuke sa zvysi podiel ludi, ktori sa dostanu do realneho objednavkoveho alebo rezervacneho procesu.",
          },
        ],
      },
      {
        id: "co-robi",
        label: "Co robi AI vrstva",
        title: "AI vrstva chape intent, nie len klucove slova.",
        description:
          "Vrstva priradi intent ku konkretnej casti webu a odporuci spravny produkt, sluzbu, rental flow alebo dalsi krok. Pomaha hlavne tam, kde vacsi katalog a viac vetiev vytvara zbytocny chaos uz na zaciatku navstevy.",
        surface: "tint",
        bullets: [
          "Rozpozna, ci clovek hlada produkt, rezervaciu, doplnkovu sluzbu alebo len potrebuje pomoct s vyberom.",
          "Pomaha najst spravny produkt, sluzbu alebo rental flow aj vtedy, ked navstevnik nepozna presny nazov kategorie.",
          "Znizuje chaos pri vacsom katalogu, kde menu a filtre nestacia na rychle rozhodnutie.",
          "Posle cloveka rovno na dalsi krok, ktory zvysuje sancu na dopyt, rezervaciu alebo objednavku.",
          "Vie odporucit aj suvisiacu ponuku, ak dava zmysel pre konkretnu situaciu alebo termin pouzitia.",
        ],
      },
      {
        id: "prinos",
        label: "Co to prinesie",
        title: "Prinos je jednoduchy. Menej hladania, viac objednavok z existujucej navstevnosti.",
        description:
          "Nasadenie sa oplati tam, kde web nepotrebuje krajsi filter, ale rychlejsie priradenie potreby ku konkretnej ponuke. To je priamo viditelne na rezervaciach, objednavkach aj kvalite navstev, ktore sa dostanu do finalneho kroku.",
        surface: "white",
        bullets: [
          "Kratsia cesta od prveho dotazu po rezervaciu alebo objednavku.",
          "Vyssi podiel navstevnikov, ktori trafia spravny produkt na prvy pokus.",
          "Menej odpadnutych navstev medzi zoznamom, detailom a kosikom alebo rezervacnym formularom.",
          "Lepsie data o tom, s akou ulohou ludia realne prichadzaju na web.",
          "Jasnejsie miesto, kde doladovat obsah, kategoriu alebo obchodne pravidla.",
        ],
      },
    ],
    ctaTitle:
      "Ak mate marketplace alebo rental web, pozriem sa, kde sa dnes zbytocne predlzuje cesta k rezervacii.",
    ctaText:
      "Poslite URL, hlavne vetvy katalogu a miesto, kde dnes ludia najcastejsie bludia alebo odpadaju. Vratim sa s konkretnym nazorom, ci AI vrstva vie skracovat cestu k dopytu, rezervacii alebo objednavke uz v prvej faze.",
    ctaButtonLabel: "Poslat marketplace alebo rental web",
    ctaMailSubject: "AI vrstva pre marketplace alebo rental web",
  },
  cs: {
    metadataTitle: "AI vrstva pro marketplace a rental weby | BendaLabs",
    metadataDescription:
      "AI vrstva, ktera naviguje navstevnika podle ukolu, ne podle nazvu produktu, a zkracuje cestu k rezervaci nebo objednavce.",
    eyebrow: "MARKETPLACE A RENTAL",
    title: "AI vrstva pro marketplace a rental weby",
    subtitle:
      "Uzivatel casto neprijde s presnym nazvem produktu nebo sluzby. Prijde s ukolem, problemem nebo situaci. AI vrstva z jeho zadani pochopi intent a navede ho na spravny produkt, nabidku nebo dalsi krok.",
    heroChips: [
      "Hodne kategorii a filtru",
      "Intent podle ukolu",
      "Kratsi cesta k rezervaci",
    ],
    auditBot: {
      badge: "AI audit webu",
      title: "Zadejte URL a hned uvidite, kde se na marketplace nebo rental webu prodluzuje cesta k rezervaci.",
      description:
        "Audit proveri homepage i klicove podstranky a ukaze, kde by AI vrstva dokazala lepe priradit intent k produktu, nabidce nebo dalsimu kroku.",
      proposalTitle: "Chcete audit a konkretni navrh AI vrstvy pro vas marketplace nebo rental web?",
      proposalDescription:
        "Po auditu se muzeme podivat na mista, kde dnes navstevnik hleda prilis dlouho, netrefi spravnou nabidku nebo odpadne pred rezervaci.",
      proposalButtonLabel: "Prejit na CTA",
    },
    sections: [
      {
        id: "problem",
        label: "Problem",
        title: "Marketplace a rental weby casto neprohravaji na nabidce. Prohravaji na orientaci.",
        description:
          "Velke mnozstvi kategorii, filtru a typu nabidek vypada dobre v produktove mape. Pro navstevnika je to casto brzda. Neprichazi s nazvem produktu. Prichazi s ukolem, ktery chce vyresit ted.",
        surface: "soft",
        cards: [
          {
            title: "Prilis mnoho kategorii",
            text: "Kdyz ma web hodne vetvi, clovek musi nejdriv pochopit interni logiku katalogu. To je spatna pozice hned na zacatku.",
          },
          {
            title: "Filtry nepracuji s intentem",
            text: "Uzivatel nevi, jestli potrebuje konkretni produkt, sluzbu nebo cely set. Vi jen, co chce udelat a v jakem case.",
          },
          {
            title: "Menu nezna konkretni situaci",
            text: "Klasicka navigace nerekne, co je nejlepsi dalsi krok pro dany problem, termin, rozpocet nebo zpusob pouziti.",
          },
          {
            title: "Rezervace je prilis daleko",
            text: "Kazdy zbytecny klik mezi prvni potrebou a rezervaci zvysuje sanci, ze clovek odejde nebo skonci bez akce.",
          },
        ],
      },
      {
        id: "intent",
        label: "Jak se hleda",
        title: "Uzivatel neprijde s nazvem produktu. Prijde s ukolem, problemem nebo situaci.",
        description:
          "AI vrstva z textu pochopi intent a prelozi ho na spravny produkt, nabidku nebo dalsi krok. Nemusi cekat, az clovek trefi interni strukturu katalogu nebo zna spravne nazvy kategorii.",
        surface: "white",
        cards: [
          {
            title: "Ukol misto produktu",
            text: "Navstevnik napise, co chce vyresit, a web to prelozi na konkretni typ produktu, sluzby nebo rezervacniho flow.",
          },
          {
            title: "Spravna nabidka na prvni pokus",
            text: "AI doporuci spravny produkt nebo nabidku bez toho, aby navstevnik musel rucne prochazet vice kategorii, filtru a technickych parametru.",
          },
          {
            title: "Dalsi krok bez bloudeni",
            text: "Pokud poptavka jeste neni pripravena na rezervaci, vrstva posle cloveka na relevantni detail, srovnani, formular nebo kontakt. Ne zpet na seznam.",
          },
          {
            title: "Mene prazdnych navstev",
            text: "I pri siroke nabidce se zvysi podil lidi, kteri se dostanou do realneho objednavkoveho nebo rezervacniho procesu.",
          },
        ],
      },
      {
        id: "co-dela",
        label: "Co dela AI vrstva",
        title: "AI vrstva chape intent, ne jen klicova slova.",
        description:
          "Vrstva priradi intent ke konkretni casti webu a doporuci spravny produkt, sluzbu, rental flow nebo dalsi krok. Pomaha hlavne tam, kde vetsi katalog a vice vetvi vytvari zbytecny chaos uz na zacatku navstevy.",
        surface: "tint",
        bullets: [
          "Rozpozna, jestli clovek hleda produkt, rezervaci, doplnkovou sluzbu nebo jen potrebuje pomoct s vyberem.",
          "Pomaha najit spravny produkt, sluzbu nebo rental flow i tehdy, kdyz navstevnik nezna presny nazev kategorie.",
          "Snizuje chaos u vetsiho katalogu, kde menu a filtry nestaci na rychle rozhodnuti.",
          "Posle cloveka rovnou na dalsi krok, ktery zvysuje sanci na poptavku, rezervaci nebo objednavku.",
          "Umi doporucit i souvisejici nabidku, pokud dava smysl pro konkretni situaci nebo termin pouziti.",
        ],
      },
      {
        id: "prinos",
        label: "Co to prinese",
        title: "Prinos je jednoduchy. Mene hledani, vic objednavek ze stavajici navstevnosti.",
        description:
          "Nasazeni se vyplati tam, kde web nepotrebuje hezci filtr, ale rychlejsi prirazeni potreby ke konkretni nabidce. To je primo viditelne na rezervacich, objednavkach i kvalite navstev, ktere se dostanou do finalniho kroku.",
        surface: "white",
        bullets: [
          "Kratsi cesta od prvniho dotazu k rezervaci nebo objednavce.",
          "Vyssi podil navstevniku, kteri trefi spravny produkt na prvni pokus.",
          "Mene odpadlych navstev mezi seznamem, detailem a kosikem nebo rezervacnim formularem.",
          "Lepsi data o tom, s jakym ukolem lide realne prichazeji na web.",
          "Jasnejsi misto, kde ladit obsah, kategorii nebo obchodni pravidla.",
        ],
      },
    ],
    ctaTitle:
      "Pokud mate marketplace nebo rental web, podivam se, kde se dnes zbytecne prodluzuje cesta k rezervaci.",
    ctaText:
      "Poslete URL, hlavni vetve katalogu a misto, kde dnes lide nejcasteji bloudi nebo odpadaji. Vratim se s konkretnim nazorem, jestli AI vrstva umi zkracovat cestu k poptavce, rezervaci nebo objednavce uz v prvni fazi.",
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
