export const automationModules = [
  {
    id: "dokumenty", number: "01", title: "Zmluvy a dokumenty", shortTitle: "Dokumenty",
    setup: 350, monthly: 5, totalSetup: 500, totalMonthly: 24.5,
    description: "Údaje zadáte raz. Systém z nich pripraví zmluvu alebo dokument podľa vašej schválenej šablóny.",
    input: "Údaje klienta + vaša šablóna", output: "Dokument pripravený na kontrolu",
    scope: ["3 vaše šablóny, do 15 polí na šablónu", "Jeden dohodnutý postup vytvárania", "Do 300 dokumentov mesačne"],
    question: "Aké zmluvy alebo dokumenty vytvárate?", placeholder: "Napr. zmluvy o dielo, objednávky, odovzdávacie protokoly…",
  },
  {
    id: "spracovanie", number: "02", title: "Spracovanie dokumentov", shortTitle: "Spracovanie",
    setup: 450, monthly: 20, totalSetup: 600, totalMonthly: 39.5,
    description: "Nahrajte PDF, sken alebo fotografiu. Systém načíta potrebné údaje a pripraví ich na kontrolu a ďalšie použitie.",
    input: "PDF, sken alebo fotografia", output: "Údaje na potvrdenie a vyplnenie",
    scope: ["1 opakujúci sa typ dokumentu, do 15 polí", "Jeden dohodnutý výstup", "Do 100 dokumentov a 500 strán mesačne"],
    question: "Z čoho dnes ručne prepisujete údaje?", placeholder: "Napr. dodacie listy do tabuľky, údaje zo zmlúv do formulára…",
  },
  {
    id: "prilezitosti", number: "03", title: "Vyhľadávanie príležitostí", shortTitle: "Príležitosti",
    setup: 350, monthly: 30, totalSetup: 500, totalMonthly: 49.5,
    description: "Systém priebežne sleduje dohodnuté zdroje a zhromažďuje zákazky, ktoré zodpovedajú tomu, čo vaša firma robí.",
    input: "Profil firmy + dohodnuté zdroje", output: "Prehľad relevantných zákaziek",
    scope: ["1 profil firmy, jeden trh a jazyk", "Do 3 vopred overených zdrojov", "Kontrola zdrojov raz denne"],
    question: "Aké zákazky a v akom regióne hľadáte?", placeholder: "Napr. elektroinštalácie pre firmy, západné Slovensko…",
  },
] as const;

export type AutomationModuleId = (typeof automationModules)[number]["id"];
export const automationBase = { setup: 150, monthly: 19.5 };

export function getAutomationQuote(ids: readonly AutomationModuleId[]) {
  const selected = automationModules.filter(module => ids.includes(module.id));
  return {
    setup: selected.length ? automationBase.setup + selected.reduce((sum, module) => sum + module.setup, 0) : 0,
    monthly: selected.length ? automationBase.monthly + selected.reduce((sum, module) => sum + module.monthly, 0) : 0,
  };
}

export function euro(amount: number) {
  return new Intl.NumberFormat("sk-SK", { style: "currency", currency: "EUR", maximumFractionDigits: amount % 1 ? 2 : 0 }).format(amount);
}

export function readAutomationModules(value: string | string[] | undefined): AutomationModuleId[] {
  const requested = (Array.isArray(value) ? value[0] : value)?.split(",") ?? [];
  return automationModules.filter(module => requested.includes(module.id)).map(module => module.id);
}
