import type { SiteLocale } from "@/lib/bendalabs/site-content";
import { getNormalizedDomain } from "@/lib/leads/domain";
import { siteAuditSchema, type SiteAudit } from "@/lib/site-audit/schema";

type LocalizedRealtyAuditContent = {
  summary: string;
  siteType: string;
  whyFit: [string, string, string, string];
  frictionPoints: [string, string, string, string];
  upsell: [string, string, string];
  phaseOne: [string, string, string];
  flows: [
    {
      user_intent: string;
      ai_action: string;
      business_value: string;
    },
    {
      user_intent: string;
      ai_action: string;
      business_value: string;
    },
    {
      user_intent: string;
      ai_action: string;
      business_value: string;
    },
  ];
};

type RealtyDomainOverride = {
  sk: LocalizedRealtyAuditContent;
  cs: LocalizedRealtyAuditContent;
};

function createBendaLabsAudit(locale: SiteLocale): SiteAudit {
  const localized = {
    sk: {
      summary:
        "BendaLabs je priamo produktovy web pre AI vrstvu, audit, lead flow a konverzny funnel, preto je to velmi silny kandidat na vlastne AI asistovane routovanie navstevnikov. Web uz komunikuje AI use-case, sluzbu aj dalsi conversion krok v jednom jasnom flowe.",
      whyFit: [
        "Je to priamo produktovy web pre AI vrstvu a audit, nie len vseobecny obsahovy web.",
        "Navstevnik prechadza jasnym funnelom od pochopenia ponuky po audit alebo kontakt.",
        "Lead flow a konverzne miesta su uz prirodzene pripravene na AI qualification vrstvu.",
        "Odporucanie dalsieho kroku je priamo spojene s obchodnym cielom webu.",
      ],
      frictionPoints: [
        "Navstevnik potrebuje rychlo pochopit, ci je AI vrstva vhodna prave pre jeho web.",
        "Rozhodovanie medzi auditom, kontaktom a konkretnou sluzbou potrebuje jasne nasmerovanie.",
        "Bez asistencie moze navstevnik odist skor, nez si vyberie relevantny dalsi krok.",
        "Lead capture potrebuje udrzat momentum medzi zaujmom a odoslanim dopytu.",
      ],
      upsell: [
        "AI moze kvalifikovat lead podla typu webu a odporucit najrelevantnejsiu sluzbu.",
        "Asistent moze presmerovat navstevnika na audit, demo alebo kontakt podla zrelej potreby.",
        "Prirodzeny conversational flow vie zvysit conversion rate aj kvalitu leadov.",
      ],
      phaseOne: [
        "Nasadit AI layer na routing medzi auditom, sluzbou a kontaktom.",
        "Pouzit asistenta na rychlu qualification podla typu webu, funnelu a obchodneho ciela.",
        "Merat dopad na mieru odoslanych auditov, kontaktov a kvalitu leadov.",
      ],
      flows: [
        {
          user_intent: "Mam servisny alebo produktovy web a chcem vediet, ci sa mi oplati AI vrstva.",
          ai_action: "AI asistent zisti typ webu, identifikuje funnel a odporuci najvhodnejsi dalsi krok.",
          business_value: "Vyssia pravdepodobnost, ze relevantny navstevnik dokonci audit alebo posle dopyt.",
        },
        {
          user_intent: "Neviem, ci mam poziadat o audit alebo rovno o konzultaciu.",
          ai_action: "Asistent polozi kratke kvalifikacne otazky a navrhne audit alebo kontakt.",
          business_value: "Menej nerozhodnych odchodov a presnejsie smerovanie leadov.",
        },
        {
          user_intent: "Chcem pochopit, co by AI vrstva spravila na mojom webe.",
          ai_action: "AI vysvetli relevantny use-case a naviaze ho na audit alebo konkretnu sluzbu.",
          business_value: "Vyssia konverzia z navstevnosti na kvalifikovany obchodny zaujem.",
        },
      ],
    },
    cs: {
      summary:
        "BendaLabs je primo produktovy web pro AI vrstvu, audit, lead flow a konverzni funnel, proto jde o velmi silny fit pro vlastni AI asistovane routovani navstevniku. Web uz kombinuje AI use-case, sluzbu i dalsi conversion krok v jednom jasnem flow.",
      whyFit: [
        "Jde primo o produktovy web pro AI vrstvu a audit, ne jen o obecny obsahovy web.",
        "Navstevnik prochazi jasnym funnelom od pochopeni nabidky po audit nebo kontakt.",
        "Lead flow a konverzni mista jsou prirozene pripravena pro AI qualification vrstvu.",
        "Doporuceni dalsiho kroku je primo spojene s obchodnim cilem webu.",
      ],
      frictionPoints: [
        "Navstevnik potrebuje rychle pochopit, zda je AI vrstva vhodna prave pro jeho web.",
        "Rozhodovani mezi auditem, kontaktem a konkretni sluzbou potrebuje jasne nasmerovani.",
        "Bez asistence muze navstevnik odejit driv, nez si vybere relevantni dalsi krok.",
        "Lead capture potrebuje udrzet momentum mezi zajmem a odeslanim poptavky.",
      ],
      upsell: [
        "AI muze kvalifikovat lead podle typu webu a doporucit nejrelevantnejsi sluzbu.",
        "Asistent muze presmerovat navstevnika na audit, demo nebo kontakt podle zralosti potreby.",
        "Prirozeny conversational flow umi zvysit conversion rate i kvalitu leadu.",
      ],
      phaseOne: [
        "Nasadit AI layer na routing mezi auditem, sluzbou a kontaktem.",
        "Pouzit asistenta pro rychlou qualification podle typu webu, funnelu a obchodniho cile.",
        "Merit dopad na miru odeslanych auditu, kontaktu a kvalitu leadu.",
      ],
      flows: [
        {
          user_intent: "Mam servisni nebo produktovy web a chci vedet, zda se mi vyplati AI vrstva.",
          ai_action: "AI asistent zjisti typ webu, identifikuje funnel a doporuci nejvhodnejsi dalsi krok.",
          business_value: "Vyssi pravdepodobnost, ze relevantni navstevnik dokonci audit nebo posle poptavku.",
        },
        {
          user_intent: "Nevim, zda mam pozadat o audit nebo rovnou o konzultaci.",
          ai_action: "Asistent polozi kratke kvalifikacni otazky a navrhne audit nebo kontakt.",
          business_value: "Mene nerozhodnych odchodu a presnejsi smerovani leadu.",
        },
        {
          user_intent: "Chci pochopit, co by AI vrstva udelala na mem webu.",
          ai_action: "AI vysvetli relevantni use-case a navaze ho na audit nebo konkretni sluzbu.",
          business_value: "Vyssi konverze z navstevnosti na kvalifikovany obchodni zajem.",
        },
      ],
    },
  } as const;

  const content = localized[locale];

  return siteAuditSchema.parse({
    score: 9,
    is_good_fit: true,
    site_type: "service web / AI product landing page",
    recommended_ai_type: ["lead qualifier", "navigator", "upsell assistant"],
    summary: content.summary,
    why_fit: content.whyFit,
    friction_points: content.frictionPoints,
    upsell_opportunities: content.upsell,
    phase_one_plan: content.phaseOne,
    example_user_flows: content.flows,
  });
}

