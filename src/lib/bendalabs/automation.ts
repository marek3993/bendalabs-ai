export const automationModules = [
  {
    id: "dokumenty", number: "01", title: "Automatizácia firemných dokumentov", shortTitle: "Dokumenty",
    setup: 350, monthly: 25, totalSetup: 500, totalMonthly: 44.5,
    description: "Systém načíta údaje z dokladov a doplní ich do vašich zmlúv, dodatkov a formulárov. Údaje zostanú uložené pre ďalšie použitie.",
    input: "Doklady a vaše firemné vzory", output: "Vyplnené dokumenty z uložených údajov",
    benefits: ["Načítanie údajov z OP, živnostenského oprávnenia a ďalších podkladov", "Profil zamestnanca, klienta alebo firmy s uloženými údajmi", "Nástupné dokumenty, zmluvy aj personalizované dodatky", "Vaše šablóny a história dokumentov na jednom mieste"],
    question: "Ktoré dokumenty chcete pripravovať automaticky?", placeholder: "Napr. pri nástupe zamestnanca načítať údaje z OP a pripraviť zmluvu aj ostatné nástupné dokumenty…",
    choiceDescription: "Načítanie dokladov, uložené údaje, zmluvy a dodatky",
  },
  {
    id: "prilezitosti", number: "02", title: "Vyhľadávanie zákaziek", shortTitle: "Príležitosti",
    setup: 350, monthly: 30, totalSetup: 500, totalMonthly: 49.5,
    description: "Systém vyhľadáva zákazky podľa zamerania vašej firmy a ku každej pripraví návrh e-mailu na oslovenie potenciálneho klienta.",
    input: "Váš odbor, región a typ zákaziek", output: "Relevantné príležitosti v jednom prehľade",
    benefits: ["Vyhľadávanie podľa služieb a zamerania vašej firmy", "Pravidelné sledovanie dohodnutých zdrojov", "Odkaz na zadanie, dostupné podmienky a kontakt", "Automaticky pripravený oslovovací e-mail k zákazke"],
    question: "Aké zákazky a v akom regióne hľadáte?", placeholder: "Napr. elektroinštalácie pre firmy, západné Slovensko…",
    choiceDescription: "Vyhľadanie zákaziek a príprava oslovovacích e-mailov",
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
  const requested = ((Array.isArray(value) ? value[0] : value)?.split(",") ?? []).map(id => id === "spracovanie" ? "dokumenty" : id);
  return automationModules.filter(module => requested.includes(module.id)).map(module => module.id);
}
