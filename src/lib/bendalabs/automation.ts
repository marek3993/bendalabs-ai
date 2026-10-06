export const automationModules = [
  {
    id: "dokumenty", number: "01", title: "AI príprava firemných dokumentov", shortTitle: "Dokumenty",
    setup: 350, monthly: 25, totalSetup: 500, totalMonthly: 44.5,
    description: "Nahrajete doklad. AI prečíta údaje a vyplní vaše zmluvy, dodatky aj formuláre. Vy skontrolujete hotové návrhy; pri ďalšom dokumente použijete uložený profil.",
    input: "Doklady a vaše firemné vzory", output: "Vyplnené dokumenty z uložených údajov",
    benefits: ["AI načíta údaje z fotografie alebo PDF dokladu", "Meno, adresu a ďalšie údaje doplní do vašich firemných vzorov", "Návrhy zmlúv, nástupných dokumentov a dodatkov na kontrolu", "Uložené profily, šablóny a história vo vlastnom dashboarde"],
    question: "Ktoré dokumenty chcete pripravovať automaticky?", placeholder: "Napr. pri nástupe zamestnanca načítať údaje z OP a pripraviť zmluvu aj ostatné nástupné dokumenty…",
    choiceDescription: "Načítanie dokladov, uložené údaje, zmluvy a dodatky",
  },
  {
    id: "prilezitosti", number: "02", title: "AI vyhľadávanie zákaziek", shortTitle: "Príležitosti",
    setup: 350, monthly: 30, totalSetup: 500, totalMonthly: 49.5,
    description: "AI každý deň prehľadáva internet a hľadá nové zákazky pre vašu firmu. Vyberie vhodné zákazky, zhrnie zadanie, dohľadá dostupné kontakty a pripraví prvý e-mail. Vy si vyberiete, koho oslovíte.",
    input: "Váš odbor, región a typ zákaziek", output: "Relevantné príležitosti v jednom prehľade",
    benefits: ["Denné prehľadávanie internetu — vhodné zdroje nájdeme my", "Výber najvhodnejších nájdených zákaziek podľa vašich kritérií", "Stručný opis, dostupné podmienky, dohľadaný kontakt a zdroj", "Prvý e-mail pripravený AI podľa zákazky a služieb vašej firmy"],
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