function createBazosAudit(locale: SiteLocale): SiteAudit {
  const localized = {
    sk: {
      summary:
        "Bazos je velmi silny kandidat pre AI vrstvu, pretoze pouzivatel casto neprichadza s presnym nazvom kategorie ani produktu, ale s volne napisanym zamerom. AI vrstva by vedela zrychlit vyhladavanie, pomoct pri spravnom zaradeni inzeratu a zjednodusit cestu k spravnemu vysledku bez potreby prestavby samotneho webu.",
      whyFit: [
        "Pouzivatelia hladaju veci prirodzene, nie podla presneho nazvu rubriky.",
        "Web je silne zalozeny na kategoriach, vyhladavani a orientacii v ponuke.",
        "AI vrstva moze pomoct pri hladani aj pri pridavani inzeratu.",
        "Velky potencial je v pochopeni volne napisaneho dopytu a spravnom nasmerovani pouzivatela.",
      ],
      frictionPoints: [
        "Pouzivatel nemusi poznat spravnu kategoriu alebo presny nazov produktu.",
        "Pri vyhladavani sa moze stratit medzi rubrikami a roznymi pomenovaniami toho isteho produktu.",
        "Pri pridavani inzeratu nemusi vediet, kam ho spravne zaradit.",
        "Pri probleme alebo nejasnosti nemusi vediet, kam pokracovat.",
      ],
      upsell: [
        "Odporucanie presnejsej alebo vhodnejsej kategorie podla zameru pouzivatela.",
        "Lepse nasmerovanie pri pridavani inzeratu.",
        "Presnejsie vyhladavanie aj pri nepresnom alebo ludovom nazve produktu.",
      ],
      phaseOne: [
        "Nasadit AI vrstvu nad vyhladavanie a kategorie.",
        "Pomoct pouzivatelovi z volnej vety najst spravnu rubriku alebo vysledky.",
        "Pridat pomoc pri zaradeni noveho inzeratu do spravnej kategorie.",
        "Merat, ktore typy dopytov sa opakuju a kde sa pouzivatelia najcastejsie zaseknu.",
      ],
      flows: [
        {
          user_intent: "hladam lacny vozik za auto",
          ai_action:
            "AI vrstva pochopi zamer a posle pouzivatela do spravnej kategorie s vhodnejsim vyhladavacim dotazom.",
          business_value: "Rychlejsie najdenie spravnych inzeratov bez bludenia medzi rubrikami.",
        },
        {
          user_intent: "predavam gauc, kam to zaradit?",
          ai_action: "AI vrstva odporuci spravnu kategoriu a dalsi krok pri pridavani inzeratu.",
          business_value: "Menej chyb pri pridavani inzeratov a jednoduchsie pouzivanie sluzby.",
        },
        {
          user_intent: "potrebujem dodavku na podnikanie",
          ai_action:
            "AI vrstva pouzivatela nasmeruje na spravnu kategoriu a upravi dopyt na relevantnejsie vysledky.",
          business_value: "Presnejsie vyhladavanie a vyssia sanca, ze pouzivatel najde spravny vysledok.",
        },
      ],
    },
    cs: {
      summary:
        "Bazos je velmi silny kandidat pro AI vrstvu, protoze uzivatel casto neprichazi s presnym nazvem kategorie ani produktu, ale s volne napsanym zamerem. AI vrstva by dokazala zrychlit vyhledavani, pomoct pri spravnem zarazeni inzeratu a zjednodusit cestu ke spravnemu vysledku bez potreby prestavby samotneho webu.",
      whyFit: [
        "Uzivatele hledaji veci prirozene, ne podle presneho nazvu rubriky.",
        "Web je silne zalozeny na kategoriich, vyhledavani a orientaci v nabidce.",
        "AI vrstva muze pomoct pri hledani i pri pridavani inzeratu.",
        "Velky potencial je v pochopeni volne napsane poptavky a spravnem nasmerovani uzivatele.",
      ],
      frictionPoints: [
        "Uzivatel nemusi znat spravnou kategorii nebo presny nazev produktu.",
        "Pri vyhledavani se muze ztratit mezi rubrikami a ruznymi pojmenovanimi toho sameho produktu.",
        "Pri pridavani inzeratu nemusi vedet, kam ho spravne zaradit.",
        "Pri problemu nebo nejasnosti nemusi vedet, kam pokracovat.",
      ],
      upsell: [
        "Doporuceni presnejsi nebo vhodnejsi kategorie podle zameru uzivatele.",
        "Lepsi nasmerovani pri pridavani inzeratu.",
        "Presnejsi vyhledavani i pri nepresnem nebo lidovem nazvu produktu.",
      ],
      phaseOne: [
        "Nasadit AI vrstvu nad vyhledavani a kategorie.",
        "Pomoct uzivateli z volne vety najit spravnou rubriku nebo vysledky.",
        "Pridat pomoc pri zarazeni noveho inzeratu do spravne kategorie.",
        "Merit, ktere typy poptavek se opakuji a kde se uzivatele nejcasteji zaseknou.",
      ],
      flows: [
        {
          user_intent: "hledam levny vozik za auto",
          ai_action:
            "AI vrstva pochopi zamer a posle uzivatele do spravne kategorie s vhodnejsim vyhledavacim dotazem.",
          business_value: "Rychlejsi nalezeni spravnych inzeratu bez bloudeni mezi rubrikami.",
        },
        {
          user_intent: "prodavam gauc, kam to zaradit?",
          ai_action: "AI vrstva doporuci spravnou kategorii a dalsi krok pri pridavani inzeratu.",
          business_value: "Mene chyb pri pridavani inzeratu a jednodussi pouzivani sluzby.",
        },
        {
          user_intent: "potrebuji dodavku na podnikani",
          ai_action:
            "AI vrstva uzivatele nasmeruje na spravnou kategorii a upravi poptavku na relevantnejsi vysledky.",
          business_value: "Presnejsi vyhledavani a vyssi sance, ze uzivatel najde spravny vysledek.",
        },
      ],
    },
  } as const;

  const content = localized[locale];

  return siteAuditSchema.parse({
    score: 10,
    is_good_fit: true,
    site_type: "classifieds marketplace",
    recommended_ai_type: ["navigator", "recommender", "lead qualifier"],
    summary: content.summary,
    why_fit: content.whyFit,
    friction_points: content.frictionPoints,
    upsell_opportunities: content.upsell,
    phase_one_plan: content.phaseOne,
    example_user_flows: content.flows,
  });
}

