import type { SiteAudit } from "../site-audit/schema";

export type DashboardPreviewLocale = "sk" | "cs";

export type DashboardPreviewSegment =
  | "real_estate"
  | "finance_insurance"
  | "ecommerce"
  | "marketplace_services"
  | "healthcare_clinic"
  | "dental_clinic"
  | "aesthetic_dermatology_clinic"
  | "eye_clinic"
  | "rental"
  | "b2b_industrial"
  | "generic_business";

type DashboardPreviewAuditSource = SiteAudit &
  Partial<{
    domain: string;
    fit_type: string;
    category: string;
    detected_website_type: string;
    recommendation_text: string;
    capabilities: string[];
    inspected_pages: string[];
    service_hints: string[];
    product_hints: string[];
    category_hints: string[];
    weak_spots: string[];
    use_case_examples: string[];
  }>;

export type DashboardPreviewQuality = "high" | "medium" | "low";

export type DashboardPreviewMetric = {
  label: string;
  value: string;
  hint: string;
};

export type DashboardPreviewIntentBar = {
  label: string;
  value: number;
  hint: string;
};

export type DashboardPreviewLead = {
  intent: string;
  detail: string;
  quality: DashboardPreviewQuality;
  qualityLabel: string;
  nextStep: string;
};

export type DashboardPreviewCopy = {
  segment: DashboardPreviewSegment;
  domainLabel: string;
  segmentLabel: string;
  previewBadge: string;
  simulatedBadge: string;
  previewNote: string;
  metrics: DashboardPreviewMetric[];
  leadTableTitle: string;
  leadTableCaption: string;
  leadColumnLabels: {
    intent: string;
    detail: string;
    quality: string;
    nextStep: string;
  };
  leadRows: DashboardPreviewLead[];
  questionTitle: string;
  questionItems: string[];
  intentTitle: string;
  intentItems: DashboardPreviewIntentBar[];
  insightsTitle: string;
  insights: string[];
  reasonsTitle: string;
  reasons: string[];
  nextStepsTitle: string;
  nextSteps: string[];
  highlightTitle: string;
  highlightText: string;
};

type LeadSeed = {
  intent: string;
  detail: string;
  quality: DashboardPreviewQuality;
  nextStep: string;
};

type SegmentTemplate = {
  label: Record<DashboardPreviewLocale, string>;
  topTheme: Record<DashboardPreviewLocale, string>;
  questions: Record<DashboardPreviewLocale, string[]>;
  leads: Record<DashboardPreviewLocale, LeadSeed[]>;
  reasons: Record<DashboardPreviewLocale, string[]>;
  nextSteps: Record<DashboardPreviewLocale, string[]>;
  insights: Record<DashboardPreviewLocale, string[]>;
};

const SEGMENT_KEYWORDS: Record<DashboardPreviewSegment, string[]> = {
  real_estate: [
    "realit",
    "reality",
    "nehnutel",
    "property",
    "byt",
    "dom",
    "makler",
    "makler",
    "listing",
    "obhliad",
  ],
  finance_insurance: [
    "financ",
    "insurance",
    "poist",
    "uver",
    "uvery",
    "uverovy",
    "hypot",
    "refinanc",
    "invest",
    "splat",
  ],
  ecommerce: [
    "e-shop",
    "eshop",
    "shop",
    "store",
    "produkt",
    "product",
    "catalog",
    "katalog",
    "variant",
    "gymbeam",
  ],
  marketplace_services: [
    "marketplace",
    "directory",
    "provider",
    "dodavatel",
    "dodavatelia",
    "sluzb",
    "porovnav",
    "porovn",
    "quote",
  ],
  healthcare_clinic: [
    "clinic",
    "klin",
    "ambul",
    "zdrav",
    "medical",
    "medic",
    "pacient",
    "vysetren",
    "objedn",
    "recep",
    "konzult",
  ],
  dental_clinic: [
    "dent",
    "zub",
    "stomat",
    "implant",
    "hygien",
    "ortodon",
    "preventiv",
    "bolest",
    "kazen",
    "korunka",
  ],
  aesthetic_dermatology_clinic: [
    "dermat",
    "plet",
    "koza",
    "laser",
    "estet",
    "zakrok",
    "pigment",
    "akne",
    "vrask",
  ],
  eye_clinic: [
    "ocn",
    "oko",
    "zrak",
    "dioptri",
    "oftal",
    "laserov",
    "operacia",
    "sietnic",
    "vysetrenie zraku",
  ],
  rental: [
    "rental",
    "rent",
    "prenaj",
    "booking",
    "reservation",
    "rezerv",
    "availability",
    "dostupnost",
  ],
  b2b_industrial: [
    "b2b",
    "industrial",
    "industry",
    "manufactur",
    "factory",
    "vyrob",
    "machine",
    "technology",
    "system",
    "enterprise",
  ],
  generic_business: [],
};

