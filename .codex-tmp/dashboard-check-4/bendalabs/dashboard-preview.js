"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveDashboardPreviewSegment = resolveDashboardPreviewSegment;
exports.getDashboardPreviewCopy = getDashboardPreviewCopy;
const SEGMENT_KEYWORDS = {
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
const SEGMENT_TEMPLATES = {
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
function normalizeText(value) {
    return value
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
}
function cleanText(value) {
    return value.trim().replace(/^["'“”„]+|["'“”„]+$/g, "").replace(/\s+/g, " ").replace(/[.!?]+$/, "");
}
function lowerFirst(value) {
    const trimmed = cleanText(value);
    return trimmed ? trimmed.charAt(0).toLowerCase() + trimmed.slice(1) : trimmed;
}
function shortText(value, maxLength = 88) {
    const cleaned = cleanText(value);
    if (cleaned.length <= maxLength) {
        return cleaned;
    }
    return `${cleaned.slice(0, maxLength - 1).trimEnd()}…`;
}
function shortenPreviewText(value, maxLength = 72) {
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
function dedupeItems(items) {
    return Array.from(new Set(items.map(cleanText).filter(Boolean)));
}
function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}
function getDomainLabel(auditedUrl, audit) {
    if (audit.domain?.trim()) {
        return audit.domain.trim();
    }
    try {
        return new URL(auditedUrl).hostname.replace(/^www\./, "");
    }
    catch {
        return auditedUrl.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0] || auditedUrl;
    }
}
function getAuditTextPool(audit, auditedUrl) {
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
function scoreSegment(haystack, keywords) {
    return keywords.reduce((score, keyword) => score + (haystack.includes(keyword) ? 1 : 0), 0);
}
function takeMerged(primary, fallback, limit) {
    return dedupeItems([...primary, ...fallback]).slice(0, limit);
}
function getQualityLabel(locale, quality) {
    if (quality === "high") {
        return locale === "cs" ? "Vysoky zajem" : "Vysoky zaujem";
    }
    if (quality === "medium") {
        return "Stredny";
    }
    return locale === "cs" ? "Nizky" : "Nizky";
}
function buildDerivedQuestions(audit) {
    return dedupeItems([
        ...audit.example_user_flows.map((flow) => shortenPreviewText(flow.user_intent)),
        ...audit.upsell_opportunities.map((item) => shortenPreviewText(item)),
        ...audit.phase_one_plan.map((item) => shortenPreviewText(item)),
    ].filter((item) => Boolean(item)));
}
function buildDerivedInsights(audit) {
    return dedupeItems([
        shortenPreviewText(audit.why_fit[0] ?? ""),
        shortenPreviewText(audit.friction_points[0] ?? ""),
        shortenPreviewText(audit.upsell_opportunities[0] ?? ""),
        shortenPreviewText(audit.phase_one_plan[0] ?? ""),
    ].filter((item) => Boolean(item)));
}
function buildLeadRows(audit, locale, segment, template) {
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
function buildReasons(audit, locale, template) {
    const derived = audit.friction_points
        .slice(0, 2)
        .map((item) => shortenPreviewText(item, 72))
        .filter((item) => Boolean(item));
    return takeMerged(template.reasons[locale], derived, 4);
}
function buildNextSteps(audit, locale, template) {
    const derived = audit.phase_one_plan
        .slice(0, 2)
        .map((item) => shortenPreviewText(item, 72))
        .filter((item) => Boolean(item));
    return takeMerged(template.nextSteps[locale], derived, 4);
}
function buildTopTheme(locale, template, questions) {
    if (!questions[0]) {
        return template.topTheme[locale];
    }
    return shortenPreviewText(questions[0], 28) ?? template.topTheme[locale];
}
function resolveDashboardPreviewSegment(audit, auditedUrl) {
    const haystack = normalizeText(getAuditTextPool(audit, auditedUrl).join(" "));
    const scores = {
        real_estate: scoreSegment(haystack, SEGMENT_KEYWORDS.real_estate),
        finance_insurance: scoreSegment(haystack, SEGMENT_KEYWORDS.finance_insurance),
        ecommerce: scoreSegment(haystack, SEGMENT_KEYWORDS.ecommerce),
        marketplace_services: scoreSegment(haystack, SEGMENT_KEYWORDS.marketplace_services),
        rental: scoreSegment(haystack, SEGMENT_KEYWORDS.rental),
        b2b_industrial: scoreSegment(haystack, SEGMENT_KEYWORDS.b2b_industrial),
        generic_business: 0,
    };
    if (scores.real_estate > 0) {
        scores.rental = Math.max(0, scores.rental - 1);
    }
    if (scores.marketplace_services > 0 && scores.ecommerce > 0) {
        scores.marketplace_services += 1;
    }
    const winner = Object.entries(scores)
        .sort((left, right) => right[1] - left[1])
        .find((entry) => entry[1] > 0)?.[0];
    return winner ?? "generic_business";
}
function getDashboardPreviewCopy(audit, auditedUrl, locale) {
    const segment = resolveDashboardPreviewSegment(audit, auditedUrl);
    const template = SEGMENT_TEMPLATES[segment];
    const domainLabel = getDomainLabel(auditedUrl, audit);
    const questionItems = takeMerged(template.questions[locale], buildDerivedQuestions(audit), 4);
    const leadRows = buildLeadRows(audit, locale, segment, template);
    const topTheme = buildTopTheme(locale, template, questionItems);
    const interactions = clamp(26 + audit.score * 2 + audit.example_user_flows.length * 4 + audit.upsell_opportunities.length * 2, 32, 58);
    const qualified = clamp(Math.round(interactions * 0.43), 12, 24);
    const highIntent = clamp(Math.round(qualified * 0.36 + audit.score / 5), 4, 9);
    const previewNote = locale === "cs"
        ? `Model pro ${domainLabel} sklada produktovy nahled leadu, otazek a obchodnich signalu podle typu webu: ${template.label[locale]}.`
        : `Model pre ${domainLabel} sklada produktovy nahlad leadov, otazok a obchodnych signalov podla typu webu: ${template.label[locale]}.`;
    return {
        segment,
        domainLabel,
        segmentLabel: template.label[locale],
        previewBadge: "AI dashboard preview",
        simulatedBadge: locale === "cs" ? "Simulovana data" : "Simulovane data",
        previewNote,
        metrics: [
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
        leadTableTitle: locale === "cs" ? "Modelove leady a doporuceny dalsi krok" : "Modelove leady a odporucany dalsi krok",
        leadTableCaption: locale === "cs"
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
            hint: locale === "cs"
                ? ["nejsilnejsi modelovy signal", "casty follow-up zajem", "potrebuje vice kontextu"][index] ?? "dalsi opakujici se signal"
                : ["najsilnejsi modelovy signal", "casty follow-up zaujem", "potrebuje viac kontextu"][index] ?? "dalsi opakovany signal",
        })),
        insightsTitle: locale === "cs" ? "Co byste dnes bezne nevideli" : "Co by ste dnes bezne nevideli",
        insights: takeMerged(template.insights[locale], buildDerivedInsights(audit), 4),
        reasonsTitle: locale === "cs" ? "Proc neodeslali poptavku" : "Preco neodoslali dopyt",
        reasons: buildReasons(audit, locale, template),
        nextStepsTitle: locale === "cs" ? "Co zlepsit jako dalsi krok" : "Co zlepsit ako dalsi krok",
        nextSteps: buildNextSteps(audit, locale, template),
        highlightTitle: locale === "cs" ? "Co tim ziskate" : "Co tym ziskate",
        highlightText: locale === "cs"
            ? "Vice kvalifikovanych poptavek, mene ztracenych navstevniku a prehled o tom, co lide na vasem webu realne potrebuji - jeste predtim, nez vas kontaktuji."
            : "Viac kvalifikovanych dopytov, menej stratenych navstevnikov a prehlad o tom, co ludia na vasom webe realne potrebuju - este predtym, nez vas kontaktuju.",
    };
}