const realtyDomainOverrides: Record<string, RealtyDomainOverride> = {
  "bosen.sk": {
    sk: {
      summary:
        "Tento web ma velmi silny potencial pre AI vrstvu. BOSEN pracuje s viacerymi maklermi, lokalitami a typmi nehnutelnosti, takze intent-based navigacia vie navstevnika rychlo poslat k relevantnej ponuke, maklerovi alebo dopytu bez zmeny existujuceho webu.",
      siteType: "real estate brokerage and listings web",
      whyFit: [
        "Sirka ponuky, viac lokalit a viac typov nehnutelnosti vytvaraju silny priestor pre AI vrstvu nad webom.",
        "Navstevnik casto nenapise nazov filtra, ale svoj zamer, lokalitu alebo typ byvania, ktory hlada.",
        "Najvacsia prilezitost nie je nahradit existujuci web, ale pridat rychlejsiu cestu od zameru k ponuke alebo dopytu.",
        "Pri tomto type realitneho webu dava intent-based navigacia mimoriadny zmysel.",
      ],
      frictionPoints: [
        "Pri vacsom pocte maklerov a ponuk nie je vzdy jasne, ktory smer je pre navstevnika najlepsi ako prvy krok.",
        "Kombinacia lokality, typu nehnutelnosti a stadium rozhodnutia vie navstevnika brzdit este pred dopytom.",
        "Pouzivatel casto nevie, ci chce rovno ponuku, maklera alebo len zanechat poziadavku.",
        "Klasicke filtre nezachytia dobre volne napisany intent.",
      ],
      upsell: [
        "AI vrstva vie navstevnika naviest na spravnu ponuku, lokalitu alebo maklera podla jeho zameru.",
        "Vie odlisit, ci je vhodnejsi shortlist ponuk alebo rychly dopytovy formular.",
        "Vie znizit pocet slepych odchodov pri sirsej realitnej ponuke.",
      ],
      phaseOne: [
        "Nasadit AI vrstvu nad hlavny vstup do ponuky a nad klucove listingove stranky.",
        "Z volne napisaneho intentu smerovat navstevnika na relevantnu ponuku, maklera alebo dopytovy formular.",
        "Merat dopad na mieru odoslanych dopytov a rychlost prechodu od zameru ku kontaktu.",
      ],
      flows: [
        {
          user_intent: "Hladam vacsi byt v Bratislave pre rodinu.",
          ai_action: "AI vrstva rozpozna lokalitu, potrebu a typ nehnutelnosti a posle navstevnika na relevantne ponuky alebo maklera.",
          business_value: "Rychlejsia cesta od zameru k shortlistu ponuk a vyssia sanca na dopyt.",
        },
        {
          user_intent: "Chcem predat nehnutelnost a neviem, koho kontaktovat.",
          ai_action: "Web navrhne spravneho maklera alebo dopytovy formular podla lokality a typu nehnutelnosti.",
          business_value: "Lepsie kvalifikovany inbound a menej nepresnych kontaktov.",
        },
        {
          user_intent: "Zhanam investicny byt s dobrym potencialom.",
          ai_action: "AI vrstva odfiltruje vhodne smery a navrhne relevantnu ponuku alebo dalsi konzultacny krok.",
          business_value: "Vyssia relevancia navrhu a rychlejsie rozhodovanie klienta.",
        },
      ],
    },
    cs: {
      summary:
        "Tento web ma velmi silny potencial pro AI vrstvu. BOSEN pracuje s vice makleri, lokalitami a typy nemovitosti, takze intent-based navigace umi navstevnika rychle poslat k relevantni nabidce, makleri nebo poptavce bez zmeny existujiciho webu.",
      siteType: "real estate brokerage and listings web",
      whyFit: [
        "Sirka nabidky, vice lokalit a vice typu nemovitosti vytvareji silny prostor pro AI vrstvu nad webem.",
        "Navstevnik casto nenapise nazev filtru, ale svuj zamer, lokalitu nebo typ bydleni, ktery hleda.",
        "Nejvetsi prilezitost neni nahradit existujici web, ale pridat rychlejsi cestu od zameru k nabidce nebo poptavce.",
        "U tohoto typu realitniho webu dava intent-based navigace mimoradny smysl.",
      ],
      frictionPoints: [
        "Pri vetsim poctu makleru a nabidek neni vzdy jasne, ktery smer je pro navstevnika nejlepsi jako prvni krok.",
        "Kombinace lokality, typu nemovitosti a stadia rozhodovani umi navstevnika brzdit jeste pred poptavkou.",
        "Uzivatel casto nevi, zda chce rovnou nabidku, maklere nebo jen zanechat pozadavek.",
        "Klasicke filtry nezachyti dobre volne napsany intent.",
      ],
      upsell: [
        "AI vrstva umi navstevnika navest na spravnou nabidku, lokalitu nebo maklere podle jeho zameru.",
        "Umi rozlisit, zda je vhodnejsi shortlist nabidek nebo rychly poptavkovy formular.",
        "Umi snizit pocet slepych odchodu pri sirsi realitni nabidce.",
      ],
      phaseOne: [
        "Nasadit AI vrstvu nad hlavni vstup do nabidky a nad klicove listingove stranky.",
        "Z volne napsaneho intentu smerovat navstevnika na relevantni nabidku, maklere nebo poptavkovy formular.",
        "Merit dopad na miru odeslanych poptavek a rychlost prechodu od zameru ke kontaktu.",
      ],
      flows: [
        {
          user_intent: "Hledam vetsi byt v Bratislave pro rodinu.",
          ai_action: "AI vrstva rozpozna lokalitu, potrebu a typ nemovitosti a posle navstevnika na relevantni nabidky nebo maklere.",
          business_value: "Rychlejsi cesta od zameru ke shortlistu nabidek a vyssi sance na poptavku.",
        },
        {
          user_intent: "Chci prodat nemovitost a nevim, koho kontaktovat.",
          ai_action: "Web navrhne spravneho maklere nebo poptavkovy formular podle lokality a typu nemovitosti.",
          business_value: "Lepse kvalifikovany inbound a mene nepresnych kontaktu.",
        },
        {
          user_intent: "Shanim investicni byt s dobrym potencialem.",
          ai_action: "AI vrstva odfiltruje vhodne smery a navrhne relevantni nabidku nebo dalsi konzultacni krok.",
          business_value: "Vyssi relevance navrhu a rychlejsi rozhodovani klienta.",
        },
      ],
    },
  },
  "herrys.sk": {
    sk: {
      summary:
        "Tento web ma velmi silny potencial pre AI vrstvu. Pri rezidencnom trhu a developerskych projektoch vie AI vrstva nad webom pomoct cloveku rozhodnut sa medzi projektom, lokalitou, typom bytu a kontaktom, teda premenit intent na konkretnu akciu.",
      siteType: "residential real estate and development projects web",
      whyFit: [
        "Rezidencny trh a developerske projekty vytvaraju viacero rozhodovacich vetiev, kde navstevnik potrebuje vedenie.",
        "Navstevnik casto prichadza so zamerom, nie s presnym filtrom alebo nazvom projektu.",
        "AI vrstva nad webom vie prirodzene nasmerovat medzi projekt, lokalitu, dispoziciu a kontakt.",
        "Najvacsia prilezitost je skratit cestu od vyberu byvania k relevantnej ponuke alebo dopytu.",
      ],
      frictionPoints: [
        "Rozhodovanie medzi projektmi, lokalitami a typmi bytov byva pre nerozhodnuteho navstevnika pomale.",
        "Pri developerskych ponukach je bez asistencie tazsie urcit, ktory vstupny krok je najlepsi.",
        "Pouzivatel moze oscilovat medzi prezeranim ponuk a odkladanim kontaktu.",
        "Klasicka filtracia nevie dobre zachytit preferencie vyjadrene volnou vetou.",
      ],
      upsell: [
        "AI vrstva vie odlisit, ci navstevnik hlada projekt, konkretny byt alebo konzultaciu.",
        "Vie odporucit relevantny dalsi krok podla lokality, dispozicie a stadia rozhodnutia.",
        "Vie priblizit navstevnika ku kontaktu bez narusenia existujuceho lead flowu.",
      ],
      phaseOne: [
        "Nasadit AI vrstvu pred filtre a vstupy do rezidencnej a developerskej ponuky.",
        "Prekladat volne napisany zamer na spravny projekt, typ bytu alebo kontakt.",
        "Merat, kolko navstevnikov prejde z uvodneho intentu na relevantnu ponuku alebo dopyt.",
      ],
      flows: [
        {
          user_intent: "Hladam novostavbu v dobrej lokalite pre vlastne byvanie.",
          ai_action: "AI vrstva porovna lokalitu, typ projektu a rozpocet a navrhne relevantne developerske ponuky.",
          business_value: "Rychlejsi prechod od inspiracie k shortlistu projektov.",
        },
        {
          user_intent: "Neviem, ci chcem dvojizbak alebo trojizbak.",
          ai_action: "Web prevedie navstevnika medzi dispoziciami a navrhne vhodne dalsie ponuky alebo konzultaciu.",
          business_value: "Menej nerozhodnych odchodov a viac kvalifikovanych dopytov.",
        },
        {
          user_intent: "Chcem sa spojit s niekym, kto mi poradi s vyberom byvania.",
          ai_action: "AI vrstva navrhne spravny kontakt alebo dopytovy formular podla zameru a lokality.",
          business_value: "Presnejsie smerovanie inboundu na relevantny obchodny krok.",
        },
      ],
    },
    cs: {
      summary:
        "Tento web ma velmi silny potencial pro AI vrstvu. U rezidencniho trhu a developerskych projektu umi AI vrstva nad webem pomoct cloveku rozhodnout se mezi projektem, lokalitou, typem bytu a kontaktem, tedy premenit intent na konkretni akci.",
      siteType: "residential real estate and development projects web",
      whyFit: [
        "Rezidencni trh a developerske projekty vytvareji vice rozhodovacich vetvi, kde navstevnik potrebuje vedeni.",
        "Navstevnik casto prichazi se zamerem, ne s presnym filtrem nebo nazvem projektu.",
        "AI vrstva nad webem umi prirozene nasmerovat mezi projekt, lokalitu, dispozici a kontakt.",
        "Nejvetsi prilezitost je zkratit cestu od vyberu bydleni k relevantni nabidce nebo poptavce.",
      ],
      frictionPoints: [
        "Rozhodovani mezi projekty, lokalitami a typy bytu byva pro nerozhodnuteho navstevnika pomale.",
        "U developerskych nabidek je bez asistence tezsi urcit, ktery vstupni krok je nejlepsi.",
        "Uzivatel muze oscilovat mezi prohlizenim nabidek a odkladanim kontaktu.",
        "Klasicka filtrace neumi dobre zachytit preference vyjadrene volnou vetou.",
      ],
      upsell: [
        "AI vrstva umi odlisit, zda navstevnik hleda projekt, konkretni byt nebo konzultaci.",
        "Umi doporucit relevantni dalsi krok podle lokality, dispozice a stadia rozhodnuti.",
        "Umi priblizit navstevnika ke kontaktu bez naruseni existujiciho lead flowu.",
      ],
      phaseOne: [
        "Nasadit AI vrstvu pred filtry a vstupy do rezidencni a developerske nabidky.",
        "Prekladat volne napsany zamer na spravny projekt, typ bytu nebo kontakt.",
        "Merit, kolik navstevniku prejde z uvodniho intentu na relevantni nabidku nebo poptavku.",
      ],
      flows: [
        {
          user_intent: "Hledam novostavbu v dobre lokalite pro vlastni bydleni.",
          ai_action: "AI vrstva porovna lokalitu, typ projektu a rozpocet a navrhne relevantni developerske nabidky.",
          business_value: "Rychlejsi prechod od inspirace ke shortlistu projektu.",
        },
        {
          user_intent: "Nevim, jestli chci dvoupokojovy nebo tripokojovy byt.",
          ai_action: "Web provede navstevnika mezi dispozicemi a navrhne vhodne dalsi nabidky nebo konzultaci.",
          business_value: "Mene nerozhodnych odchodu a vice kvalifikovanych poptavek.",
        },
        {
          user_intent: "Chci se spojit s nekym, kdo mi poradi s vyberem bydleni.",
          ai_action: "AI vrstva navrhne spravny kontakt nebo poptavkovy formular podle zameru a lokality.",
          business_value: "Presnejsi smerovani inboundu na relevantni obchodni krok.",
        },
      ],
    },
  },
  "haloreality.sk": {
    sk: {
      summary:
        "Tento web ma velmi silny potencial pre AI vrstvu. Pri velkom objeme ponuk dava prirodzeny vstup cez intent pred filtrami mimoriadny zmysel, pretoze navstevnik napise, co hlada, a web ho navedie na spravnu cast ponuky alebo dopytu.",
      siteType: "high-volume real estate listings portal",
      whyFit: [
        "Velky objem ponuk vytvara silnu potrebu rychlej orientacie hned na vstupe.",
        "Navstevnik casto vie opisat svoj zamer skor slovami nez kombinaciou filtrov.",
        "AI vrstva nad webom vie fungovat ako prirodzeny vstup pred filtrami bez prerabky jadra webu.",
        "Pri tomto type realitneho webu dava intent-based navigacia mimoriadny zmysel.",
      ],
      frictionPoints: [
        "Pri sirokej ponuke je pre navstevnika tazke rychlo sa zorientovat a nepreklikavat sa zbytocne.",
        "Klasicke listingy a filtre mozu byt pomalejsie pre cloveka, ktory este len spresnuje svoj dopyt.",
        "Rozhodovanie medzi kupou, prenajmom, lokalitou a typom nehnutelnosti vie zbytocne natahovat cestu ku kontaktu.",
        "Bez prveho navedenia moze navstevnik odist skor, nez sa dostane k relevantnej ponuke.",
      ],
      upsell: [
        "AI vrstva vie prelozit volne napisany dopyt na spravnu cast ponuky este pred filtraciou.",
        "Vie odlisit, ci je vhodny shortlist, kontakt na maklera alebo dopytovy formular.",
        "Vie znizit zahltenie navstevnika pri velkom pocte listingov.",
      ],
      phaseOne: [
        "Nasadit AI vrstvu ako prvy vstup pred filtrami a hlavnym listingom.",
        "Prekladat intent do lokality, typu nehnutelnosti a dalsieho kroku.",
        "Merat, ci sa skrati cas k prvej relevantnej ponuke a k odoslaniu dopytu.",
      ],
      flows: [
        {
          user_intent: "Hladam dvojizbak na prenajom v Kosiciach.",
          ai_action: "AI vrstva rozpozna prenajom, lokalitu a typ bytu a navedie navstevnika na spravnu cast ponuky.",
          business_value: "Menej bludenia vo velkom pocte ponuk a rychlejsi shortlist.",
        },
        {
          user_intent: "Chcem predat dom a neviem, co je najlepsie urobit ako prve.",
          ai_action: "Web navrhne spravny dopytovy krok alebo kontakt podla typu nehnutelnosti a lokality.",
          business_value: "Vyssia pravdepodobnost, ze navstevnik odosle relevantny dopyt.",
        },
        {
          user_intent: "Hladam investicnu nehnutelnost s dobrym potencialom.",
          ai_action: "AI vrstva navrhne vhodny smer v ponuke a ponukne dalsi kontakt pre spresnenie zameru.",
          business_value: "Lepsie smerovanie na relevantne ponuky a dalsi obchodny krok.",
        },
      ],
    },
    cs: {
      summary:
        "Tento web ma velmi silny potencial pro AI vrstvu. U velkeho objemu nabidek dava prirozeny vstup pres intent pred filtry mimoradny smysl, protoze navstevnik napise, co hleda, a web ho navede na spravnou cast nabidky nebo poptavky.",
      siteType: "high-volume real estate listings portal",
      whyFit: [
        "Velky objem nabidek vytvari silnou potrebu rychle orientace hned na vstupu.",
        "Navstevnik casto umi popsat svuj zamer driv slovy nez kombinaci filtru.",
        "AI vrstva nad webem umi fungovat jako prirozeny vstup pred filtry bez predelani jadra webu.",
        "U tohoto typu realitniho webu dava intent-based navigace mimoradny smysl.",
      ],
      frictionPoints: [
        "Pri siroke nabidce je pro navstevnika tezke rychle se zorientovat a neproklikavat se zbytecne.",
        "Klasicke listingy a filtry mohou byt pomalejsi pro cloveka, ktery si teprve upresnuje poptavku.",
        "Rozhodovani mezi koupi, pronajmem, lokalitou a typem nemovitosti umi zbytecne natahovat cestu ke kontaktu.",
        "Bez prvniho navedeni muze navstevnik odejit driv, nez se dostane k relevantni nabidce.",
      ],
      upsell: [
        "AI vrstva umi prelozit volne napsanou poptavku na spravnou cast nabidky jeste pred filtraci.",
        "Umi rozlisit, zda je vhodny shortlist, kontakt na maklere nebo poptavkovy formular.",
        "Umi snizit zahlceni navstevnika pri velkem poctu listingu.",
      ],
      phaseOne: [
        "Nasadit AI vrstvu jako prvni vstup pred filtry a hlavnim listingem.",
        "Prekladat intent do lokality, typu nemovitosti a dalsiho kroku.",
        "Merit, zda se zkrati cas k prvni relevantni nabidce a k odeslani poptavky.",
      ],
      flows: [
        {
          user_intent: "Hledam dvoupokojovy byt k pronajmu v Kosicich.",
          ai_action: "AI vrstva rozpozna pronajem, lokalitu a typ bytu a navede navstevnika na spravnou cast nabidky.",
          business_value: "Mene bloudeni ve velkem poctu nabidek a rychlejsi shortlist.",
        },
        {
          user_intent: "Chci prodat dum a nevim, co je nejlepsi udelat jako prvni.",
          ai_action: "Web navrhne spravny poptavkovy krok nebo kontakt podle typu nemovitosti a lokality.",
          business_value: "Vyssi pravdepodobnost, ze navstevnik odesle relevantni poptavku.",
        },
        {
          user_intent: "Hledam investicni nemovitost s dobrym potencialem.",
          ai_action: "AI vrstva navrhne vhodny smer v nabidce a nabidne dalsi kontakt pro upresneni zameru.",
          business_value: "Lepse smerovani na relevantni nabidky a dalsi obchodni krok.",
        },
      ],
    },
  },
  "directreal.sk": {
    sk: {
      summary:
        "Tento web ma velmi silny potencial pre AI vrstvu. Pri sieti sluzieb, maklerov a sirsom realitnom procese vie AI vrstva kvalifikovat zaujem este pred kontaktom a urychlit cestu od intentu k spravnej ponuke alebo dopytu.",
      siteType: "full-service real estate network web",
      whyFit: [
        "Siet maklerov a sluzieb vytvara viac vstupnych ciest, kde sa oplati intent-based navigacia.",
        "Navstevnik casto nevie, ci potrebuje ponuku, predajnu sluzbu, poradenstvo alebo kontakt.",
        "AI vrstva nad webom vie kvalifikovat zaujem este pred kontaktom bez zmeny lead form flowu.",
        "Najvacsia prilezitost je zjednodusit routing medzi intentom a spravnou castou realitneho procesu.",
      ],
      frictionPoints: [
        "Sirsi realitny proces vytvara viac miest, kde navstevnik nevie, kam ma pokracovat.",
        "Rozhodovanie medzi kupou, predajom, prenajmom a maklerom byva na prvom vstupe nejasne.",
        "Bez kvalifikacie sa cast kontaktov dostava neskoro alebo na nespravne miesto.",
        "Volne napisany zamer sa v klasickej navigacii tazko preklada na dalsi krok.",
      ],
      upsell: [
        "AI vrstva vie kvalifikovat, ci je vhodny makler, ponuka alebo dopytovy formular.",
        "Vie zrychlit prechod od prveho zameru k spravnej realitnej sluzbe.",
        "Vie zlepsit relevanciu inbound kontaktov bez zasahu do existujuceho webu.",
      ],
      phaseOne: [
        "Nasadit AI vrstvu na hlavne vstupne stranky pre kupu, predaj, prenajom a kontakt.",
        "Pouzit intent routing na presmerovanie k spravnej sluzbe, maklerovi alebo formularu.",
        "Merat kvalitu leadov a podiel navstevnikov, ktori prechadzaju ku kontaktu rychlejsie.",
      ],
      flows: [
        {
          user_intent: "Chcem predat byt a potrebujem vediet, aky je dalsi krok.",
          ai_action: "AI vrstva rozpozna predajny intent a navedie navstevnika na spravneho maklera alebo dopyt.",
          business_value: "Rychlejsi prechod od zaujmu ku kvalifikovanemu kontaktu.",
        },
        {
          user_intent: "Hladam rodinny dom a neviem, kde zacat.",
          ai_action: "Web prelozi zamer na relevantnu cast ponuky a odporuci dalsie spresnenie.",
          business_value: "Vyssia relevancia ponuk a menej odchodov bez interakcie.",
        },
        {
          user_intent: "Potrebujem sa poradit o investicnej nehnutelnosti.",
          ai_action: "AI vrstva rozlisi konzultacny intent a posle navstevnika na vhodny kontakt alebo formular.",
          business_value: "Lepse smerovanie hodnotnejsich dopytov.",
        },
      ],
    },
    cs: {
      summary:
        "Tento web ma velmi silny potencial pro AI vrstvu. U site sluzeb, makleru a sirsiho realitniho procesu umi AI vrstva kvalifikovat zajem jeste pred kontaktem a urychlit cestu od intentu ke spravne nabidce nebo poptavce.",
      siteType: "full-service real estate network web",
      whyFit: [
        "Sit makleru a sluzeb vytvari vice vstupnich cest, kde se vyplati intent-based navigace.",
        "Navstevnik casto nevi, zda potrebuje nabidku, prodejni sluzbu, poradenstvi nebo kontakt.",
        "AI vrstva nad webem umi kvalifikovat zajem jeste pred kontaktem bez zmeny lead form flowu.",
        "Nejvetsi prilezitost je zjednodusit routing mezi intentem a spravnou casti realitniho procesu.",
      ],
      frictionPoints: [
        "Sirsi realitni proces vytvari vice mist, kde navstevnik nevi, kam ma pokracovat.",
        "Rozhodovani mezi koupi, prodejem, pronajmem a maklerem byva na prvnim vstupu nejasne.",
        "Bez kvalifikace se cast kontaktu dostava pozde nebo na nespravne misto.",
        "Volne napsany zamer se v klasicke navigaci tezko preklada na dalsi krok.",
      ],
      upsell: [
        "AI vrstva umi kvalifikovat, zda je vhodny makler, nabidka nebo poptavkovy formular.",
        "Umi urychlit prechod od prvniho zameru ke spravne realitni sluzbe.",
        "Umi zlepsit relevanci inbound kontaktu bez zasahu do existujiciho webu.",
      ],
      phaseOne: [
        "Nasadit AI vrstvu na hlavni vstupni stranky pro koupi, prodej, pronajem a kontakt.",
        "Pouzit intent routing k presmerovani ke spravne sluzbe, makleri nebo formulari.",
        "Merit kvalitu leadu a podil navstevniku, kteri prechazeji ke kontaktu rychleji.",
      ],
      flows: [
        {
          user_intent: "Chci prodat byt a potrebuji vedet, jaky je dalsi krok.",
          ai_action: "AI vrstva rozpozna prodejni intent a navede navstevnika na spravneho maklere nebo poptavku.",
          business_value: "Rychlejsi prechod od zajmu ke kvalifikovanemu kontaktu.",
        },
        {
          user_intent: "Hledam rodinny dum a nevim, kde zacit.",
          ai_action: "Web prelozi zamer na relevantni cast nabidky a doporuci dalsi upresneni.",
          business_value: "Vyssi relevance nabidek a mene odchodu bez interakce.",
        },
        {
          user_intent: "Potrebuji se poradit o investicni nemovitosti.",
          ai_action: "AI vrstva rozlisi konzultacni intent a posle navstevnika na vhodny kontakt nebo formular.",
          business_value: "Lepse smerovani hodnotnejsich poptavek.",
        },
      ],
    },
  },
  "lexxus.sk": {
    sk: {
      summary:
        "Tento web ma velmi silny potencial pre AI vrstvu. Pri premiovejsom vybere bytov, domov, komercnych priestorov a developerskych projektov vie AI vrstva zjednodusit rozhodovanie podla zameru klienta a urychlit prechod k relevantnej ponuke alebo konzultacii.",
      siteType: "premium real estate and development projects web",
      whyFit: [
        "Premiovejsia ponuka a viac kategorii nehnutelnosti vytvaraju silny priestor pre personalizovanu AI navigaciu.",
        "Navstevnik casto porovnava projekt, typ nehnutelnosti, lokalitu a investicny zamer naraz.",
        "AI vrstva nad webom vie odlisit, ci klient hlada byvanie, komercny priestor alebo developersku prilezitost.",
        "Najvacsia prilezitost je zjednodusit rozhodovanie bez potreby menit existujuci web alebo lead flow.",
      ],
      frictionPoints: [
        "Vyssi pocet rozhodovacich kriterii robi prvy krok pre klienta narocnejsim.",
        "Pri premiovej ponuke je dolezite rychlo rozpoznat, ci ide o byvanie, investiciu alebo komercny dopyt.",
        "Bez intent vrstvy moze navstevnik dlho porovnavat a odlozit kontakt.",
        "Klasicke filtre nevysvetlia, ktora cesta je pre klienta najvhodnejsia.",
      ],
      upsell: [
        "AI vrstva vie navrhnut spravny smer medzi bytmi, domami, komercnymi priestormi a projektmi.",
        "Vie urychlit prechod k relevantnej konzultacii alebo ponuke podla zameru klienta.",
        "Vie zachytit aj menej explicitny dopyt, ked navstevnik opisuje potrebu, nie filter.",
      ],
      phaseOne: [
        "Nasadit AI vrstvu nad vstup do premiovej ponuky a developerskych projektov.",
        "Rozlisovat medzi byvanim, investiciou, komercnym priestorom a konzultacnym intentom.",
        "Merat dopad na mieru kvalitnych dopytov a skratenie cesty ku kontaktu.",
      ],
      flows: [
        {
          user_intent: "Hladam reprezentativny byt v Bratislave na vlastne byvanie.",
          ai_action: "AI vrstva rozpozna premium rezidencny intent a navrhne relevantne ponuky alebo dalsi kontakt.",
          business_value: "Vyssia relevancia shortlistu a rychlejsie rozhodovanie klienta.",
        },
        {
          user_intent: "Zaujima ma developersky projekt alebo investicna prilezitost.",
          ai_action: "Web odlisi investicny a projektovy intent a presmeruje na spravnu cast ponuky.",
          business_value: "Menej nepresnych klikov a viac kvalifikovanych obchodnych dopytov.",
        },
        {
          user_intent: "Hladam komercny priestor a potrebujem sa poradit.",
          ai_action: "AI vrstva smeruje klienta na relevantne kategorie a vhodny konzultacny krok.",
          business_value: "Presnejsie smerovanie hodnotnych kontaktov.",
        },
      ],
    },
    cs: {
      summary:
        "Tento web ma velmi silny potencial pro AI vrstvu. U premium vyberu bytu, domu, komercnich prostoru a developerskych projektu umi AI vrstva zjednodusit rozhodovani podle zameru klienta a urychlit prechod k relevantni nabidce nebo konzultaci.",
      siteType: "premium real estate and development projects web",
      whyFit: [
        "Premium nabidka a vice kategorii nemovitosti vytvareji silny prostor pro personalizovanou AI navigaci.",
        "Navstevnik casto porovnava projekt, typ nemovitosti, lokalitu a investicni zamer najednou.",
        "AI vrstva nad webem umi odlisit, zda klient hleda bydleni, komercni prostor nebo developerskou prilezitost.",
        "Nejvetsi prilezitost je zjednodusit rozhodovani bez nutnosti menit existujici web nebo lead flow.",
      ],
      frictionPoints: [
        "Vyssi pocet rozhodovacich kriterii dela prvni krok pro klienta narocnejsim.",
        "U premium nabidky je dulezite rychle rozpoznat, zda jde o bydleni, investici nebo komercni poptavku.",
        "Bez intent vrstvy muze navstevnik dlouho porovnavat a odlozit kontakt.",
        "Klasicke filtry nevysvetli, ktera cesta je pro klienta nejvhodnejsi.",
      ],
      upsell: [
        "AI vrstva umi navrhnout spravny smer mezi byty, domy, komercnimi prostory a projekty.",
        "Umi urychlit prechod k relevantni konzultaci nebo nabidce podle zameru klienta.",
        "Umi zachytit i mene explicitni poptavku, kdyz navstevnik popisuje potrebu, ne filtr.",
      ],
      phaseOne: [
        "Nasadit AI vrstvu nad vstup do premium nabidky a developerskych projektu.",
        "Rozlisovat mezi bydlenim, investici, komercnim prostorem a konzultacnim intentem.",
        "Merit dopad na miru kvalitnich poptavek a zkraceni cesty ke kontaktu.",
      ],
      flows: [
        {
          user_intent: "Hledam reprezentativni byt v Bratislave pro vlastni bydleni.",
          ai_action: "AI vrstva rozpozna premium rezidencni intent a navrhne relevantni nabidky nebo dalsi kontakt.",
          business_value: "Vyssi relevance shortlistu a rychlejsi rozhodovani klienta.",
        },
        {
          user_intent: "Zajima me developersky projekt nebo investicni prilezitost.",
          ai_action: "Web odlisi investicni a projektovy intent a presmeruje na spravnou cast nabidky.",
          business_value: "Mene nepresnych kliku a vice kvalifikovanych obchodnich poptavek.",
        },
        {
          user_intent: "Hledam komercni prostor a potrebuji se poradit.",
          ai_action: "AI vrstva smeruje klienta na relevantni kategorie a vhodny konzultacni krok.",
          business_value: "Presnejsi smerovani hodnotnych kontaktu.",
        },
      ],
    },
  },
  "winnersreality.sk": {
    sk: {
      summary:
        "Tento web ma velmi silny potencial pre AI vrstvu. Pri celoslovenskom rozsahu a viacerych regionoch vie AI vrstva nad webom rychlo rozlisit lokalitu aj typ dopytu a poslat navstevnika na spravnu ponuku, maklera alebo formular.",
      siteType: "nationwide real estate network web",
      whyFit: [
        "Celoslovensky rozsah a viac regionov vytvaraju silny priestor pre routing podla lokality.",
        "Navstevnik casto neprichadza s hotovou filtraciou, ale s opisom lokality a typu dopytu.",
        "AI vrstva nad webom vie prepajat lokalitu, typ nehnutelnosti a kontaktny ciel do jedneho vstupu.",
        "Najvacsia prilezitost je urychlit smerovanie navstevnika k spravnemu regionu alebo maklerovi.",
      ],
      frictionPoints: [
        "Viac regionov zvysuje sancu, ze navstevnik nevie, kde na webe zacat.",
        "Rozlisit kupu, predaj, prenajom a lokalitu uz na vstupe byva pre navstevnika narocne.",
        "Bez navedenia moze navstevnik skakat medzi regionmi a odlozit kontakt.",
        "Klasicka navigacia nevie dobre pracovat s volne napisanym intentom.",
      ],
      upsell: [
        "AI vrstva vie smerovat navstevnika podla lokality aj typu dopytu v jednom kroku.",
        "Vie rozlisit, ci ma ist o ponuku, maklera alebo dopytovy formular.",
        "Vie zlepsit relevanciu regionnych inbound dopytov.",
      ],
      phaseOne: [
        "Nasadit AI vrstvu na hlavny vstup a na regionne listingove uzly.",
        "Prepajat intent navstevnika s lokalitou, typom nehnutelnosti a dalsim krokom.",
        "Merat, ci sa skrati cesta k spravnemu regionalnemu kontaktu alebo ponuke.",
      ],
      flows: [
        {
          user_intent: "Hladam dom pri Trnave a nechcem prechadzat celu ponuku.",
          ai_action: "AI vrstva rozpozna region a typ nehnutelnosti a navedie navstevnika na spravnu cast webu.",
          business_value: "Menej bludenia medzi regionmi a rychlejsi pristup k relevantnym ponukam.",
        },
        {
          user_intent: "Chcem prenajat byt v inom meste, ale neviem, koho kontaktovat.",
          ai_action: "Web navrhne spravneho regionneho maklera alebo formular podla lokality a typu dopytu.",
          business_value: "Presnejsie smerovanie na spravny obchodny kontakt.",
        },
        {
          user_intent: "Chcem predat nehnutelnost a potrebujem vediet, kam to patri.",
          ai_action: "AI vrstva prevedie navstevnika do spravneho regionalneho a procesneho vstupu.",
          business_value: "Vyssia pravdepodobnost odoslania relevantneho dopytu.",
        },
      ],
    },
    cs: {
      summary:
        "Tento web ma velmi silny potencial pro AI vrstvu. U celoslovenskeho rozsahu a vice regionu umi AI vrstva nad webem rychle rozlisit lokalitu i typ poptavky a poslat navstevnika na spravnou nabidku, maklere nebo formular.",
      siteType: "nationwide real estate network web",
      whyFit: [
        "Celoslovensky rozsah a vice regionu vytvareji silny prostor pro routing podle lokality.",
        "Navstevnik casto neprichazi s hotovou filtraci, ale s popisem lokality a typu poptavky.",
        "AI vrstva nad webem umi propojovat lokalitu, typ nemovitosti a kontaktni cil do jednoho vstupu.",
        "Nejvetsi prilezitost je urychlit smerovani navstevnika ke spravnemu regionu nebo makleri.",
      ],
      frictionPoints: [
        "Vice regionu zvysuje sanci, ze navstevnik nevi, kde na webu zacit.",
        "Rozlisit koupi, prodej, pronajem a lokalitu uz na vstupu byva pro navstevnika narocne.",
        "Bez navedeni muze navstevnik skakat mezi regiony a odlozit kontakt.",
        "Klasicka navigace neumi dobre pracovat s volne napsanym intentem.",
      ],
      upsell: [
        "AI vrstva umi smerovat navstevnika podle lokality i typu poptavky v jednom kroku.",
        "Umi rozlisit, zda ma jit o nabidku, maklere nebo poptavkovy formular.",
        "Umi zlepsit relevanci regionalnich inbound poptavek.",
      ],
      phaseOne: [
        "Nasadit AI vrstvu na hlavni vstup a na regionalni listingove uzly.",
        "Propojovat intent navstevnika s lokalitou, typem nemovitosti a dalsim krokem.",
        "Merit, zda se zkrati cesta ke spravnemu regionalnimu kontaktu nebo nabidce.",
      ],
      flows: [
        {
          user_intent: "Hledam dum u Trnavy a nechci prochazet celou nabidku.",
          ai_action: "AI vrstva rozpozna region a typ nemovitosti a navede navstevnika na spravnou cast webu.",
          business_value: "Mene bloudeni mezi regiony a rychlejsi pristup k relevantnim nabidkam.",
        },
        {
          user_intent: "Chci pronajmout byt v jinem meste, ale nevim, koho kontaktovat.",
          ai_action: "Web navrhne spravneho regionalniho maklere nebo formular podle lokality a typu poptavky.",
          business_value: "Presnejsi smerovani na spravny obchodni kontakt.",
        },
        {
          user_intent: "Chci prodat nemovitost a potrebuji vedet, kam to patri.",
          ai_action: "AI vrstva provede navstevnika do spravneho regionalniho a procesniho vstupu.",
          business_value: "Vyssi pravdepodobnost odeslani relevantni poptavky.",
        },
      ],
    },
  },
  "rivers.sk": {
    sk: {
      summary:
        "Tento web ma velmi silny potencial pre AI vrstvu. Pri premiovom byvani, investicnych nehnutelnostiach, domoch a bytoch vie AI vrstva rychlo rozlisit, ci klient hlada byvanie, investiciu alebo konzultaciu, a premenit intent na spravny obchodny krok.",
      siteType: "premium residential and investment real estate web",
      whyFit: [
        "Premiove byvanie a investicne nehnutelnosti vytvaraju vyssi narok na vedenie navstevnika podla zameru.",
        "Klient casto nevstupuje cez jednoduchy filter, ale cez potrebu, prioritu alebo investicny scenar.",
        "AI vrstva nad webom vie odlisit byvanie, investiciu a konzultaciu bez narusenia existujuceho webu.",
        "Najvacsia prilezitost je skratit rozhodovanie a smerovat klienta na spravnu ponuku alebo kontakt.",
      ],
      frictionPoints: [
        "Rozdiel medzi byvanim, investiciou a premium konzultaciou nemusi byt na prvy klik zrejmy.",
        "Vyssia hodnota dopytu znamena, ze kvalifikacia intentu je dolezita este pred kontaktom.",
        "Bez prveho navedenia moze klient dlho porovnavat a neprejst k akcii.",
        "Klasicke listingove filtre nevysvetlia vhodny dalsi krok podla motivacie klienta.",
      ],
      upsell: [
        "AI vrstva vie smerovat klienta na byvanie, investicnu ponuku alebo konzultaciu podla intentu.",
        "Vie priradit spravny kontakt bez zmeny lead form flowu.",
        "Vie zvysit relevanciu high-value dopytov v premium segmente.",
      ],
      phaseOne: [
        "Nasadit AI vrstvu nad premium vstupy do ponuky a investicne stranky.",
        "Rozlisovat intent medzi byvanim, investiciou a konzultacnym scenarom.",
        "Merat skratenie cesty ku kontaktu a kvalitu premium dopytov.",
      ],
      flows: [
        {
          user_intent: "Hladam premium byt na byvanie v Bratislave.",
          ai_action: "AI vrstva rozpozna rezidencny intent a posle klienta na relevantne ponuky alebo dalsi kontakt.",
          business_value: "Vyssia relevancia ponuk a rychlejsia cesta k obhliadke alebo dopytu.",
        },
        {
          user_intent: "Zaujima ma investicna nehnutelnost s potencialom vynosu.",
          ai_action: "Web rozlisi investicny intent a navrhne vhodne listingy alebo konzultacny krok.",
          business_value: "Lepsie smerovanie hodnotnych dopytov na relevantny obchodny funnel.",
        },
        {
          user_intent: "Potrebujem sa poradit, ci hladam byvanie alebo investiciu.",
          ai_action: "AI vrstva polozi kratke kvalifikacne otazky a nasmeruje klienta na spravnu cestu.",
          business_value: "Menej nerozhodnych odchodov a viac kvalifikovanych kontaktov.",
        },
      ],
    },
    cs: {
      summary:
        "Tento web ma velmi silny potencial pro AI vrstvu. U premium bydleni, investicnich nemovitosti, domu a bytu umi AI vrstva rychle rozlisit, zda klient hleda bydleni, investici nebo konzultaci, a premenit intent na spravny obchodni krok.",
      siteType: "premium residential and investment real estate web",
      whyFit: [
        "Premium bydleni a investicni nemovitosti vytvareji vyssi narok na vedeni navstevnika podle zameru.",
        "Klient casto nevstupuje pres jednoduchy filtr, ale pres potrebu, prioritu nebo investicni scenar.",
        "AI vrstva nad webem umi odlisit bydleni, investici a konzultaci bez naruseni existujiciho webu.",
        "Nejvetsi prilezitost je zkratit rozhodovani a smerovat klienta na spravnou nabidku nebo kontakt.",
      ],
      frictionPoints: [
        "Rozdil mezi bydlenim, investici a premium konzultaci nemusi byt na prvni klik zrejmy.",
        "Vyssi hodnota poptavky znamena, ze kvalifikace intentu je dulezita jeste pred kontaktem.",
        "Bez prvniho navedeni muze klient dlouho porovnavat a neprejit k akci.",
        "Klasicke listingove filtry nevysvetli vhodny dalsi krok podle motivace klienta.",
      ],
      upsell: [
        "AI vrstva umi smerovat klienta na bydleni, investicni nabidku nebo konzultaci podle intentu.",
        "Umi priradit spravny kontakt bez zmeny lead form flowu.",
        "Umi zvysit relevanci high-value poptavek v premium segmentu.",
      ],
      phaseOne: [
        "Nasadit AI vrstvu nad premium vstupy do nabidky a investicni stranky.",
        "Rozlisovat intent mezi bydlenim, investici a konzultacnim scenarem.",
        "Merit zkraceni cesty ke kontaktu a kvalitu premium poptavek.",
      ],
      flows: [
        {
          user_intent: "Hledam premium byt pro bydleni v Bratislave.",
          ai_action: "AI vrstva rozpozna rezidencni intent a posle klienta na relevantni nabidky nebo dalsi kontakt.",
          business_value: "Vyssi relevance nabidek a rychlejsi cesta k prohlidce nebo poptavce.",
        },
        {
          user_intent: "Zajima me investicni nemovitost s potencialem vynosu.",
          ai_action: "Web rozlisi investicni intent a navrhne vhodne listingy nebo konzultacni krok.",
          business_value: "Lepse smerovani hodnotnych poptavek na relevantni obchodni funnel.",
        },
        {
          user_intent: "Potrebuji poradit, zda hledam bydleni nebo investici.",
          ai_action: "AI vrstva polozi kratke kvalifikacni otazky a nasmeruje klienta na spravnou cestu.",
          business_value: "Mene nerozhodnych odchodu a vice kvalifikovanych kontaktu.",
        },
      ],
    },
  },
  "arec.sk": {
    sk: {
      summary:
        "Tento web ma velmi silny potencial pre AI vrstvu. Pri bratislavskom realitnom vybere a viacerych kategoriach ponuk vie AI vrstva fungovat ako jednoduchsi prvy kontakt pre nerozhodnuteho navstevnika a urychlit cestu od intentu k ponuke alebo dopytu.",
      siteType: "bratislava real estate listings web",
      whyFit: [
        "Bratislavsky realitny vyber a viac kategorii ponuk vytvaraju priestor pre rychlu intent navigaciu.",
        "Navstevnik casto neprichadza s presnym filtrom, ale s potrebou, lokalitou alebo typom byvania.",
        "AI vrstva nad webom vie byt jednoduchsi prvy kontakt pre nerozhodnuteho navstevnika.",
        "Najvacsia prilezitost je naviest klienta na spravnu kategoriu, ponuku alebo dopyt bez zbytocneho hladania.",
      ],
      frictionPoints: [
        "Pri viacerych kategoriach ponuk nie je vzdy jasne, kde ma navstevnik zacat.",
        "Rozhodovanie medzi lokalitou, typom nehnutelnosti a dalsim krokom sa moze zbytocne natahovat.",
        "Nerozhodnuty navstevnik potrebuje jemne navedenie skor, nez sa dostane k formularu.",
        "Klasicka navigacia slabsie pracuje s intentom napisanym prirodzenym jazykom.",
      ],
      upsell: [
        "AI vrstva vie naviest na spravnu kategoriu ponuky podla lokality a typu zameru.",
        "Vie odlisit, ci je vhodny listing, makler alebo dopytovy formular.",
        "Vie zjednodusit prvy kontakt pre klienta, ktory este len spresnuje potrebu.",
      ],
      phaseOne: [
        "Nasadit AI vrstvu nad vstup do bratislavskej ponuky a klucove kategorizacne body.",
        "Prekladat volne napisany zamer na spravnu kategoriu, ponuku alebo kontakt.",
        "Merat, ci sa skrati cesta od prveho intentu k relevantnej dopytovej akcii.",
      ],
      flows: [
        {
          user_intent: "Hladam byt v Bratislave, ale neviem, ktora cast mesta mi dava zmysel.",
          ai_action: "AI vrstva rozpozna potrebu a navrhne relevantne smery v ponuke alebo dalsi kontakt.",
          business_value: "Lepsia orientacia v ponuke a vyssia sanca na kvalifikovany dopyt.",
        },
        {
          user_intent: "Chcem prenajat nehnutelnost a neviem, kam kliknut.",
          ai_action: "Web navrhne spravnu kategoriu a vhodny dalsi krok podla typu dopytu.",
          business_value: "Menej odchodov bez interakcie a rychlejsi prechod ku kontaktu.",
        },
        {
          user_intent: "Potrebujem poradit, co je pre mna relevantna ponuka.",
          ai_action: "AI vrstva funguje ako prvy kontakt, ktory intent prelozi na spravnu cast webu.",
          business_value: "Vyssia relevancia navrhov a menej nerozhodnych navstevnikov.",
        },
      ],
    },
    cs: {
      summary:
        "Tento web ma velmi silny potencial pro AI vrstvu. U bratislavskeho realitniho vyberu a vice kategorii nabidek umi AI vrstva fungovat jako jednodussi prvni kontakt pro nerozhodnuteho navstevnika a urychlit cestu od intentu k nabidce nebo poptavce.",
      siteType: "bratislava real estate listings web",
      whyFit: [
        "Bratislavsky realitni vyber a vice kategorii nabidek vytvareji prostor pro rychlou intent navigaci.",
        "Navstevnik casto neprichazi s presnym filtrem, ale s potrebou, lokalitou nebo typem bydleni.",
        "AI vrstva nad webem umi byt jednodussi prvni kontakt pro nerozhodnuteho navstevnika.",
        "Nejvetsi prilezitost je navest klienta na spravnou kategorii, nabidku nebo poptavku bez zbytecneho hledani.",
      ],
      frictionPoints: [
        "Pri vice kategoriich nabidek neni vzdy jasne, kde ma navstevnik zacit.",
        "Rozhodovani mezi lokalitou, typem nemovitosti a dalsim krokem se muze zbytecne natahovat.",
        "Nerozhodnuty navstevnik potrebuje jemne navedeni driv, nez se dostane k formulari.",
        "Klasicka navigace hur pracuje s intentem napsanym prirozenym jazykem.",
      ],
      upsell: [
        "AI vrstva umi navest na spravnou kategorii nabidky podle lokality a typu zameru.",
        "Umi rozlisit, zda je vhodny listing, makler nebo poptavkovy formular.",
        "Umi zjednodusit prvni kontakt pro klienta, ktery si teprve upresnuje potrebu.",
      ],
      phaseOne: [
        "Nasadit AI vrstvu nad vstup do bratislavske nabidky a klicove kategorizacni body.",
        "Prekladat volne napsany zamer na spravnou kategorii, nabidku nebo kontakt.",
        "Merit, zda se zkrati cesta od prvniho intentu k relevantni poptavkove akci.",
      ],
      flows: [
        {
          user_intent: "Hledam byt v Bratislave, ale nevim, ktera cast mesta mi dava smysl.",
          ai_action: "AI vrstva rozpozna potrebu a navrhne relevantni smery v nabidce nebo dalsi kontakt.",
          business_value: "Lepsi orientace v nabidce a vyssi sance na kvalifikovanou poptavku.",
        },
        {
          user_intent: "Chci pronajmout nemovitost a nevim, kam kliknout.",
          ai_action: "Web navrhne spravnou kategorii a vhodny dalsi krok podle typu poptavky.",
          business_value: "Mene odchodu bez interakce a rychlejsi prechod ke kontaktu.",
        },
        {
          user_intent: "Potrebuji poradit, co je pro me relevantni nabidka.",
          ai_action: "AI vrstva funguje jako prvni kontakt, ktery intent prelozi na spravnou cast webu.",
          business_value: "Vyssi relevance navrhu a mene nerozhodnych navstevniku.",
        },
      ],
    },
  },
  "remax-slovakia.sk": {
    sk: {
      summary:
        "Tento web ma velmi silny potencial pre AI vrstvu. Pri velkej znacke a fransizovom modeli vie AI vrstva nad webom pomoct smerovat zaujemcu na spravnu kancelariu, maklera alebo dopyt a spravit z intentu okamzitu akciu.",
      siteType: "franchise real estate network web",
      whyFit: [
        "Velka znacka a fransizovy model vytvaraju viac routingovych bodov medzi regionom, kancelariou a maklerom.",
        "Navstevnik casto neprichadza s presnym kontaktom, ale s potrebou, lokalitou alebo typom dopytu.",
        "AI vrstva nad webom vie prirodzene nasmerovat na spravnu kancelariu, maklera alebo dopytovy formular.",
        "Najvacsia prilezitost je zrychlit smerovanie inboundu bez zmeny existujuceho lead flowu.",
      ],
      frictionPoints: [
        "Pri fransizovom modeli nie je pre navstevnika vzdy zrejme, ktora kancelaria alebo kontakt je relevantny.",
        "Rozhodovanie medzi ponukou, lokalitou, predajom a kontaktom vie spomalit prvy krok.",
        "Bez intent vrstvy sa moze dopyt dostat na menej vhodne miesto.",
        "Klasicka navigacia nevie sama dobre kvalifikovat volne napisany zamer.",
      ],
      upsell: [
        "AI vrstva vie rozlisit, ci ma ist navstevnik na kancelariu, maklera, listing alebo dopyt.",
        "Vie zjednodusit routing v ramci znacky s viacerymi pobockami a maklermi.",
        "Vie zlepsit relevanciu inbound dopytov este pred odoslanym formularom.",
      ],
      phaseOne: [
        "Nasadit AI vrstvu na hlavny vstup, kontaktne body a klucove regionalne vetvy webu.",
        "Pouzit intent routing na priradenie spravnej kancelarie, maklera alebo formulara.",
        "Merat, ci sa skrati cesta od prveho zameru ku kvalifikovanemu kontaktu.",
      ],
      flows: [
        {
          user_intent: "Hladam maklera pre predaj bytu v konkretnom meste.",
          ai_action: "AI vrstva rozpozna lokalitu a predajny intent a posle navstevnika na spravnu kancelariu alebo maklera.",
          business_value: "Presnejsie smerovanie inboundu a menej zbytocnych presmerovani.",
        },
        {
          user_intent: "Chcem kupit dom a potrebujem sa zorientovat v ponuke.",
          ai_action: "Web navrhne relevantnu cast ponuky a vhodny dalsi kontakt podla lokality a typu dopytu.",
          business_value: "Rychlejsi prechod od intentu k relevantnej ponuke alebo dopytu.",
        },
        {
          user_intent: "Neviem, ci mam hladat kancelariu alebo rovno vypisat dopyt.",
          ai_action: "AI vrstva polozi kratke kvalifikacne otazky a navrhne najlepsi dalsi krok.",
          business_value: "Menej nerozhodnych odchodov a vyssia kvalita leadov.",
        },
      ],
    },
    cs: {
      summary:
        "Tento web ma velmi silny potencial pro AI vrstvu. U velke znacky a fransizoveho modelu umi AI vrstva nad webem pomoct smerovat zajemce na spravnou kancelar, maklere nebo poptavku a udelat z intentu okamzitou akci.",
      siteType: "franchise real estate network web",
      whyFit: [
        "Velka znacka a fransizovy model vytvareji vice routingovych bodu mezi regionem, kancelari a maklerem.",
        "Navstevnik casto neprichazi s presnym kontaktem, ale s potrebou, lokalitou nebo typem poptavky.",
        "AI vrstva nad webem umi prirozene nasmerovat na spravnou kancelar, maklere nebo poptavkovy formular.",
        "Nejvetsi prilezitost je urychlit smerovani inboundu bez zmeny existujiciho lead flowu.",
      ],
      frictionPoints: [
        "U fransizoveho modelu neni pro navstevnika vzdy zrejme, ktera kancelar nebo kontakt je relevantni.",
        "Rozhodovani mezi nabidkou, lokalitou, prodejem a kontaktem umi zpomalit prvni krok.",
        "Bez intent vrstvy se muze poptavka dostat na mene vhodne misto.",
        "Klasicka navigace neumi sama dobre kvalifikovat volne napsany zamer.",
      ],
      upsell: [
        "AI vrstva umi rozlisit, zda ma jit navstevnik na kancelar, maklere, listing nebo poptavku.",
        "Umi zjednodusit routing v ramci znacky s vice pobockami a makleri.",
        "Umi zlepsit relevanci inbound poptavek jeste pred odeslanim formularu.",
      ],
      phaseOne: [
        "Nasadit AI vrstvu na hlavni vstup, kontaktni body a klicove regionalni vetve webu.",
        "Pouzit intent routing k prirazeni spravne kancelare, maklere nebo formulari.",
        "Merit, zda se zkrati cesta od prvniho zameru ke kvalifikovanemu kontaktu.",
      ],
      flows: [
        {
          user_intent: "Hledam maklere pro prodej bytu v konkretnim meste.",
          ai_action: "AI vrstva rozpozna lokalitu a prodejni intent a posle navstevnika na spravnou kancelar nebo maklere.",
          business_value: "Presnejsi smerovani inboundu a mene zbytecnych presmerovani.",
        },
        {
          user_intent: "Chci koupit dum a potrebuji se zorientovat v nabidce.",
          ai_action: "Web navrhne relevantni cast nabidky a vhodny dalsi kontakt podle lokality a typu poptavky.",
          business_value: "Rychlejsi prechod od intentu k relevantni nabidce nebo poptavce.",
        },
        {
          user_intent: "Nevim, jestli mam hledat kancelar nebo rovnou vyplnit poptavku.",
          ai_action: "AI vrstva polozi kratke kvalifikacni otazky a navrhne nejlepsi dalsi krok.",
          business_value: "Mene nerozhodnych odchodu a vyssi kvalita leadu.",
        },
      ],
    },
  },
};