const SEGMENT_TEMPLATES: Record<DashboardPreviewSegment, SegmentTemplate> = {
  real_estate: {
    label: {
      sk: "realitny web",
      cs: "realitni web",
    },
    topTheme: {
      sk: "Kupa bytu",
      cs: "Koupe bytu",
    },
    questions: {
      sk: [
        "Ktora ponuka je pre mna vhodna podla lokality a rozpoctu?",
        "Ako rychlo sa dostanem ku konkretnemu maklerovi alebo obhliadke?",
        "Co potrebujem vediet predtym, nez poslem dopyt na nehnutelnost?",
      ],
      cs: [
        "Ktera nabidka je pro me vhodna podle lokality a rozpoctu?",
        "Jak rychle se dostanu ke konkretnimu makleri nebo prohlidce?",
        "Co potrebuji vedet predtim, nez poslu poptavku na nemovitost?",
      ],
    },
    leads: {
      sk: [
        {
          intent: "Kupa bytu",
          detail: "3-izbovy byt, Bratislava, do 320 000 EUR",
          quality: "high",
          nextStep: "Poslat na maklera / relevantne ponuky",
        },
        {
          intent: "Predaj nehnutelnosti",
          detail: "Chce zistit postup predaja a cenu",
          quality: "high",
          nextStep: "Zavolat / formular pre predaj",
        },
        {
          intent: "Novostavba",
          detail: "Parkovanie, dobra dostupnost, vyssia istota",
          quality: "medium",
          nextStep: "Ukazat vhodne novostavby",
        },
        {
          intent: "Prenajom",
          detail: "2-izbovy byt, konkretna lokalita",
          quality: "medium",
          nextStep: "Poslat relevantne ponuky",
        },
      ],
      cs: [
        {
          intent: "Koupe bytu",
          detail: "3pokojovy byt, Bratislava, do 320 000 EUR",
          quality: "high",
          nextStep: "Poslat makleri / relevantni nabidky",
        },
        {
          intent: "Prodej nemovitosti",
          detail: "Chce zjistit postup prodeje a cenu",
          quality: "high",
          nextStep: "Zavolat / formular pro prodej",
        },
        {
          intent: "Novostavba",
          detail: "Parkovani, dobra dostupnost, vyssi jistota",
          quality: "medium",
          nextStep: "Ukazat vhodne novostavby",
        },
        {
          intent: "Pronajem",
          detail: "2pokojovy byt, konkretni lokalita",
          quality: "medium",
          nextStep: "Poslat relevantni nabidky",
        },
      ],
    },
    reasons: {
      sk: [
        "Nejasna struktura ponuky na homepage",
        "Navstevnik nevie, koho kontaktovat",
        "Chybaju detaily o lokalite alebo cene",
        "Formular je az prilis neskoro",
      ],
      cs: [
        "Nejasna struktura nabidky na homepage",
        "Navstevnik nevi, koho kontaktovat",
        "Chybi detaily o lokalite nebo cene",
        "Formular je az prilis pozde",
      ],
    },
    nextSteps: {
      sk: [
        "Rychlejsie rozdelit kupu / predaj / prenajom",
        "Zvyraznit kontakt na maklera",
        "Pridat vstup pre predavajucich",
        "Zachytit rozpocet a lokalitu pred formularom",
      ],
      cs: [
        "Rychleji rozdelit koupi / prodej / pronajem",
        "Zvyraznit kontakt na maklere",
        "Pridat vstup pro prodavajici",
        "Zachytit rozpocet a lokalitu pred formularem",
      ],
    },
    insights: {
      sk: [
        "Co ludia hladaju pred odoslanim dopytu",
        "Kde sa stracaju medzi ponukami a filtrami",
        "Otazky o lokalite, cene a obhliadke",
      ],
      cs: [
        "Co lide hledaji pred odeslanim poptavky",
        "Kde se ztraceji mezi nabidkami a filtry",
        "Otazky o lokalite, cene a prohlidce",
      ],
    },
  },
  finance_insurance: {
    label: {
      sk: "financny alebo poistny web",
      cs: "financni nebo pojistny web",
    },
    topTheme: {
      sk: "Refinancovanie",
      cs: "Refinancovani",
    },
    questions: {
      sk: [
        "Riesim refinancovanie alebo novy produkt?",
        "Ako sa vyznam v rozdiele medzi hypotekou, poistenim a investovanim?",
        "Akym krokom sa dostanem ku kvalifikovanemu poradcovi?",
      ],
      cs: [
        "Resim refinancovani nebo novy produkt?",
        "Jak se vyznam v rozdilu mezi hypotekou, pojistenim a investovanim?",
        "Jakym krokem se dostanu ke kvalifikovanemu poradci?",
      ],
    },
    leads: {
      sk: [
        {
          intent: "Refinancovanie",
          detail: "Chce znizit splatku hypoteky",
          quality: "high",
          nextStep: "Poslat na hypotekarneho poradcu",
        },
        {
          intent: "Poistenie",
          detail: "Auto + domacnost, chce porovnanie",
          quality: "medium",
          nextStep: "Ukazat porovnanie produktov",
        },
        {
          intent: "Novy uver",
          detail: "Nevie, ci riesi uver alebo hypoteku",
          quality: "high",
          nextStep: "Kvalifikacny formular",
        },
        {
          intent: "Investovanie",
          detail: "Chce zacat s mesacnou sumou",
          quality: "medium",
          nextStep: "Kontakt na poradcu",
        },
      ],
      cs: [
        {
          intent: "Refinancovani",
          detail: "Chce snizit splatku hypoteky",
          quality: "high",
          nextStep: "Poslat na hypotecniho poradce",
        },
        {
          intent: "Pojisteni",
          detail: "Auto + domacnost, chce porovnani",
          quality: "medium",
          nextStep: "Ukazat porovnani produktu",
        },
        {
          intent: "Novy uver",
          detail: "Nevie, jestli resi uver nebo hypoteku",
          quality: "high",
          nextStep: "Kvalifikacni formular",
        },
        {
          intent: "Investovani",
          detail: "Chce zacit s mesicni castkou",
          quality: "medium",
          nextStep: "Kontakt na poradce",
        },
      ],
    },
    reasons: {
      sk: [
        "Nejasny rozdiel medzi produktmi",
        "Dlhy formular pred istotou vyberu",
        "Chyba odporucany dalsi krok",
        "Navstevnik nevie, ci refinancovat",
      ],
      cs: [
        "Nejasny rozdil mezi produkty",
        "Dlouhy formular pred jistotou vyberu",
        "Chybi doporuceny dalsi krok",
        "Navstevnik nevi, zda refinancovat",
      ],
    },
    nextSteps: {
      sk: [
        "Zjednodusit vstup podla zivotnej situacie",
        "Ukazat rozdiel medzi produktmi",
        "Oddelit hypoteku / poistenie / refinancovanie",
        "Skratit cestu ku kvalifikacii",
      ],
      cs: [
        "Zjednodusit vstup podle zivotni situace",
        "Ukazat rozdil mezi produkty",
        "Oddelit hypoteku / pojisteni / refinancovani",
        "Zkratit cestu ke kvalifikaci",
      ],
    },
    insights: {
      sk: [
        "Ktore produkty ludia riesia pred kontaktom",
        "Kde sa stracaju pri nejasnom rozdiele",
        "Otazky pred rozhodnutim o produkte",
      ],
      cs: [
        "Ktere produkty lide resi pred kontaktem",
        "Kde se ztraceji pri nejasnem rozdilu",
        "Otazky pred rozhodnutim o produktu",
      ],
    },
  },
  ecommerce: {
    label: {
      sk: "e-shop alebo produktovy katalog",
      cs: "e-shop nebo produktovy katalog",
    },
    topTheme: {
      sk: "Vyber produktu",
      cs: "Vyber produktu",
    },
    questions: {
      sk: [
        "Ktory produkt je vhodny podla pouzitia a rozpoctu?",
        "V com sa lisia jednotlive modely alebo varianty?",
        "Co mi chyba predtym, nez vlozim produkt do kosika alebo odoslem dopyt?",
      ],
      cs: [
        "Ktery produkt je vhodny podle pouziti a rozpoctu?",
        "V cem se lisi jednotlive modely nebo varianty?",
        "Co mi chybi predtim, nez vlozim produkt do kosiku nebo odeslu poptavku?",
      ],
    },
    leads: {
      sk: [
        {
          intent: "Vyber produktu",
          detail: "Potrebuje produkt podla pouzitia",
          quality: "high",
          nextStep: "Odporucane kategorie",
        },
        {
          intent: "Porovnanie modelov",
          detail: "Nevie rozdiel medzi modelmi",
          quality: "medium",
          nextStep: "Porovnavaci flow",
        },
        {
          intent: "Rozpocet",
          detail: "Riesenie do konkretnej ceny",
          quality: "high",
          nextStep: "Filtrovany vyber",
        },
        {
          intent: "Doplnky",
          detail: "Pyta sa na kompatibilitu a prislusenstvo",
          quality: "medium",
          nextStep: "Cross-sell odporucanie",
        },
      ],
      cs: [
        {
          intent: "Vyber produktu",
          detail: "Potrebuje produkt podle pouziti",
          quality: "high",
          nextStep: "Doporucene kategorie",
        },
        {
          intent: "Porovnani modelu",
          detail: "Nevi rozdil mezi modely",
          quality: "medium",
          nextStep: "Porovnavaci flow",
        },
        {
          intent: "Rozpocet",
          detail: "Reseni do konkretni ceny",
          quality: "high",
          nextStep: "Filtrovany vyber",
        },
        {
          intent: "Doplnky",
          detail: "Pta se na kompatibilitu a prislusenstvi",
          quality: "medium",
          nextStep: "Cross-sell doporuceni",
        },
      ],
    },
    reasons: {
      sk: [
        "Nejasny vyber spravneho produktu",
        "Chyba porovnanie modelov",
        "Navstevnik riesi kompatibilitu",
        "Rozpocet nie je prepojeny s vyberom",
      ],
      cs: [
        "Nejasny vyber spravneho produktu",
        "Chybi porovnani modelu",
        "Navstevnik resi kompatibilitu",
        "Rozpocet neni propojeny s vyberem",
      ],
    },
    nextSteps: {
      sk: [
        "Pridat vyber podla pouzitia",
        "Ukazat porovnanie modelov",
        "Odporucit kompatibilne doplnky",
        "Prepojit rozpocet s vyberom",
      ],
      cs: [
        "Pridat vyber podle pouziti",
        "Ukazat porovnani modelu",
        "Doporucit kompatibilni doplnky",
        "Propojit rozpocet s vyberem",
      ],
    },
    insights: {
      sk: [
        "Ktore produkty treba dovysvetlit pred vyberom",
        "Kde ludia porovnavaju modely a vahaju",
        "Ktore doplnky a kombinacie riesia najcastejsie",
      ],
      cs: [
        "Ktere produkty je potreba dovysvetlit pred vyberem",
        "Kde lide porovnavaji modely a vahaji",
        "Ktere doplnky a kombinace resi nejcasteji",
      ],
    },
  },
  marketplace_services: {
    label: {
      sk: "marketplace alebo service web",
      cs: "marketplace nebo service web",
    },
    topTheme: {
      sk: "Vyber dodavatela",
      cs: "Vyber dodavatele",
    },
    questions: {
      sk: [
        "Ktory poskytovatel je vhodny pre moj pripad?",
        "Ako rychlo porovnam viac moznosti bez zdhaveho hladania?",
        "Komu poslat dopyt, ked mam konkretnu potrebu?",
      ],
      cs: [
        "Ktery poskytovatel je vhodny pro muj pripad?",
        "Jak rychle porovnam vice moznosti bez zdlouhaveho hledani?",
        "Komu poslat poptavku, kdyz mam konkretni potrebu?",
      ],
    },
    leads: {
      sk: [
        {
          intent: "Vyber dodavatela",
          detail: "Hlada spravneho partnera pre konkretnu sluzbu",
          quality: "high",
          nextStep: "Shortlist vhodnych moznosti",
        },
        {
          intent: "Porovnanie ponuk",
          detail: "Potrebuje zjednodusit vyber medzi 2-3 moznostami",
          quality: "medium",
          nextStep: "Porovnavaci flow",
        },
        {
          intent: "Rychly kontakt",
          detail: "Chce cenu alebo rychly follow-up",
          quality: "high",
          nextStep: "Prioritny kontakt",
        },
        {
          intent: "Orientačný dopyt",
          detail: "Este si ujasnuje typ sluzby",
          quality: "low",
          nextStep: "Navigovat podla use-casu",
        },
      ],
      cs: [
        {
          intent: "Vyber dodavatele",
          detail: "Hleda spravneho partnera pro konkretni sluzbu",
          quality: "high",
          nextStep: "Shortlist vhodnych moznosti",
        },
        {
          intent: "Porovnani nabidek",
          detail: "Potrebuje zjednodusit vyber mezi 2-3 moznostmi",
          quality: "medium",
          nextStep: "Porovnavaci flow",
        },
        {
          intent: "Rychly kontakt",
          detail: "Chce cenu nebo rychly follow-up",
          quality: "high",
          nextStep: "Prioritni kontakt",
        },
        {
          intent: "Orientacni poptavka",
          detail: "Jeste si ujasnuje typ sluzby",
          quality: "low",
          nextStep: "Navigovat podle use-casu",
        },
      ],
    },
    reasons: {
      sk: [
        "Nevedel, ktory poskytovatel je vhodny.",
        "Chybalo mu rychle porovnanie moznosti.",
        "Nevedel, komu poslat dopyt.",
        "Stratil sa medzi prilis vela cestami.",
      ],
      cs: [
        "Nevedel, ktery poskytovatel je vhodny.",
        "Chybelo mu rychle porovnani moznosti.",
        "Nevedel, komu poslat poptavku.",
        "Ztratil se mezi prilis mnoha cestami.",
      ],
    },
    nextSteps: {
      sk: [
        "Zrychlit shortlist spravnych moznosti.",
        "Jasnejsie oddelit hlavne typy sluzieb.",
        "Zvyraznit rychly kontakt alebo dopyt.",
        "Doplnit odpovede na porovnavacie otazky.",
      ],
      cs: [
        "Zrychlit shortlist spravnych moznosti.",
        "Jasneji oddelit hlavni typy sluzeb.",
        "Zvyraznit rychly kontakt nebo poptavku.",
        "Doplnit odpovedi na porovnavaci otazky.",
      ],
    },
    insights: {
      sk: [
        "Ktore use-casy vedu ku konkretnemu dodavatelovi.",
        "Kde sa ludia stracaju medzi moznostami.",
        "Ktore porovnavacie otazky sa opakuju najcastejsie.",
      ],
      cs: [
        "Ktere use-casy vedou ke konkretnimu dodavateli.",
        "Kde se lide ztraceji mezi moznostmi.",
        "Ktere porovnavaci otazky se opakuji nejcasteji.",
      ],
    },
  },
  healthcare_clinic: {
    label: {
      sk: "zdravotnicka klinika",
      cs: "zdravotnicka klinika",
    },
    topTheme: {
      sk: "Vyber sluzby",
      cs: "Vyber sluzby",
    },
    questions: {
      sk: [
        "Ktora sluzba alebo vysetrenie je pre moj problem vhodne?",
        "Da sa objednat termin bez dlheho telefonatu?",
        "Co ma recepcia vediet este pred objednanim?",
      ],
      cs: [
        "Ktera sluzba nebo vysetreni je pro muj problem vhodne?",
        "Da se objednat termin bez dlouheho telefonatu?",
        "Co ma recepce vedet jeste pred objednanim?",
      ],
    },
    leads: {
      sk: [
        {
          intent: "Vyber sluzby",
          detail: "Potrebuje rozlisit vhodne vysetrenie, konzultaciu alebo kontrolu",
          quality: "high",
          nextStep: "Odporucit spravnu sluzbu",
        },
        {
          intent: "Objednanie terminu",
          detail: "Pyta sa na termin a dalsi postup",
          quality: "high",
          nextStep: "Navrhnut objednanie",
        },
        {
          intent: "Konzultacia",
          detail: "Chce vediet, co je vhodne pred zakrokom alebo kontrolou",
          quality: "medium",
          nextStep: "Pripravit konzultaciu",
        },
        {
          intent: "Otazka pre recepciu",
          detail: "Este si overuje, ake udaje treba doplnit",
          quality: "medium",
          nextStep: "Predtriedit dopyt",
        },
      ],
      cs: [
        {
          intent: "Vyber sluzby",
          detail: "Potrebuje rozlisit vhodne vysetreni, konzultaci nebo kontrolu",
          quality: "high",
          nextStep: "Doporucit spravnou sluzbu",
        },
        {
          intent: "Objednani terminu",
          detail: "Pta se na termin a dalsi postup",
          quality: "high",
          nextStep: "Navrhnout objednani",
        },
        {
          intent: "Konzultace",
          detail: "Chce vedet, co je vhodne pred zakrokem nebo kontrolou",
          quality: "medium",
          nextStep: "Pripravit konzultaci",
        },
        {
          intent: "Otazka pro recepci",
          detail: "Jeste si overuje, jake udaje je treba doplnit",
          quality: "medium",
          nextStep: "Predtridit poptavku",
        },
      ],
    },
    reasons: {
      sk: [
        "Nevedeli, aku sluzbu maju zvolit pred objednanim.",
        "Chybal im jasny dalsi krok k terminu.",
        "Najprv si chceli overit vhodne vysetrenie alebo konzultaciu.",
        "Recepcia by bez doplnenia dostala neuplny dopyt.",
      ],
      cs: [
        "Nevedeli, jakou sluzbu maji zvolit pred objednanim.",
        "Chybel jim jasny dalsi krok k terminu.",
        "Nejdriv si chteli overit vhodne vysetreni nebo konzultaci.",
        "Recepce by bez doplneni dostala neuplnou poptavku.",
      ],
    },
    nextSteps: {
      sk: [
        "Pridat AI vyber sluzby pred formular.",
        "Zbierat preferovany termin a typ problemu.",
        "Rozlisit urgentne a neurgentne pripady.",
        "Pripravit recepcii lepsie predtriedeny dopyt.",
      ],
      cs: [
        "Pridat AI vyber sluzby pred formular.",
        "Sbírat preferovany termin a typ problemu.",
        "Rozlisit urgentni a neurgentni pripady.",
        "Pripravit recepci lepe predtridenou poptavku.",
      ],
    },
    insights: {
      sk: [
        "S akymi problemami pacienti prichadzaju este pred telefonatom.",
        "Ktore sluzby si pacienti najcastejsie mylia alebo spajaju.",
        "Kedy pacient potrebuje rychly termin a kedy staci konzultacia.",
        "Ake otazky sa opakuju pred objednanim.",
      ],
      cs: [
        "S jakymi problemy pacienti prichazeji jeste pred telefonatem.",
        "Ktere sluzby si pacienti nejcasteji pletou nebo spojuji.",
        "Kdy pacient potrebuje rychly termin a kdy staci konzultace.",
        "Jake otazky se opakuji pred objednanim.",
      ],
    },
  },
  dental_clinic: {
    label: {
      sk: "zubna klinika",
      cs: "zubni klinika",
    },
    topTheme: {
      sk: "Vyber sluzby",
      cs: "Vyber sluzby",
    },
    questions: {
      sk: [
        "Je vhodnejsia preventivka, hygiena alebo vysetrenie?",
        "Da sa objednat co najskor pri bolesti?",
        "Kedy ma zmysel konzultacia k implantatu alebo strojceku?",
      ],
      cs: [
        "Je vhodnejsi preventivni zakrok, hygiena nebo vysetreni?",
        "Da se objednat co nejdrive pri bolesti?",
        "Kdy dava smysl konzultace k implantatu nebo rovnatkum?",
      ],
    },
    leads: {
      sk: [
        {
          intent: "Bolest zuba",
          detail: "Potrebuje rychly termin alebo odporucanie sluzby",
          quality: "high",
          nextStep: "Prioritny kontakt recepcie",
        },
        {
          intent: "Dentalna hygiena",
          detail: "Chce vediet termin, cenu alebo vhodnost",
          quality: "medium",
          nextStep: "Navrhnut objednanie",
        },
        {
          intent: "Implantat / konzultacia",
          detail: "Riesi moznosti a dalsi postup",
          quality: "high",
          nextStep: "Konzultacia",
        },
        {
          intent: "Ortodoncia",
          detail: "Pyta sa na strojcek alebo vysetrenie",
          quality: "medium",
          nextStep: "Vstupne vysetrenie",
        },
      ],
      cs: [
        {
          intent: "Bolest zubu",
          detail: "Potrebuje rychly termin nebo doporuceni sluzby",
          quality: "high",
          nextStep: "Prioritni kontakt recepce",
        },
        {
          intent: "Dentalni hygiena",
          detail: "Chce vedet termin, cenu nebo vhodnost",
          quality: "medium",
          nextStep: "Navrhnout objednani",
        },
        {
          intent: "Implantat / konzultace",
          detail: "Resi moznosti a dalsi postup",
          quality: "high",
          nextStep: "Konzultace",
        },
        {
          intent: "Ortodoncie",
          detail: "Pta se na rovnatka nebo vysetreni",
          quality: "medium",
          nextStep: "Vstupni vysetreni",
        },
      ],
    },
    reasons: {
      sk: [
        "Nevedeli, ci potrebuju vysetrenie, hygienu alebo konzultaciu.",
        "Chybal im jasny dalsi krok pred objednanim.",
        "Chceli si najprv overit vhodnu sluzbu.",
        "Nevedeli, ake udaje ma recepcia dostat.",
      ],
      cs: [
        "Nevedeli, zda potrebuji vysetreni, hygienu nebo konzultaci.",
        "Chybel jim jasny dalsi krok pred objednanim.",
        "Chteli si nejdriv overit vhodnou sluzbu.",
        "Nevedeli, jake udaje ma recepce dostat.",
      ],
    },
    nextSteps: {
      sk: [
        "Pridat AI vyber sluzby pred formular.",
        "Zbierat preferovany termin a typ problemu.",
        "Rozlisit urgentne a neurgentne pripady.",
        "Pripravit recepcii lepsie predtriedeny dopyt.",
      ],
      cs: [
        "Pridat AI vyber sluzby pred formular.",
        "Sbírat preferovany termin a typ problemu.",
        "Rozlisit urgentni a neurgentni pripady.",
        "Pripravit recepci lepe predtridenou poptavku.",
      ],
    },
    insights: {
      sk: [
        "S ktorymi problemami pacienti prichadzaju este pred telefonatom.",
        "Ktore sluzby si pacienti najcastejsie mylia alebo spajaju.",
        "Kedy pacient potrebuje rychly termin a kedy staci konzultacia.",
        "Ake otazky sa opakuju pred objednanim.",
      ],
      cs: [
        "S jakymi problemy pacienti prichazeji jeste pred telefonatem.",
        "Ktere sluzby si pacienti nejcasteji pletou nebo spojuji.",
        "Kdy pacient potrebuje rychly termin a kdy staci konzultace.",
        "Jake otazky se opakuji pred objednanim.",
      ],
    },
  },
  aesthetic_dermatology_clinic: {
    label: {
      sk: "klinika estetickej dermatologie",
      cs: "klinika esteticke dermatologie",
    },
    topTheme: {
      sk: "Vhodna sluzba",
      cs: "Vhodna sluzba",
    },
    questions: {
      sk: [
        "Je pre moj problem alebo ciel vhodnejsia konzultacia, pletove osetrenie alebo laser?",
        "Da sa objednat termin na esteticku dermatologiu bez dlhej komunikacie?",
        "Kedy ma zmysel ist rovno na zakrok a kedy najprv na konzultaciu?",
      ],
      cs: [
        "Je pro muj problem nebo cil vhodnejsi konzultace, pletove osetreni nebo laser?",
        "Da se objednat termin na estetickou dermatologii bez dlouhe komunikace?",
        "Kdy dava smysl jit rovnou na zakrok a kdy nejdriv na konzultaci?",
      ],
    },
    leads: {
      sk: [
        {
          intent: "Problem / ciel",
          detail: "Popisuje problem pleti alebo esteticky ciel",
          quality: "high",
          nextStep: "Odporucit vhodnu sluzbu",
        },
        {
          intent: "Laser",
          detail: "Pyta sa na vhodnost laseroveho zakroku",
          quality: "medium",
          nextStep: "Konzultacia",
        },
        {
          intent: "Esteticka dermatologia",
          detail: "Chce vediet rozdiel medzi osetreniami",
          quality: "high",
          nextStep: "Vyber sluzby",
        },
        {
          intent: "Objednanie",
          detail: "Chce termin a vie, co priblizne riesi",
          quality: "medium",
          nextStep: "Navrhnut objednanie",
        },
      ],
      cs: [
        {
          intent: "Problem / cil",
          detail: "Popisuje problem pleti nebo esteticky cil",
          quality: "high",
          nextStep: "Doporucit vhodnou sluzbu",
        },
        {
          intent: "Laser",
          detail: "Pta se na vhodnost laseroveho zakroku",
          quality: "medium",
          nextStep: "Konzultace",
        },
        {
          intent: "Esteticka dermatologie",
          detail: "Chce vedet rozdil mezi osetrenimi",
          quality: "high",
          nextStep: "Vyber sluzby",
        },
        {
          intent: "Objednani",
          detail: "Chce termin a vi, co priblizne resi",
          quality: "medium",
          nextStep: "Navrhnout objednani",
        },
      ],
    },
    reasons: {
      sk: [
        "Nevedeli, ktora sluzba je vhodna pre ich problem alebo ciel.",
        "Chybal im jasny dalsi krok medzi konzultaciou a zakrokom.",
        "Najprv si chceli overit vhodnost laseru alebo osetrenia.",
        "Pred objednanim si potrebovali ujasnit ocakavany vysledok.",
      ],
      cs: [
        "Nevedeli, ktera sluzba je vhodna pro jejich problem nebo cil.",
        "Chybel jim jasny dalsi krok mezi konzultaci a zakrokem.",
        "Nejdriv si chteli overit vhodnost laseru nebo osetreni.",
        "Pred objednanim si potrebovali ujasnit ocekavany vysledek.",
      ],
    },
    nextSteps: {
      sk: [
        "Pridat AI vyber vhodnej sluzby podla problemu alebo ciela.",
        "Zbierat preferovany termin a typ osetrenia.",
        "Oddelit konzultaciu od priameho objednania zakroku.",
        "Pripravit timu jasnejsie predtriedeny dopyt.",
      ],
      cs: [
        "Pridat AI vyber vhodne sluzby podle problemu nebo cile.",
        "Sbírat preferovany termin a typ osetreni.",
        "Oddelit konzultaci od primeho objednani zakroku.",
        "Pripravit tymu jasneji predtridenou poptavku.",
      ],
    },
    insights: {
      sk: [
        "Ktore problemy pleti sa opakuju este pred objednanim.",
        "Kedy ludia riesia laser, konzultaciu alebo konkretny zakrok.",
        "Ktore sluzby si klienti najcastejsie mylia.",
        "Ake otazky sa vracaju pred potvrdenim terminu.",
      ],
      cs: [
        "Ktere problemy pleti se opakuji jeste pred objednanim.",
        "Kdy lide resi laser, konzultaci nebo konkretni zakrok.",
        "Ktere sluzby si klienti nejcasteji pletou.",
        "Jake otazky se vraceji pred potvrzenim terminu.",
      ],
    },
  },
  eye_clinic: {
    label: {
      sk: "ocna klinika",
      cs: "ocni klinika",
    },
    topTheme: {
      sk: "Vysetrenie alebo konzultacia",
      cs: "Vysetreni nebo konzultace",
    },
    questions: {
      sk: [
        "Potrebujem vysetrenie, konzultaciu alebo termin k ocnemu problemu?",
        "Riesim dioptrie, kontrolu alebo laserovu operaciu?",
        "Da sa objednat termin bez zbytocneho telefonatu?",
      ],
      cs: [
        "Potrebuji vysetreni, konzultaci nebo termin k ocnimu problemu?",
        "Resim dioptrie, kontrolu nebo laserovou operaci?",
        "Da se objednat termin bez zbytecneho telefonatu?",
      ],
    },
    leads: {
      sk: [
        {
          intent: "Vysetrenie",
          detail: "Potrebuje posudit ocny problem alebo kontrolu",
          quality: "high",
          nextStep: "Navrhnut termin",
        },
        {
          intent: "Dioptrie",
          detail: "Pyta sa na meranie, okuliare alebo dalsi postup",
          quality: "medium",
          nextStep: "Vstupne vysetrenie",
        },
        {
          intent: "Laserova operacia",
          detail: "Zistuje vhodnost zakroku a konzultacie",
          quality: "high",
          nextStep: "Konzultacia",
        },
        {
          intent: "Ocny problem",
          detail: "Chce vediet, ci potrebuje rychly termin",
          quality: "medium",
          nextStep: "Priorita recepcie",
        },
      ],
      cs: [
        {
          intent: "Vysetreni",
          detail: "Potrebuje posoudit ocni problem nebo kontrolu",
          quality: "high",
          nextStep: "Navrhnout termin",
        },
        {
          intent: "Dioptrie",
          detail: "Pta se na mereni, bryle nebo dalsi postup",
          quality: "medium",
          nextStep: "Vstupni vysetreni",
        },
        {
          intent: "Laserova operace",
          detail: "Zjistuje vhodnost zakroku a konzultace",
          quality: "high",
          nextStep: "Konzultace",
        },
        {
          intent: "Ocni problem",
          detail: "Chce vedet, zda potrebuje rychly termin",
          quality: "medium",
          nextStep: "Priorita recepce",
        },
      ],
    },
    reasons: {
      sk: [
        "Nevedeli, ci maju ist na vysetrenie, kontrolu alebo konzultaciu.",
        "Chybal im jasny dalsi krok k terminu.",
        "Najprv si chceli overit dioptrie alebo vhodnost zakroku.",
        "Pred objednanim si potrebovali ujasnit ocny problem.",
      ],
      cs: [
        "Nevedeli, zda maji jit na vysetreni, kontrolu nebo konzultaci.",
        "Chybel jim jasny dalsi krok k terminu.",
        "Nejdriv si chteli overit dioptrie nebo vhodnost zakroku.",
        "Pred objednanim si potrebovali ujasnit ocni problem.",
      ],
    },
    nextSteps: {
      sk: [
        "Pridat AI vyber medzi vysetrenim, konzultaciou a zakrokom.",
        "Zbierat ocny problem a preferovany termin.",
        "Oddelit bezne vysetrenie od laserovej operacie.",
        "Pripravit recepcii presnejsie predtriedeny dopyt.",
      ],
      cs: [
        "Pridat AI vyber mezi vysetrenim, konzultaci a zakrokem.",
        "Sbírat ocni problem a preferovany termin.",
        "Oddelit bezne vysetreni od laserove operace.",
        "Pripravit recepci presneji predtridenou poptavku.",
      ],
    },
    insights: {
      sk: [
        "Ktore ocne problemy sa opakuju este pred kontaktom.",
        "Kedy ludia riesia dioptrie, termin alebo laserovu operaciu.",
        "Ktore otazky sa vracaju pred vysetrenim.",
        "Ako casto treba doplnat kontext pred objednanim.",
      ],
      cs: [
        "Ktere ocni problemy se opakuji jeste pred kontaktem.",
        "Kdy lide resi dioptrie, termin nebo laserovou operaci.",
        "Ktere otazky se vraceji pred vysetrenim.",
        "Jak casto je treba doplnovat kontext pred objednanim.",
      ],
    },
  },
  rental: {
    label: {
      sk: "rental alebo rezervacny web",
      cs: "rental nebo rezervacni web",
    },
    topTheme: {
      sk: "Dostupnost terminu",
      cs: "Dostupnost terminu",
    },
    questions: {
      sk: [
        "Je dostupny termin alebo vhodny variant rezervacie?",
        "Kolko to stoji a ake su podmienky bez telefonovania?",
        "Ako rychlo dokoncim rezervaciu bez dalsieho hladania?",
      ],
      cs: [
        "Je dostupny termin nebo vhodna varianta rezervace?",
        "Kolik to stoji a jake jsou podminky bez telefonovani?",
        "Jak rychle dokoncim rezervaci bez dalsiho hledani?",
      ],
    },
    leads: {
      sk: [
        {
          intent: "Overenie terminu",
          detail: "Hlada konkretne datum a dostupnost",
          quality: "high",
          nextStep: "Poslat dostupne terminy",
        },
        {
          intent: "Porovnanie variantov",
          detail: "Nevie, ktory typ rezervacie je vhodny",
          quality: "medium",
          nextStep: "Ukazat odporucany variant",
        },
        {
          intent: "Cena a podmienky",
          detail: "Pyta sa na finalnu cenu a pravidla",
          quality: "high",
          nextStep: "Zobrazit rychly sumar",
        },
        {
          intent: "Kontakt pred bookingom",
          detail: "Este si potrebuje potvrdit detail",
          quality: "medium",
          nextStep: "Call-back alebo chat follow-up",
        },
      ],
      cs: [
        {
          intent: "Overeni terminu",
          detail: "Hleda konkretni datum a dostupnost",
          quality: "high",
          nextStep: "Poslat dostupne terminy",
        },
        {
          intent: "Porovnani variant",
          detail: "Nevi, ktery typ rezervace je vhodny",
          quality: "medium",
          nextStep: "Ukazat doporucenou variantu",
        },
        {
          intent: "Cena a podminky",
          detail: "Pta se na finalni cenu a pravidla",
          quality: "high",
          nextStep: "Zobrazit rychly souhrn",
        },
        {
          intent: "Kontakt pred bookingem",
          detail: "Jeste si potrebuje potvrdit detail",
          quality: "medium",
          nextStep: "Call-back nebo chat follow-up",
        },
      ],
    },
    reasons: {
      sk: [
        "Nenasiel volny termin alebo dostupnost.",
        "Nevidel jasnu cenu alebo podmienky.",
        "Nevedel, ktory typ rezervacie zvolit.",
        "Odisiel tesne pred dokoncenim rezervacie.",
      ],
      cs: [
        "Nenasel volny termin nebo dostupnost.",
        "Nevidel jasnou cenu nebo podminky.",
        "Nevedel, ktery typ rezervace zvolit.",
        "Odesel tesne pred dokoncenim rezervace.",
      ],
    },
    nextSteps: {
      sk: [
        "Zrychlit cestu k dostupnemu terminu.",
        "Zvyraznit cenu a podmienky rezervacie.",
        "Oddelit typy prenajmu alebo rezervacie.",
        "Zachytit vahanie tesne pred dokoncenim.",
      ],
      cs: [
        "Zrychlit cestu k dostupnemu terminu.",
        "Zvyraznit cenu a podminky rezervace.",
        "Oddelit typy pronajmu nebo rezervace.",
        "Zachytit vahani tesne pred dokoncenim.",
      ],
    },
    insights: {
      sk: [
        "Ktore terminy alebo kombinacie sa pytaju najcastejsie.",
        "Kde sa ludi zastavuju pri dostupnosti alebo cene.",
        "Ktore rezervacne detaily si ziadaju dovysvetlenie.",
      ],
      cs: [
        "Ktere terminy nebo kombinace se ptaji nejcasteji.",
        "Kde se lide zastavuji pri dostupnosti nebo cene.",
        "Ktere rezervacni detaily si zadaji dovysvetleni.",
      ],
    },
  },
  b2b_industrial: {
    label: {
      sk: "B2B alebo industrialny web",
      cs: "B2B nebo industrialni web",
    },
    topTheme: {
      sk: "Technicke riesenie",
      cs: "Technicke reseni",
    },
    questions: {
      sk: [
        "Je toto riesenie vhodne pre moju prevadzku?",
        "Ako porovnat varianty podla vykonu a nasadenia?",
        "Na koho sa obratit s technickym dopytom?",
      ],
      cs: [
        "Je toto reseni vhodne pro muj provoz?",
        "Jak porovnat varianty podle vykonu a nasazeni?",
        "Na koho se obratit s technickou poptavkou?",
      ],
    },
    leads: {
      sk: [
        {
          intent: "Technicke overenie",
          detail: "Riesi vhodnost pre konkretnu prevadzku",
          quality: "high",
          nextStep: "Poslat technicky kontakt",
        },
        {
          intent: "Porovnanie variantov",
          detail: "Zaujimaju ho parametre a vykon",
          quality: "medium",
          nextStep: "Dodat porovnanie rieseni",
        },
        {
          intent: "Projektovy dopyt",
          detail: "Ma konkretny projekt a termin rozhodnutia",
          quality: "high",
          nextStep: "Obchodny follow-up",
        },
        {
          intent: "Prvotna orientacia",
          detail: "Este si ujasnuje vhodny typ technologie",
          quality: "low",
          nextStep: "Navigovat podla pouzitia",
        },
      ],
      cs: [
        {
          intent: "Technicke overeni",
          detail: "Resi vhodnost pro konkretni provoz",
          quality: "high",
          nextStep: "Poslat technicky kontakt",
        },
        {
          intent: "Porovnani variant",
          detail: "Zajimaji ho parametry a vykon",
          quality: "medium",
          nextStep: "Dodat porovnani reseni",
        },
        {
          intent: "Projektova poptavka",
          detail: "Ma konkretni projekt a termin rozhodnuti",
          quality: "high",
          nextStep: "Obchodni follow-up",
        },
        {
          intent: "Prvotni orientace",
          detail: "Jeste si ujasnuje vhodny typ technologie",
          quality: "low",
          nextStep: "Navigovat podle pouziti",
        },
      ],
    },
    reasons: {
      sk: [
        "Nevedel, ci je riesenie vhodne pre jeho prevadzku.",
        "Chybali technicke parametre alebo porovnanie.",
        "Nevedel, komu smerovat technicky dopyt.",
        "Odisiel bez jasneho dalsieho kroku.",
      ],
      cs: [
        "Nevedel, jestli je reseni vhodne pro jeho provoz.",
        "Chybely technicke parametry nebo porovnani.",
        "Nevedel, komu smerovat technickou poptavku.",
        "Odesel bez jasneho dalsiho kroku.",
      ],
    },
    nextSteps: {
      sk: [
        "Jasnejsie oddelit riesenia podla pouzitia.",
        "Doplnit technicke odpovede pred dopytom.",
        "Zrychlit cestu ku technickemu kontaktu.",
        "Zvyraznit formular pre konkretny projekt.",
      ],
      cs: [
        "Jasneji oddelit reseni podle pouziti.",
        "Doplnit technicke odpovedi pred poptavkou.",
        "Zrychlit cestu k technickemu kontaktu.",
        "Zvyraznit formular pro konkretni projekt.",
      ],
    },
    insights: {
      sk: [
        "Ktore technicke temy sa opakuju pred dopytom.",
        "Kde chyba porovnanie parametrov alebo nasadenia.",
        "Ktore dopyty uz maju vyssi obchodny potencial.",
      ],
      cs: [
        "Ktera technicka temata se opakuji pred poptavkou.",
        "Kde chybi porovnani parametru nebo nasazeni.",
        "Ktere poptavky uz maji vyssi obchodni potencial.",
      ],
    },
  },
  generic_business: {
    label: {
      sk: "firemny web",
      cs: "firemni web",
    },
    topTheme: {
      sk: "Prvy dalsi krok",
      cs: "Prvni dalsi krok",
    },
    questions: {
      sk: [
        "Ktora sluzba alebo ponuka je pre mna vhodna?",
        "Ako sa co najrychlejsie dostanem ku spravnemu cloveku?",
        "Co potrebujem vediet pred odoslanim dopytu?",
      ],
      cs: [
        "Ktera sluzba nebo nabidka je pro me vhodna?",
        "Jak se co nejrychleji dostanu ke spravne osobe?",
        "Co potrebuji vedet pred odeslanim poptavky?",
      ],
    },
    leads: {
      sk: [
        {
          intent: "Vyber sluzby",
          detail: "Hlada riesenie pre konkretny pripad",
          quality: "high",
          nextStep: "Odporucit spravnu ponuku",
        },
        {
          intent: "Cena alebo rozpocet",
          detail: "Potrebuje rychly odhad alebo rozsah",
          quality: "medium",
          nextStep: "Ukazat dalsi krok",
        },
        {
          intent: "Kontakt na specialistu",
          detail: "Chce hovorit so spravnou osobou",
          quality: "high",
          nextStep: "Poslat priamy kontakt",
        },
        {
          intent: "Orientacna otazka",
          detail: "Este si ujasnuje smer a potrebu",
          quality: "low",
          nextStep: "Navigovat podla kontextu",
        },
      ],
      cs: [
        {
          intent: "Vyber sluzby",
          detail: "Hleda reseni pro konkretni pripad",
          quality: "high",
          nextStep: "Doporucit spravnou nabidku",
        },
        {
          intent: "Cena nebo rozpocet",
          detail: "Potrebuje rychly odhad nebo rozsah",
          quality: "medium",
          nextStep: "Ukazat dalsi krok",
        },
        {
          intent: "Kontakt na specialistu",
          detail: "Chce mluvit se spravnou osobou",
          quality: "high",
          nextStep: "Poslat primy kontakt",
        },
        {
          intent: "Orientacni dotaz",
          detail: "Jeste si ujasnuje smer a potrebu",
          quality: "low",
          nextStep: "Navigovat podle kontextu",
        },
      ],
    },
    reasons: {
      sk: [
        "Nevedel, ktora sluzba je pre neho vhodna.",
        "Chybalo rychle vysvetlenie postupu alebo ceny.",
        "Nevedel, komu napisat.",
        "Odisiel pred formularom.",
      ],
      cs: [
        "Nevedel, ktera sluzba je pro nej vhodna.",
        "Chybelo rychle vysvetleni postupu nebo ceny.",
        "Nevedel, komu napsat.",
        "Odesel pred formularem.",
      ],
    },
    nextSteps: {
      sk: [
        "Zvyraznit hlavne typy sluzieb.",
        "Spresnit dalsi krok pri dopyte.",
        "Doplnit odpovede na opakovane otazky.",
        "Zrychlit cestu ku kontaktu.",
      ],
      cs: [
        "Zvyraznit hlavni typy sluzeb.",
        "Zpresnit dalsi krok u poptavky.",
        "Doplnit odpovedi na opakovane otazky.",
        "Zrychlit cestu ke kontaktu.",
      ],
    },
    insights: {
      sk: [
        "Co ludia na webe realne riesia pred dopytom.",
        "Kde vahaju a odkial odchadzaju bez kontaktu.",
        "Ktore otazky sa opakuju pred rozhodnutim.",
      ],
      cs: [
        "Co lide na webu realne resi pred poptavkou.",
        "Kde vahaji a odkud odchazeji bez kontaktu.",
        "Ktere otazky se opakuji pred rozhodnutim.",
      ],
    },
  },
};

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function cleanText(value: string) {
  return value.trim().replace(/^["'“”„]+|["'“”„]+$/g, "").replace(/\s+/g, " ").replace(/[.!?]+$/, "");
}

function lowerFirst(value: string) {
  const trimmed = cleanText(value);
  return trimmed ? trimmed.charAt(0).toLowerCase() + trimmed.slice(1) : trimmed;
}

function shortText(value: string, maxLength = 88) {
  const cleaned = cleanText(value);

  if (cleaned.length <= maxLength) {
    return cleaned;
  }

  return `${cleaned.slice(0, maxLength - 1).trimEnd()}…`;
}

function shortenPreviewText(value: string, maxLength = 72) {
  const cleaned = cleanText(value).replace(/[.…]+$/g, "");

  if (cleaned.length <= maxLength) {
    return cleaned;
  }

  const candidates = dedupeItems([
    cleaned.split(/,\s+/)[0] ?? "",
    cleaned.split(/;\s+/)[0] ?? "",
    cleaned.split(/\s[-–]\s/)[0] ?? "",
    cleaned.split(/\s+(?:takze|takže|pretoze|pretože|protoze|protože|lebo|aby|ked|keď)\b/i)[0] ?? "",
  ]).filter((item) => item.length <= maxLength);

  return candidates[0] ?? null;
}

function dedupeItems(items: ReadonlyArray<string>) {
  return Array.from(new Set(items.map(cleanText).filter(Boolean)));
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function getDomainLabel(auditedUrl: string, audit: DashboardPreviewAuditSource) {
  if (audit.domain?.trim()) {
    return audit.domain.trim();
  }

  try {
    return new URL(auditedUrl).hostname.replace(/^www\./, "");
  } catch {
    return auditedUrl.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0] || auditedUrl;
  }
}

function getAuditTextPool(audit: DashboardPreviewAuditSource, auditedUrl: string) {
  return dedupeItems([
    auditedUrl,
    getDomainLabel(auditedUrl, audit),
    audit.fit_type ?? "",
    audit.category ?? "",
    audit.detected_website_type ?? "",
    audit.site_type,
    audit.summary,
    audit.recommendation_text ?? "",
    ...audit.recommended_ai_type,
    ...audit.why_fit,
    ...audit.friction_points,
    ...(audit.weak_spots ?? []),
    ...audit.upsell_opportunities,
    ...audit.phase_one_plan,
    ...(audit.capabilities ?? []),
    ...(audit.inspected_pages ?? []),
    ...(audit.service_hints ?? []),
    ...(audit.product_hints ?? []),
    ...(audit.category_hints ?? []),
    ...(audit.use_case_examples ?? []),
    ...audit.example_user_flows.flatMap((flow) => [flow.user_intent, flow.ai_action, flow.business_value]),
  ]);
}

function scoreSegment(haystack: string, keywords: string[]) {
  return keywords.reduce((score, keyword) => score + (haystack.includes(keyword) ? 1 : 0), 0);
}

function takeMerged(primary: string[], fallback: string[], limit: number) {
  return dedupeItems([...primary, ...fallback]).slice(0, limit);
}

function getQualityLabel(locale: DashboardPreviewLocale, quality: DashboardPreviewQuality) {
  if (quality === "high") {
    return locale === "cs" ? "Vysoky zajem" : "Vysoky zaujem";
  }

  if (quality === "medium") {
    return "Stredny";
  }

  return locale === "cs" ? "Nizky" : "Nizky";
}

function buildDerivedQuestions(audit: DashboardPreviewAuditSource) {
  return dedupeItems(
    [
      ...audit.example_user_flows.map((flow) => shortenPreviewText(flow.user_intent)),
      ...audit.upsell_opportunities.map((item) => shortenPreviewText(item)),
      ...audit.phase_one_plan.map((item) => shortenPreviewText(item)),
    ].filter((item): item is string => Boolean(item)),
  );
}

function buildDerivedInsights(audit: DashboardPreviewAuditSource) {
  return dedupeItems(
    [
      shortenPreviewText(audit.why_fit[0] ?? ""),
      shortenPreviewText(audit.friction_points[0] ?? ""),
      shortenPreviewText(audit.upsell_opportunities[0] ?? ""),
      shortenPreviewText(audit.phase_one_plan[0] ?? ""),
    ].filter((item): item is string => Boolean(item)),
  );
}

export function isHealthcareDashboardPreviewSegment(segment: DashboardPreviewSegment) {
  return (
    segment === "healthcare_clinic" ||
    segment === "dental_clinic" ||
    segment === "aesthetic_dermatology_clinic" ||
    segment === "eye_clinic"
  );
}

function buildLeadRows(
  audit: DashboardPreviewAuditSource,
  locale: DashboardPreviewLocale,
  segment: DashboardPreviewSegment,
  template: SegmentTemplate,
) {
  const rows = template.leads[locale].map((row) => ({
    ...row,
    qualityLabel: getQualityLabel(locale, row.quality),
  }));

  if (segment === "generic_business" && audit.example_user_flows[0]) {
    rows[0] = {
      intent: shortenPreviewText(audit.example_user_flows[0].user_intent, 38) ?? rows[0].intent,
      detail: shortenPreviewText(audit.example_user_flows[0].business_value, 64) ?? rows[0].detail,
      quality: "high",
      qualityLabel: getQualityLabel(locale, "high"),
      nextStep: locale === "cs" ? "Navazat obchodnim follow-upem" : "Nadviazat obchodnym follow-upom",
    };
  }

  return rows;
}

function buildReasons(
  audit: DashboardPreviewAuditSource,
  locale: DashboardPreviewLocale,
  segment: DashboardPreviewSegment,
  template: SegmentTemplate,
) {
  if (isHealthcareDashboardPreviewSegment(segment)) {
    return template.reasons[locale].slice(0, 4);
  }

  const derived = audit.friction_points
    .slice(0, 2)
    .map((item) => shortenPreviewText(item, 72))
    .filter((item): item is string => Boolean(item));

  return takeMerged(template.reasons[locale], derived, 4);
}

function buildNextSteps(
  audit: DashboardPreviewAuditSource,
  locale: DashboardPreviewLocale,
  segment: DashboardPreviewSegment,
  template: SegmentTemplate,
) {
  if (isHealthcareDashboardPreviewSegment(segment)) {
    return template.nextSteps[locale].slice(0, 4);
  }

  const derived = audit.phase_one_plan
    .slice(0, 2)
    .map((item) => shortenPreviewText(item, 72))
    .filter((item): item is string => Boolean(item));

  return takeMerged(template.nextSteps[locale], derived, 4);
}

function buildTopTheme(
  segment: DashboardPreviewSegment,
  locale: DashboardPreviewLocale,
  template: SegmentTemplate,
  questions: string[],
) {
  if (isHealthcareDashboardPreviewSegment(segment)) {
    return template.topTheme[locale];
  }

  if (!questions[0]) {
    return template.topTheme[locale];
  }

  return shortenPreviewText(questions[0], 28) ?? template.topTheme[locale];
}

export function resolveDashboardPreviewSegment(
  audit: DashboardPreviewAuditSource,
  auditedUrl: string,
): DashboardPreviewSegment {
  const haystack = normalizeText(getAuditTextPool(audit, auditedUrl).join(" "));
  const domain = normalizeText(getDomainLabel(auditedUrl, audit));
  const scores = {
    real_estate: scoreSegment(haystack, SEGMENT_KEYWORDS.real_estate),
    finance_insurance: scoreSegment(haystack, SEGMENT_KEYWORDS.finance_insurance),
    ecommerce: scoreSegment(haystack, SEGMENT_KEYWORDS.ecommerce),
    marketplace_services: scoreSegment(haystack, SEGMENT_KEYWORDS.marketplace_services),
    healthcare_clinic: scoreSegment(haystack, SEGMENT_KEYWORDS.healthcare_clinic),
    dental_clinic: scoreSegment(haystack, SEGMENT_KEYWORDS.dental_clinic),
    aesthetic_dermatology_clinic: scoreSegment(haystack, SEGMENT_KEYWORDS.aesthetic_dermatology_clinic),
    eye_clinic: scoreSegment(haystack, SEGMENT_KEYWORDS.eye_clinic),
    rental: scoreSegment(haystack, SEGMENT_KEYWORDS.rental),
    b2b_industrial: scoreSegment(haystack, SEGMENT_KEYWORDS.b2b_industrial),
    generic_business: 0,
  } satisfies Record<DashboardPreviewSegment, number>;

  if (domain.includes("vitadent")) {
    return "dental_clinic";
  }

  if (/(dent|zub|stom)/.test(domain)) {
    scores.dental_clinic += 3;
  }

  if (/(clinic|klinika|medical|medic|health|zdrav)/.test(domain)) {
    scores.healthcare_clinic += 2;
  }

  if (/(derma|skin|laser|aesthetic|estet)/.test(domain)) {
    scores.aesthetic_dermatology_clinic += 3;
  }

  if (/(eye|ocn|optic|oftal|zrak)/.test(domain)) {
    scores.eye_clinic += 3;
  }

  if (scores.real_estate > 0) {
    scores.rental = Math.max(0, scores.rental - 1);
  }

  if (scores.marketplace_services > 0 && scores.ecommerce > 0) {
    scores.marketplace_services += 1;
  }

  if (scores.dental_clinic > 0) {
    scores.dental_clinic += 3;
    scores.marketplace_services = Math.max(0, scores.marketplace_services - 3);
  }

  if (scores.aesthetic_dermatology_clinic > 0) {
    scores.aesthetic_dermatology_clinic += 2;
    scores.marketplace_services = Math.max(0, scores.marketplace_services - 2);
  }

  if (scores.eye_clinic > 0) {
    scores.eye_clinic += 2;
    scores.marketplace_services = Math.max(0, scores.marketplace_services - 2);
  }

  if (scores.healthcare_clinic > 0) {
    scores.marketplace_services = Math.max(0, scores.marketplace_services - 2);
  }

  const winner = Object.entries(scores)
    .sort((left, right) => right[1] - left[1])
    .find((entry) => entry[1] > 0)?.[0] as DashboardPreviewSegment | undefined;

  return winner ?? "generic_business";
}

export function getDashboardPreviewCopy(
  audit: DashboardPreviewAuditSource,
  auditedUrl: string,
  locale: DashboardPreviewLocale,
): DashboardPreviewCopy {
  const segment = resolveDashboardPreviewSegment(audit, auditedUrl);
  const template = SEGMENT_TEMPLATES[segment];
  const domainLabel = getDomainLabel(auditedUrl, audit);
  const questionItems = template.questions[locale].slice(0, 4);
  const leadRows = buildLeadRows(audit, locale, segment, template);
  const topTheme = buildTopTheme(segment, locale, template, questionItems);
  const interactions = clamp(26 + audit.score * 2 + audit.example_user_flows.length * 4 + audit.upsell_opportunities.length * 2, 32, 58);
  const qualified = clamp(Math.round(interactions * 0.43), 12, 24);
  const highIntent = clamp(Math.round(qualified * 0.36 + audit.score / 5), 4, 9);
  const previewNote =
    isHealthcareDashboardPreviewSegment(segment)
      ? locale === "cs"
        ? `Model pro ${domainLabel} sklada nahled pacientskych otazek, objednani a signalu podle typu webu: ${template.label[locale]}.`
        : `Model pre ${domainLabel} sklada nahlad pacientskych otazok, objednani a signalov podla typu webu: ${template.label[locale]}.`
      : locale === "cs"
        ? `Model pro ${domainLabel} sklada produktovy nahled leadu, otazek a obchodnich signalu podle typu webu: ${template.label[locale]}.`
        : `Model pre ${domainLabel} sklada produktovy nahlad leadov, otazok a obchodnych signalov podla typu webu: ${template.label[locale]}.`;

  return {
    segment,
    domainLabel,
    segmentLabel: template.label[locale],
    previewBadge: "AI dashboard preview",
    simulatedBadge: locale === "cs" ? "Simulovana data" : "Simulovane data",
    previewNote,
    metrics:
      segment === "dental_clinic"
        ? [
            {
              label: locale === "cs" ? "Zachycene zamery" : "Zachytene zamery",
              value: locale === "cs" ? "58 modelovych pacientskych otazek" : "58 modelovych pacientskych otazok",
              hint: locale === "cs" ? "preview toho, co by AI zachytila pred objednanim" : "preview toho, co by AI zachytila pred objednanim",
            },
            {
              label: locale === "cs" ? "Kvalifikovana objednani" : "Kvalifikovane objednania",
              value: locale === "cs" ? "24 pripravenych poptavek" : "24 pripravenych dopytov",
              hint: locale === "cs" ? "pripraveno pro recepci" : "pripravene pre recepciu",
            },
            {
              label: locale === "cs" ? "Nejcastejsi tema" : "Najcastejsia tema",
              value: locale === "cs" ? "Vyber sluzby" : "Vyber sluzby",
              hint: locale === "cs" ? "nejcastejsi opakovany motiv" : "najcastejsi opakovany motiv",
            },
            {
              label: locale === "cs" ? "Potencial na kontakt" : "Potencial na kontakt",
              value: locale === "cs" ? "9 vysoky zajem" : "9 vysoky zaujem",
              hint: locale === "cs" ? "pacienti nejbliz objednani" : "pacienti najblizsie k objednaniu",
            },
          ]
        : isHealthcareDashboardPreviewSegment(segment)
          ? [
              {
                label: locale === "cs" ? "Zachycene zamery" : "Zachytene zamery",
                value:
                  locale === "cs"
                    ? `${interactions} modelovych pacientskych otazek`
                    : `${interactions} modelovych pacientskych otazok`,
                hint:
                  locale === "cs"
                    ? "preview toho, co by AI zachytila pred objednanim"
                    : "preview toho, co by AI zachytila pred objednanim",
              },
              {
                label: locale === "cs" ? "Kvalifikovana objednani" : "Kvalifikovane objednania",
                value:
                  locale === "cs"
                    ? `${qualified} pripravenych poptavek`
                    : `${qualified} pripravenych dopytov`,
                hint: locale === "cs" ? "pripraveno pro recepci" : "pripravene pre recepciu",
              },
              {
                label: locale === "cs" ? "Nejcastejsi tema" : "Najcastejsia tema",
                value: topTheme,
                hint: locale === "cs" ? "opakujici se motiv v simulaci" : "opakujuci sa motiv v simulacii",
              },
              {
                label: locale === "cs" ? "Potencial na kontakt" : "Potencial na kontakt",
                value: locale === "cs" ? `${highIntent} vysoky zajem` : `${highIntent} vysoky zaujem`,
                hint:
                  locale === "cs"
                    ? "pacienti nejbliz objednani nebo konzultaci"
                    : "pacienti najblizsie k objednaniu alebo konzultacii",
              },
            ]
          : [
              {
                label: locale === "cs" ? "Zachycene zamery" : "Zachytene zamery",
                value: locale === "cs" ? `${interactions} modelovych interakci` : `${interactions} modelovych interakcii`,
                hint: locale === "cs" ? "preview toho, co by AI zachytila na webu" : "preview toho, co by AI zachytila na webe",
              },
              {
                label: locale === "cs" ? "Kvalifikovane poptavky" : "Kvalifikovane dopyty",
                value: locale === "cs" ? `${qualified} kvalifikovanych leadu` : `${qualified} kvalifikovanych leadov`,
                hint: locale === "cs" ? "pripraveno pro rychly follow-up" : "pripravene pre rychly follow-up",
              },
              {
                label: locale === "cs" ? "Nejcastejsi tema" : "Najcastejsia tema",
                value: topTheme,
                hint: locale === "cs" ? "opakujici se motiv v simulaci" : "opakujuci sa motiv v simulacii",
              },
              {
                label: locale === "cs" ? "Potencial na call / kontakt" : "Potencial na call / kontakt",
                value: locale === "cs" ? `${highIntent} vysoky zajem` : `${highIntent} vysoky zaujem`,
                hint: locale === "cs" ? "navstevnici nejbliz ke kontaktu" : "navstevnici najblizsie ku kontaktu",
              },
            ],
    leadTableTitle:
      isHealthcareDashboardPreviewSegment(segment)
        ? locale === "cs"
          ? "Modelove objednani a doporuceny dalsi krok"
          : "Modelove objednania a odporucany dalsi krok"
        : locale === "cs"
          ? "Modelove leady a doporuceny dalsi krok"
          : "Modelove leady a odporucany dalsi krok",
    leadTableCaption:
      isHealthcareDashboardPreviewSegment(segment)
        ? locale === "cs"
          ? "Nejde o realna data. Je to simulace toho, co by po nasazeni AI vrstvy videla recepce."
          : "Nejde o realne data. Je to simulacia toho, co by po nasadeni AI vrstvy videla recepcia."
        : locale === "cs"
          ? "Nejde o realna data. Je to simulace toho, co by obchod videl po nasazeni AI vrstvy."
          : "Nejde o realne data. Je to simulacia toho, co by obchod videl po nasadeni AI vrstvy.",
    leadColumnLabels: {
      intent: locale === "cs" ? "Zamer" : "Zamer",
      detail: locale === "cs" ? "Detail" : "Detail",
      quality: locale === "cs" ? "Kvalita" : "Kvalita",
      nextStep: locale === "cs" ? "Dalsi krok" : "Dalsi krok",
    },
    leadRows,
    questionTitle: locale === "cs" ? "Top otazky a temata" : "Top otazky a temy",
    questionItems,
    intentTitle: locale === "cs" ? "Nejcastejsi zamery" : "Najcastejsie zamery",
    intentItems: leadRows.slice(0, 3).map((row, index) => ({
      label: row.intent,
      value: [46, 31, 23][index] ?? 18,
      hint:
        locale === "cs"
          ? ["nejsilnejsi modelovy signal", "casty follow-up zajem", "potrebuje vice kontextu"][index] ?? "dalsi opakujici se signal"
          : ["najsilnejsi modelovy signal", "casty follow-up zaujem", "potrebuje viac kontextu"][index] ?? "dalsi opakovany signal",
    })),
    insightsTitle: locale === "cs" ? "Co byste dnes bezne nevideli" : "Co by ste dnes bezne nevideli",
    insights: template.insights[locale].slice(0, 4),
    reasonsTitle: locale === "cs" ? "Proc neodeslali poptavku" : "Preco neodoslali dopyt",
    reasons: buildReasons(audit, locale, segment, template),
    nextStepsTitle: locale === "cs" ? "Co zlepsit jako dalsi krok" : "Co zlepsit ako dalsi krok",
    nextSteps: buildNextSteps(audit, locale, segment, template),
    highlightTitle: locale === "cs" ? "Co tim ziskate" : "Co tym ziskate",
    highlightText:
      segment === "dental_clinic"
        ? locale === "cs"
          ? "Mene nejasnych otazek pro recepci, vice lepe pripravenych objednani a prehled o tom, jake problemy pacienti resi jeste pred kontaktem."
          : "Menej nejasnych otazok pre recepciu, viac lepsie pripravenych objednani a prehlad o tom, ake problemy pacienti riesia este pred kontaktom."
        : isHealthcareDashboardPreviewSegment(segment)
          ? locale === "cs"
            ? "Vice lepe pripravenych objednani, mene nejasnych otazek pro recepci a prehled o tom, co pacienti resi jeste pred kontaktem."
            : "Viac lepsie pripravenych objednani, menej nejasnych otazok pre recepciu a prehlad o tom, co pacienti riesia este pred kontaktom."
          : locale === "cs"
            ? "Vice kvalifikovanych poptavek, mene ztracenych navstevniku a prehled o tom, co lide na vasem webu realne potrebuji - jeste predtim, nez vas kontaktuji."
            : "Viac kvalifikovanych dopytov, menej stratenych navstevnikov a prehlad o tom, co ludia na vasom webe realne potrebuju - este predtym, nez vas kontaktuju.",
  };
}
