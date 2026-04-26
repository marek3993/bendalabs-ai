import type { SiteLocale } from "@/lib/bendalabs/site-content";
import { getNormalizedDomain } from "@/lib/leads/domain";
import { siteAuditSchema, type SiteAudit } from "@/lib/site-audit/schema";

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
    demo_override: "bazos",
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

  if (normalizedDomain !== "bazos.sk") {
    return null;
  }

  return createBazosAudit(locale);
}
