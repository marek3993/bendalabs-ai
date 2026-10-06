import type { Metadata } from "next";
import Link from "next/link";
import { Arrow, Brand, Footer } from "@/components/bendalabs/brand-shell";
import AutomationPreview from "@/components/bendalabs/automation-preview";
import AutomationConfigurator from "@/components/bendalabs/automation-configurator";
import { automationModules, euro, readAutomationModules } from "@/lib/bendalabs/automation";
import "./automation.css";

export const metadata: Metadata = {
  title: "Automatizácia dokumentov a vyhľadávania zákaziek | BendaLabs",
  description: "Online dashboard na mieru pre zmluvy, dokumenty a vyhľadávanie zákaziek. Pošlite stručný opis svojej situácie na nezáväznú analýzu. BendaLabs.",
  alternates: { canonical: "https://bendalabs.sk/automatizacia" },
  openGraph: { title: "Firemné dokumenty a zákazky bez zbytočnej ručnej práce.", description: "Načítanie údajov z dokladov, firemné dokumenty a hľadanie zákaziek s návrhom e-mailu. Systém podľa vášho postupu od 500 € + mesačná prevádzka.", url: "https://bendalabs.sk/automatizacia", locale: "sk_SK", type: "website" },
};

const faqs = [
  ["Objednávam si odoslaním formulára službu za 500 €?", "Nie. Pošlete iba stručný opis svojej situácie. Najprv ju zanalyzujem a prejdeme si možnosti. Realizáciu, rozsah a konkrétnu cenu si dohodneme osobitne, až keď vám riešenie bude dávať zmysel."],
  ["Je to hotová aplikácia alebo riešenie na mieru?", "Dostanete vlastný online dashboard, ktorý otvoríte v prehliadači. Jeho obrazovky, funkcie, šablóny a pracovné postupy nastavujem a upravujem pre každého zákazníka podľa jeho konkrétnych potrieb."],
  ["Musíme pri každom dokumente nahrávať doklady znova?", "Nie. Potrebné údaje sa po načítaní a kontrole uložia k človeku alebo firme. Pri ďalšej zmluve či dodatku vyberiete tento profil a doplníte nové informácie. Keď sa niečo zmení, upravíte to priamo v profile."],
  ["Môžeme používať naše doterajšie zmluvy a formuláre?", "Áno, vychádzam z vašich schválených vzorov. Ako podklady môžu slúžiť občianske preukazy, živnostenské oprávnenia, existujúce zmluvy či formuláre vo forme PDF, skenu alebo fotografie. Na konkrétnych príkladoch spolu prejdeme, čo sa má načítať a kam sa údaje doplnia."],
  ["Čo dostaneme pri vyhľadávaní zákaziek?", "Prehľad príležitostí podľa vášho odboru a regiónu, odkaz na pôvodné zadanie a dostupné podmienky či kontakt. Systém k zákazke automaticky pripraví aj návrh oslovovacieho e-mailu podľa zadania a služieb vašej firmy. Text si pozriete, prípadne upravíte a rozhodnete o odoslaní."],
  ["Čo presne zahŕňa cena?", "Jednorazová cena je za prípravu a nastavenie systému podľa dohodnutého postupu, vlastný dashboard a vysvetlenie používania. Mesačná cena pokrýva dohodnutú prevádzku, hosting, zálohy a opravy chýb. Konkrétnu ponuku dostanete pred začiatkom práce. Uvádzacie ceny platia pre prvých päť klientov."],
  ["Ako prebieha platba a odovzdanie?", "Polovica jednorazovej ceny sa platí na začiatku a polovica po odovzdaní. Najprv systém spolu vyskúšame na vašich podkladoch. Mesačná prevádzka sa začne účtovať až po odovzdaní."],
  ["Čo ak potrebujeme aj niečo mimo tejto ponuky?", "Napíšte mi konkrétny príklad do formulára. Môžeme začať jedným postupom a postupne pridávať ďalšie. Prejdeme si aj počet ľudí v tíme, ich prístupy a prípadné napojenia na nástroje, ktoré už používate."],
];

