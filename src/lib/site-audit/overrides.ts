import type { SiteLocale } from "@/lib/bendalabs/site-content";
import { getNormalizedDomain } from "@/lib/leads/domain";
import { siteAuditSchema, type SiteAudit } from "@/lib/site-audit/schema";

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

export function getDomainAuditOverride(inputUrl: string, locale: SiteLocale = "sk"): SiteAudit | null {
  const normalizedDomain = getNormalizedDomain(inputUrl);

  if (normalizedDomain === "bendalabs.sk") {
    return createBendaLabsAudit(locale);
  }

  if (normalizedDomain !== "bazos.sk") {
    return null;
  }

  return createBazosAudit(locale);
}
