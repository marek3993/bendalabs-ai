import { getNormalizedDomain } from "@/lib/leads/domain";
import { siteAuditSchema, type SiteAudit } from "@/lib/site-audit/schema";

function createBazosAudit(): SiteAudit {
  return siteAuditSchema.parse({
    score: 10,
    is_good_fit: true,
    demo_override: "bazos",
    site_type: "classifieds marketplace",
    recommended_ai_type: ["navigator", "recommender", "lead qualifier"],
    summary:
      "Bazos je velmi silny kandidat pre AI vrstvu, pretoze pouzivatel casto neprichadza s presnym nazvom kategorie ani produktu, ale s volne napisanym zamerom. AI vrstva by vedela zrychlit vyhladavanie, pomoct pri spravnom zaradeni inzeratu a zjednodusit cestu k spravnemu vysledku bez potreby prestavby samotneho webu.",
    why_fit: [
      "Pouzivatelia hladaju veci prirodzene, nie podla presneho nazvu rubriky.",
      "Web je silne zalozeny na kategoriach, vyhladavani a orientacii v ponuke.",
      "AI vrstva moze pomoct pri hladani aj pri pridavani inzeratu.",
      "Velky potencial je v pochopeni volne napisaneho dopytu a spravnom nasmerovani pouzivatela.",
    ],
    friction_points: [
      "Pouzivatel nemusi poznat spravnu kategoriu alebo presny nazov produktu.",
      "Pri vyhladavani sa moze stratit medzi rubrikami a roznymi pomenovaniami toho isteho produktu.",
      "Pri pridavani inzeratu nemusi vediet, kam ho spravne zaradit.",
      "Pri probleme alebo nejasnosti nemusi vediet, kam pokracovat.",
    ],
    upsell_opportunities: [
      "Odporucanie presnejsej alebo vhodnejsej kategorie podla zameru pouzivatela.",
      "Lepse nasmerovanie pri pridavani inzeratu.",
      "Presnejsie vyhladavanie aj pri nepresnom alebo ludovom nazve produktu.",
    ],
    phase_one_plan: [
      "Nasadit AI vrstvu nad vyhladavanie a kategorie.",
      "Pomoct pouzivatelovi z volnej vety najst spravnu rubriku alebo vysledky.",
      "Pridat pomoc pri zaradeni noveho inzeratu do spravnej kategorie.",
      "Merat, ktore typy dopytov sa opakuju a kde sa pouzivatelia najcastejsie zaseknu.",
    ],
    example_user_flows: [
      {
        user_intent: "hladam lacny vozik za auto",
        ai_action:
          "AI vrstva pochopi zamer a posle pouzivatela do spravnej kategorie s vhodnejsim vyhladavacim dotazom.",
        business_value:
          "Rychlejsie najdenie spravnych inzeratov bez bludenia medzi rubrikami.",
      },
      {
        user_intent: "predavam gauc, kam to zaradit?",
        ai_action:
          "AI vrstva odporuci spravnu kategoriu a dalsi krok pri pridavani inzeratu.",
        business_value:
          "Menej chyb pri pridavani inzeratov a jednoduchsie pouzivanie sluzby.",
      },
      {
        user_intent: "potrebujem dodavku na podnikanie",
        ai_action:
          "AI vrstva pouzivatela nasmeruje na spravnu kategoriu a upravi dopyt na relevantnejsie vysledky.",
        business_value:
          "Presnejsie vyhladavanie a vyssia sanca, ze pouzivatel najde spravny vysledok.",
      },
    ],
  });
}

export function getDomainAuditOverride(inputUrl: string): SiteAudit | null {
  const normalizedDomain = getNormalizedDomain(inputUrl);

  if (normalizedDomain !== "bazos.sk") {
    return null;
  }

  return createBazosAudit();
}
