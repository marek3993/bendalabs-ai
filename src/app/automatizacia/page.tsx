import type { Metadata } from "next";
import Link from "next/link";
import { Arrow, Brand, Footer } from "@/components/bendalabs/brand-shell";
import AutomationPreview from "@/components/bendalabs/automation-preview";
import AutomationConfigurator from "@/components/bendalabs/automation-configurator";
import { automationModules, euro, readAutomationModules } from "@/lib/bendalabs/automation";
import "./automation.css";

export const metadata: Metadata = {
  title: "Firemná automatizácia od 500 € | BendaLabs",
  description: "Zmluvy a dokumenty, spracovanie podkladov a vyhľadávanie zákaziek. Poskladajte si firemný systém s vlastným dashboardom. Uvádzacia ponuka pre prvých 5 klientov.",
  alternates: { canonical: "https://bendalabs.sk/automatizacia" },
  openGraph: { title: "Menej prepisovania. Viac času na firmu.", description: "Tri moduly. Jeden firemný priestor. Automatizácia od 500 € jednorazovo + 24,50 € mesačne.", url: "https://bendalabs.sk/automatizacia", locale: "sk_SK", type: "website" },
};

const faqs = [
  ["Kupujem hotovú aplikáciu alebo systém pre svoju firmu?", "Vyberáte si základné moduly. Na vašich vzorových podkladoch si dohodneme konkrétny postup a systém podľa neho nastavíme. Pred začiatkom dostanete potvrdený rozsah a cenu."],
  ["Čo je zahrnuté v mesačnej cene?", "Prevádzka firemného priestoru, hosting, zálohy, opravy chýb a používanie vybraných modulov v uvedených objemoch. Nové funkcie, ďalšie šablóny, integrácie a vyššie objemy naceníme samostatne vopred."],
  ["Môžem začať jedným modulom?", "Áno. Začnite konkrétnou úlohou, ktorá vás zdržiava. Ďalší modul môžeme pridať neskôr do rovnakého firemného priestoru. Spoločný dashboard nevytvárame odznova."],
  ["Kto kontroluje vytvorené dokumenty a načítané údaje?", "Vy alebo poverený človek vo firme. Zmluvy vytvárame podľa vašich schválených šablón; ich obsah a vhodnosť schvaľujete vy. Načítané údaje systém pripraví na kontrolu pred potvrdením."],
  ["Odkiaľ bude systém hľadať zákazky?", "Zdroje vyberieme podľa vášho odboru a trhu. Pred potvrdením modulu preveríme ich dostupnosť a možnosť automatického sledovania. Modul zahŕňa najviac tri dohodnuté zdroje; získanie zákazky závisí od vašej ponuky a rozhodnutia zadávateľa."],
  ["Ako funguje uvádzacia ponuka a platba?", "Uvádzacie ceny ponúkame prvým piatim klientom. Po odsúhlasení zadania sa platí 50 % jednorazovej ceny pri začiatku a 50 % po odovzdaní. Mesačná prevádzka začne po odovzdaní. Dohodnuté podmienky uvedieme v ponuke; vlastné požiadavky a rozšírenia naceníme zvlášť."],
];