export default async function AutomationPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const initialModules = readAutomationModules(params.modul);
  const jobs = initialModules.length === 1 && initialModules[0] === "prilezitosti";
  const docs = initialModules.length === 1 && initialModules[0] === "dokumenty";
  const orderedModules = jobs ? [...automationModules].reverse() : automationModules;
  function moduleLink(module: string) {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (key.startsWith("utm_") && value) {
        for (const item of Array.isArray(value) ? value : [value]) query.append(key, item);
      }
    }
    query.set("modul", module);
    return `/automatizacia?${query.toString()}#konfigurator`;
  }
  return <div className="bl-site auto-site"><a href="#main" className="bl-skip">Prejsť na obsah</a>
    <header className="auto-header"><div className="bl-wrap auto-header-inner"><Brand /><nav aria-label="Navigácia ponuky"><a href="#moduly">Služby a ceny</a><a href="#ako-to-funguje">Ako to funguje</a><a href="#o-mne">Kto to pripraví</a></nav><a className="bl-button bl-button-small" href="#konfigurator">Opísať situáciu <Arrow /></a></div></header>
    <main id="main">
      <section className="auto-hero bl-wrap">
        <div className="auto-hero-copy"><p className="auto-kicker">BENDA LABS / ONLINE DASHBOARD NA MIERU</p>
          <h1>{jobs ? <>Zákazky pre váš odbor.<span>Prvé oslovenie pripravené.</span></> : docs ? <>Zmluvy a dodatky<span>z údajov, ktoré už máte.</span></> : <>Vlastný online dashboard.<span>Podľa potrieb vašej firmy.</span></>}</h1>
          <p className="auto-lead">{jobs ? "Príležitosti podľa odboru a regiónu, dostupné kontakty a návrhy e-mailov na jednom mieste." : docs ? "Údaje uložíte raz. Zmluvy, dodatky a nástupné dokumenty pripravíte z vlastných firemných vzorov." : "Zmluvy, dokumenty alebo vyhľadávanie zákaziek v jednom prehľadnom systéme v prehliadači."}</p>
          <p className="auto-custom-note">Dashboard nastavím a upravím presne pre vás — od obrazoviek a funkcií až po vaše šablóny a pracovné postupy.</p>
          <div className="auto-hero-actions"><a className="bl-button" href="#konfigurator">Opísať moju situáciu <Arrow /></a><a className="bl-text-link" href="#ukazka">Pozrieť ukážku dashboardu</a></div>
          <p className="auto-intro-note">Marek Benda · vašu situáciu prejdete priamo so mnou</p>
        </div>
        <AutomationConfigurator key={initialModules.join(",")} initialModules={initialModules} />
      </section>
      <section className="auto-start bl-wrap" id="ako-zacneme" aria-label="Ako začneme"><ol>
        <li><span>01</span><h2>Opíšete situáciu</h2><p>Stačí krátka veta alebo konkrétny príklad. Bez objednávky služby.</p></li>
        <li><span>02</span><h2>Zanalyzujem možnosti</h2><p>Prejdeme si váš postup a navrhnem, čo sa dá zjednodušiť.</p></li>
        <li><span>03</span><h2>Dohodneme riešenie</h2><p>Až potom si odsúhlasíme rozsah, cenu a úpravy dashboardu pre váš tím.</p></li>
      </ol></section>
      <section className="auto-demo-section bl-wrap" id="ukazka"><div><p className="bl-eyebrow">Takto môže vyzerať váš dashboard</p><h2>Všetko potrebné<br />na jednom mieste.</h2><p>Toto je interaktívna ukážka. Váš dashboard prispôsobím tomu, ako pracujete vy — jeho funkcie aj obrazovky môžu vyzerať inak.</p><a className="bl-text-link" href="#konfigurator">Opísať, čo potrebujem <Arrow /></a></div><AutomationPreview key={initialModules.join(",")} initialTab={jobs ? "prilezitosti" : "nastup"} /></section>
      <section className="auto-modules" id="moduly"><div className="bl-wrap">
        <div className="auto-heading-row"><div><p className="bl-eyebrow">S čím vám viem pomôcť</p><h2>Vyberte si podľa toho,<br />čo potrebujete vyriešiť.</h2></div><p>Orientačné ceny realizácie po dohode. Najprv nám pošlite svoju situáciu; odoslanie formulára nie je objednávka.</p></div>
        <div className="auto-module-grid">{orderedModules.map(module => <article key={module.id} className="auto-module-card"><div className="auto-module-number"><span>{module.id === "dokumenty" ? "DOKUMENTY A ADMINISTRATÍVA" : "OBCHODNÉ PRÍLEŽITOSTI"}</span></div><h3>{module.title}</h3><p>{module.description}</p><ul>{module.benefits.map(line => <li key={line}>{line}</li>)}</ul><div className="auto-module-price"><span>Nastavenie vrátane dashboardu</span><strong><small>od </small>{euro(module.totalSetup)}<small> jednorazovo</small></strong><p>+ od {euro(module.totalMonthly)} / mesiac</p></div><Link href={moduleLink(module.id)} className="bl-text-link">{module.id === "dokumenty" ? "Opísať prácu s dokumentmi" : "Opísať hľadanie zákaziek"} <Arrow /></Link></article>)}</div>
        <p className="auto-modules-note">Uvádzacie ceny pre prvých 5 klientov. Konkrétny postup a cenu si potvrdíme pred začiatkom práce.</p>
      </div></section>
      <section className="auto-how bl-wrap" id="ako-to-funguje">
        <div className="auto-heading-row"><div><p className="bl-eyebrow">Dokumenty v praxi</p><h2>Pri novom zamestnancovi<br />začnete jeho dokladmi.</h2></div><p>Pri dodatku o pár mesiacov už otvoríte jeho profil. Údaje aj predchádzajúce dokumenty budete mať poruke.</p></div>
        <div className="auto-document-example">
          <div className="auto-example-intro"><span className="auto-example-label">Príklad pracovného postupu</span><h3>Od prijatia človeka<br />po neskoršie zmeny.</h3><p>Rovnakým spôsobom sa dá pracovať s údajmi živnostníka, klienta alebo dodávateľskej firmy.</p></div>
          <ol className="auto-example-steps"><li><span>1</span><div><h3>Načítate údaje</h3><p>Nahráte OP, živnostenské oprávnenie alebo iný podklad. Systém načíta potrebné údaje a po vašej kontrole ich uloží do profilu.</p></div></li><li><span>2</span><div><h3>Pripravíte nástupné dokumenty</h3><p>Doplníte pozíciu, odmenu a dátum nástupu. Systém vyplní pracovnú zmluvu, osobný dotazník aj ďalšie dokumenty z vašich firemných vzorov.</p></div></li><li><span>3</span><div><h3>Pri dodatku zadáte iba zmenu</h3><p>Vyberiete uloženého človeka a nové podmienky. Personalizovaný dodatok vznikne z jeho údajov bez opätovného nahrávania dokladov.</p></div></li></ol>
        </div>
        <div className="auto-practical-benefits"><div><h3>Menej času na vypĺňanie</h3><p>Jedno meno a adresu už nekopírujete do každého súboru zvlášť.</p></div><div><h3>Menej preklepov a rozdielov</h3><p>Dokumenty čerpajú z toho istého profilu a dohodnutých vzorov.</p></div><div><h3>Prehľad pre celý tím</h3><p>Údaje, súbory a história zostávajú pri konkrétnom človeku alebo firme.</p></div></div>
      </section>
      <section className="auto-opportunity-section"><div className="bl-wrap auto-opportunity-grid">
        <div><p className="bl-eyebrow">Zákazky v praxi</p><h2>Nájdená príležitosť<br />aj prvé oslovenie.</h2><p>Podľa odboru, regiónu a kapacity vašej firmy systém vyhľadáva vhodné zákazky. Pri každej máte dostupné podmienky, zdroj a kontakt.</p><p>Zároveň pripraví e-mail, ktorý vychádza z konkrétneho zadania a z toho, čo vaša firma ponúka. Text si prezriete, doplníte a odošlete podľa svojho rozhodnutia.</p><Link href={moduleLink("prilezitosti")} className="bl-text-link">Nastaviť hľadanie pre moju firmu <Arrow /></Link></div>
        <div className="auto-email-example"><div className="auto-email-top"><span>Návrh e-mailu</span><span>Ukážka</span></div><dl><div><dt>K zákazke</dt><dd>Elektroinštalácia novej prevádzky</dd></div><div><dt>Predmet</dt><dd>Spolupráca na elektroinštalácii v Bratislave</dd></div></dl><div className="auto-email-body"><p>Dobrý deň,</p><p>zaujalo nás vaše zadanie elektroinštalácie novej prevádzky v Bratislave. Naša firma sa venuje elektroinštalačným prácam pre firemné priestory.</p><p>Radi by sme si prešli rozsah prác a požadovaný termín. Môžete nám, prosím, poslať bližšie podklady?</p><p>Ďakujeme,<br />tím vašej firmy</p></div><p className="auto-email-foot">Pripravené na kontrolu a odoslanie · fiktívny príklad</p></div>
      </div></section>
      <section className="auto-founder bl-wrap" id="o-mne"><div className="auto-founder-id"><span className="auto-founder-mark" aria-hidden="true">MB</span><div><h2>Marek Benda</h2><p>Tvorca BendaLabs</p><a href="mailto:info@bendalabs.sk">info@bendalabs.sk</a><a href="tel:+421944388123">+421 944 388 123</a></div></div><div className="auto-founder-copy"><h3>Vaše zadanie prejdete priamo so mnou.</h3><p>V BendaLabs tvorím aplikácie a automatizácie. Začneme vaším dokumentom alebo príkladom zákazky. Prejdeme si, ako dnes pracujete, a navrhnem postup, ktorý má zmysel automatizovať.</p><p>Podobnej práci s dokladmi a zmluvami sa venujem aj v projekte Zmluvomat. Výsledný systém nastavím podľa potrieb vašej firmy a ukážem vášmu tímu, ako ho používať.</p><Link href="/labs" className="bl-text-link">Pozrieť moje ďalšie projekty <Arrow /></Link></div></section>
      <div className="auto-final-cta bl-wrap"><h2>Začnime tým, čo dnes riešite.</h2><a className="bl-button" href="#konfigurator">Poslať krátky opis situácie <Arrow /></a></div>
      <section className="auto-faq bl-wrap"><div><p className="bl-eyebrow">Pred spoluprácou</p><h2>Časté otázky</h2></div><div>{faqs.map(([question, answer]) => <details key={question}><summary>{question}<span aria-hidden="true">+</span></summary><p>{answer}</p></details>)}</div></section>
    </main><Footer />
  </div>;
}