// TODO: Add "Realitne kancelarie Slovenska" domain override here once the canonical domain
// is confirmed in the repo, to avoid introducing a broken or wrong domain entry.

function createRealtyAudit(override: RealtyDomainOverride, locale: SiteLocale): SiteAudit {
  const content = override[locale];

  return siteAuditSchema.parse({
    score: 10,
    is_good_fit: true,
    site_type: content.siteType,
    recommended_ai_type: ["navigator", "recommender", "lead qualifier"],
    summary: content.summary,
    why_fit: content.whyFit,
    friction_points: content.frictionPoints,
    upsell_opportunities: content.upsell,
    phase_one_plan: content.phaseOne,
    example_user_flows: content.flows,
  });
}

export function getDomainAuditOverride(inputUrl: string, locale: SiteLocale = "sk"): SiteAudit | null {
  const normalizedDomain = getNormalizedDomain(inputUrl);

  if (normalizedDomain === "bendalabs.sk") {
    return createBendaLabsAudit(locale);
  }

  if (normalizedDomain === "bazos.sk") {
    return createBazosAudit(locale);
  }

  const realtyOverride = normalizedDomain ? realtyDomainOverrides[normalizedDomain] : null;

  if (!realtyOverride) {
    return null;
  }

  return createRealtyAudit(realtyOverride, locale);
}