export default async function AutomationPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const initialModules = readAutomationModules(params.modul);
  return <div className="bl-site auto-site"><a href="#main" className="bl-skip">Prejsť na obsah</a>
    <header className="auto-header"><div className="bl-wrap auto-header-inner"><Brand /><nav aria-label="Navigácia ponuky"><a href="#moduly">Moduly</a><a href="#ukazka">Ukážka</a><a href="#konfigurator">Cenník</a></nav><a className="bl-button bl-button-small" href="#konfigurator">Poskladať systém <Arrow /></a></div></header>
    <main id="main">
      <section className="auto-hero bl-wrap"><div className="auto-hero-copy"><p className="auto-kicker"><span aria-hidden="true" /> Automatizácia pre vašu firmu</p><h1>Menej prepisovania.<br /><span>Viac času<br />na firmu.</span></h1><p className="auto-lead">Zmluvy, údaje z dokumentov aj nové zákazky. Poskladáme vám interný systém, ktorý prevezme opakujúcu sa prácu.</p><div className="auto-hero-actions"><a className="bl-button" href="#konfigurator">Poskladať môj systém <Arrow /></a><a className="bl-text-link" href="#moduly">Pozrieť moduly <span aria-hidden="true">↓</span></a></div><div className="auto-hero-price"><strong>Od 500 €</strong><span>jednorazovo + od 24,50 € / mesiac<br />Uvádzacia ponuka pre prvých 5 klientov.</span></div></div><AutomationPreview /></section>
      <div className="auto-promise-strip"><div className="bl-wrap"><p><span>01</span> Vyberiete si moduly</p><p><span>02</span> Nastavíme váš postup</p><p><span>03</span> Používate vlastný dashboard</p></div></div>
      <section className="auto-modules bl-wrap" id="moduly"><div className="auto-heading-row"><div><p className="bl-eyebrow">Tri konkrétne veci, s ktorými pomôžeme</p><h2>Vyberte, čo má<br />pracovať za vás.</h2></div><p>Každý modul rieši jednu úlohu. Spolu fungujú v jednom priestore vašej firmy.</p></div><div className="auto-module-grid">{automationModules.map(module => <article key={module.id} className="auto-module-card"><div className="auto-module-number"><span>{module.number}</span><ModuleIcon id={module.id} /></div><h3>{module.title}</h3><p>{module.description}</p><div className="auto-mini-flow"><span>{module.input}</span><span aria-hidden="true">↓</span><strong>{module.output}</strong></div><ul>{module.scope.map(line => <li key={line}>{line}</li>)}</ul><div className="auto-module-price"><span>Samostatne s firemným dashboardom</span><strong>{euro(module.totalSetup)}<small> jednorazovo</small></strong><p>+ {euro(module.totalMonthly)} / mesiac</p></div><Link href={`/automatizacia?modul=${module.id}#konfigurator`} className="bl-text-link">Vybrať tento modul <Arrow /></Link></article>)}</div><p className="auto-modules-note">Dokumenty schvaľuje človek. Zdroje zákaziek preveríme pred realizáciou. Vyššie objemy a rozšírenia naceníme po dohode.</p></section>
      <section className="auto-dashboard-section"><div className="bl-wrap auto-dashboard-grid"><div><p className="bl-eyebrow">Jeden priestor pre vašu firmu</p><h2>Každá firma<br />má svoj dashboard.</h2><p>Vaše dokumenty, údaje a vybrané moduly na jednom mieste. Prístupy nastavíme pre ľudí, ktorí s nimi majú pracovať.</p><a href="#ukazka" className="bl-text-link">Vyskúšať ukážku vyššie <Arrow /></a></div><div className="auto-dashboard-features"><div><span aria-hidden="true">↗</span><div><h3>Postup podľa vašej práce</h3><p>Vychádzame z podkladov a krokov, ktoré vo firme už používate.</p></div></div><div><span aria-hidden="true">□</span><div><h3>Vaše firemné údaje</h3><p>Systém navrhneme so samostatným firemným priestorom a dohodnutými prístupmi.</p></div></div><div><span aria-hidden="true">+</span><div><h3>Priestor na ďalšie potreby</h3><p>Máte inú opakujúcu sa úlohu? Napíšte ju do dopytu. Prejdeme si možnosti aj cenu.</p></div></div></div></div></section>
      <AutomationConfigurator key={initialModules.join(",")} initialModules={initialModules} />
      <section className="auto-process bl-wrap"><div className="auto-heading-row"><div><p className="bl-eyebrow">Od požiadavky k používaniu</p><h2>Jasný postup.<br />Dohodnutý rozsah.</h2></div><p>Najprv si potvrdíme, čo má systém robiť. Potom ho postavíme na vašich reálnych príkladoch.</p></div><ol className="auto-process-grid">{[["Dopyt", "Vyberiete moduly a opíšete svoju úlohu. Bez záväznej objednávky."], ["Zadanie a cena", "Prejdeme vzorové podklady, objemy, prístupy a potrebné napojenia."], ["Nastavenie a kontrola", "Systém pripravíme a spolu overíme na dohodnutých príkladoch."], ["Odovzdanie", "Ukážeme vášmu tímu používanie. Mesačná prevádzka začne po odovzdaní."]].map(([title, copy], index) => <li key={title}><span>0{index + 1}</span><h3>{title}</h3><p>{copy}</p></li>)}</ol></section>
      <section className="auto-faq bl-wrap"><div><p className="bl-eyebrow">Predtým, než sa ozvete</p><h2>Časté otázky.</h2><p>Niečo ďalšie?<br /><a href="mailto:info@bendalabs.sk">info@bendalabs.sk ↗</a></p></div><div>{faqs.map(([question, answer]) => <details key={question}><summary>{question}<span aria-hidden="true">+</span></summary><p>{answer}</p></details>)}</div></section>
      <section className="auto-final-cta"><div className="bl-wrap"><p className="bl-eyebrow">Začnite jednou úlohou</p><h2>Čo už nechcete<br />robiť ručne?</h2><a href="#konfigurator" className="bl-button">Chcem svoj systém <Arrow /></a><p>Marek Benda · BendaLabs · <a href="tel:+421944388123">+421 944 388 123</a></p></div></section>
    </main><Footer />
  </div>;
}

function ModuleIcon({ id }: { id: string }) {
  return <svg width="27" height="27" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">{id === "dokumenty" ? <><path d="M6 3h8l4 4v14H6zM14 3v5h5M9 12h6M9 16h6" /></> : id === "spracovanie" ? <><path d="M8 3H3v5M16 3h5v5M21 16v5h-5M8 21H3v-5M6 12h12M9 8h6M9 16h6" /></> : <><circle cx="10" cy="10" r="6" /><path d="m15 15 6 6M7 10h6M10 7v6" /></>}</svg>;
}
