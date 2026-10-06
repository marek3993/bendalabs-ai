import type { Metadata } from "next";
import Link from "next/link";
import { Arrow, Brand, Footer } from "@/components/bendalabs/brand-shell";
import AutomationPreview from "@/components/bendalabs/automation-preview";
import AutomationConfigurator from "@/components/bendalabs/automation-configurator";
import { automationModules, euro, readAutomationModules } from "@/lib/bendalabs/automation";
import "./automation.css";

export const metadata: Metadata = {
  title: "AI automatizácia dokumentov a hľadania zákaziek | BendaLabs",
  description: "AI za vás denne hľadá zákazky a pripravuje prvé e-maily. Z dokladov načíta údaje do vašich zmlúv. Vlastný online dashboard na mieru od BendaLabs.",
  alternates: { canonical: "https://bendalabs.sk/automatizacia" },
  openGraph: { title: "AI hľadá zákazky a pripravuje dokumenty za vás.", description: "Denne vybrané zákazky s kontaktmi a prvým e-mailom. Zmluvy a dodatky z vašich dokladov a šablón. AI automatizácia vo vlastnom dashboarde na mieru.", url: "https://bendalabs.sk/automatizacia", locale: "sk_SK", type: "website" },
};

const faqs = [
  ["Musíme vám dať zoznam webov, na ktorých má AI hľadať?", "Nie. Stačí nám povedať, čo vaša firma ponúka, kde pôsobí a aké zákazky chce získavať. Vhodné weby a zdroje vyhľadáme my. Pripravíme aj nastavenie AI, výber príležitostí a návrhy oslovení, aby ste dostali použiteľné podklady pre nový obchod."],
  ["Bude AI posielať e-maily alebo používať dokumenty bez mojej kontroly?", "Nie. AI pripraví podklady: vybrané zákazky, návrhy e-mailov alebo vyplnené dokumenty. Vy ich skontrolujete a rozhodnete o odoslaní či použití. Pri zmluvách vychádzame z vašich schválených vzorov."],
  ["Objednávam si odoslaním formulára službu za 500 €?", "Nie. Pošlete iba stručný opis svojej situácie. Najprv ju zanalyzujeme a prejdeme si možnosti. Realizáciu, rozsah a konkrétnu cenu si dohodneme osobitne, až keď vám riešenie bude dávať zmysel."],
  ["Je to hotová aplikácia alebo riešenie na mieru?", "Dostanete vlastný online dashboard, ktorý otvoríte v prehliadači. Jeho obrazovky, funkcie, šablóny a pracovné postupy nastavujeme a upravujeme pre každého zákazníka podľa jeho konkrétnych potrieb."],
  ["Musíme pri každom dokumente nahrávať doklady znova?", "Nie. Potrebné údaje sa po načítaní a kontrole uložia k človeku alebo firme. Pri ďalšej zmluve či dodatku vyberiete tento profil a doplníte nové informácie. Keď sa niečo zmení, upravíte to priamo v profile."],
  ["Môžeme používať naše doterajšie zmluvy a formuláre?", "Áno, vychádzam z vašich schválených vzorov. Ako podklady môžu slúžiť občianske preukazy, živnostenské oprávnenia, existujúce zmluvy či formuláre vo forme PDF, skenu alebo fotografie. Na konkrétnych príkladoch spolu prejdeme, čo sa má načítať a kam sa údaje doplnia."],
  ["Čo dostaneme pri vyhľadávaní zákaziek?", "AI denne prehľadáva internet a vyberá nájdené zákazky podľa zamerania vašej firmy. Vhodné zdroje aj nastavenie vyhľadávania zabezpečíme my. V dashboarde uvidíte stručný opis, dostupné podmienky, dohľadaný kontakt, pôvodný zdroj a návrh prvého e-mailu. Kontakty ani vhodná zákazka nemusia byť dostupné pri každom vyhľadávaní. Text skontrolujete, doplníte svoju ponuku a sami ho odošlete."],
  ["Čo presne zahŕňa cena?", "Jednorazová cena je za prípravu a nastavenie systému podľa dohodnutého postupu, vlastný dashboard a vysvetlenie používania. Mesačná cena pokrýva dohodnutú prevádzku, hosting, zálohy a opravy chýb. Konkrétnu ponuku dostanete pred začiatkom práce. Uvádzacie ceny platia pre prvých päť klientov."],
  ["Ako prebieha platba a odovzdanie?", "Polovica jednorazovej ceny sa platí na začiatku a polovica po odovzdaní. Najprv systém spolu vyskúšame na vašich podkladoch. Mesačná prevádzka sa začne účtovať až po odovzdaní."],
  ["Čo ak potrebujeme aj niečo mimo tejto ponuky?", "Napíšte nám konkrétny príklad do formulára. Môžeme začať jedným postupom a postupne pridávať ďalšie. Prejdeme si aj počet ľudí v tíme, ich prístupy a prípadné napojenia na nástroje, ktoré už používate."],
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
        <div className="auto-hero-copy"><p className="auto-kicker">BENDA LABS / AUTOMATIZÁCIA POMOCOU AI</p>
          <h1>{jobs ? <>AI hľadá zákazky za vás. <span>Vy vyberiete, koho oslovíte.</span></> : docs ? <>Nahrajte doklad. <span>AI pripraví vaše dokumenty.</span></> : <>AI pripraví dokumenty. <span>A vyhľadá zákazky za vás.</span></>}</h1>
          <p className="auto-lead">{jobs ? "AI každý deň prehľadáva internet a hľadá nové zákazky pre vašu firmu. Vyberie vhodné príležitosti, zhrnie zadanie, dohľadá dostupné kontakty a pripraví prvý e-mail." : docs ? "Nahrajete fotku alebo PDF dokladu. AI z neho načíta údaje a doplní ich do vašich zmlúv, dodatkov či nástupných formulárov. Vy skontrolujete výsledok — bez prepisovania mena a adresy do každého súboru." : "AI načíta údaje z dokladov a vyplní vaše firemné dokumenty. Alebo každý deň prehľadáva internet, hľadá nové zákazky pre vašu firmu a pripravuje e-maily na oslovenie. Vy skontrolujete výsledok a rozhodnete o ďalšom kroku."}</p>
          {jobs && <p className="auto-custom-note">Pri rannej káve otvoríte vybrané príležitosti, pozriete si podmienky a skontrolujete pripravený e-mail. Doplníte svoju ponuku a odošlete ju.</p>}
          {jobs && <p className="auto-custom-note">Vy nám poviete, čo vaša firma ponúka a akých klientov hľadá. O výber zdrojov, nastavenie AI a prípravu príležitostí sa postaráme my.</p>}
          <p className="auto-custom-note">Všetko máte vo vlastnom online dashboarde v prehliadači. AI aj dashboard pripravíme na mieru vašej firme — od výberu funkcií po nastavenie a úpravy podľa vašich potrieb.</p>
          <div className="auto-hero-actions"><a className="bl-button" href="#konfigurator">Opísať moju situáciu <Arrow /></a><a className="bl-text-link" href="#ukazka">Pozrieť ukážku dashboardu</a></div>
        </div>
        <AutomationConfigurator key={initialModules.join(",")} initialModules={initialModules} />
      </section>
      <section className="auto-start bl-wrap" id="ako-zacneme" aria-label="Ako začneme"><ol>
        <li><span>01</span><h2>Opíšete situáciu</h2><p>Stačí krátka veta alebo konkrétny príklad. Bez objednávky služby.</p></li>
        <li><span>02</span><h2>Navrhneme riešenie</h2><p>Zistíme, čo potrebujete dosiahnuť, a navrhneme, ako vám s tým AI pomôže.</p></li>
        <li><span>03</span><h2>Dohodneme riešenie</h2><p>Až potom si odsúhlasíme rozsah, cenu a úpravy dashboardu pre váš tím.</p></li>
      </ol></section>
      <section className="auto-demo-section bl-wrap" id="ukazka"><div><p className="bl-eyebrow">Takto môže vyzerať váš dashboard</p><h2>{jobs ? <>Zákazka, stručné zhrnutie<br />a e-mail pripravený AI.</> : <>Z dokladu do zmluvy.<br />Pozrite si postup.</>}</h2><p>{jobs ? "Vyskúšajte si, ako otvoríte nájdenú príležitosť a pozriete si pripravené oslovenie. V reálnom dashboarde AI vyberá zákazky podľa nastavenia vašej firmy." : "V ukážke už AI načítala údaje z dokladu. Kliknite na prípravu dokumentov alebo skúste dodatok z uloženého profilu."} Ide o modelový príklad; váš dashboard upravíme na mieru.</p><a className="bl-text-link" href="#konfigurator">Opísať, čo potrebujem <Arrow /></a></div><AutomationPreview key={initialModules.join(",")} initialTab={jobs ? "prilezitosti" : "nastup"} /></section>
      <section className="auto-modules" id="moduly"><div className="bl-wrap">
        <div className="auto-heading-row"><div><p className="bl-eyebrow">Čo za vás urobí AI</p><h2>Čo môže AI robiť<br />vo vašej firme?</h2></div><p>Orientačné ceny realizácie po dohode. Najprv nám pošlite svoju situáciu; odoslanie formulára nie je objednávka.</p></div>
        <div className="auto-module-grid">{orderedModules.map(module => <article key={module.id} className="auto-module-card"><div className="auto-module-number"><span>{module.id === "dokumenty" ? "DOKUMENTY A ADMINISTRATÍVA" : "OBCHODNÉ PRÍLEŽITOSTI"}</span></div><h3>{module.title}</h3><p>{module.description}</p><ul>{module.benefits.map(line => <li key={line}>{line}</li>)}</ul><div className="auto-module-price"><span>Nastavenie vrátane dashboardu</span><strong><small>od </small>{euro(module.totalSetup)}<small> jednorazovo</small></strong><p>+ od {euro(module.totalMonthly)} / mesiac</p></div><Link href={moduleLink(module.id)} className="bl-text-link">{module.id === "dokumenty" ? "Opísať prácu s dokumentmi" : "Opísať hľadanie zákaziek"} <Arrow /></Link></article>)}</div>
        <p className="auto-modules-note">Uvádzacie ceny pre prvých 5 klientov. Konkrétny postup a cenu si potvrdíme pred začiatkom práce.</p>
      </div></section>
      <section className="auto-how bl-wrap" id="ako-to-funguje">
        <div className="auto-heading-row"><div><p className="bl-eyebrow">Dokumenty v praxi</p><h2>Jeden doklad.<br />Vyplnené firemné dokumenty.</h2></div><p>Príde nový kolega? Nahráte jeho doklad, AI načíta údaje a pripraví dokumenty z vašich vzorov. Pri dodatku o pár mesiacov už použijete uložený profil.</p></div>
        <div className="auto-document-example">
          <div className="auto-example-intro"><span className="auto-example-label">Príklad pracovného postupu</span><h3>Od prijatia človeka<br />po neskoršie zmeny.</h3><p>Rovnakým spôsobom sa dá pracovať s údajmi živnostníka, klienta alebo dodávateľskej firmy.</p></div>
          <ol className="auto-example-steps"><li><span>1</span><div><h3>Nahráte doklad, AI načíta údaje</h3><p>Stačí fotografia alebo PDF občianskeho preukazu, živnostenského oprávnenia či iného podkladu. AI prečíta potrebné údaje. Skontrolujete ich a uložíte k človeku alebo firme.</p></div></li><li><span>2</span><div><h3>AI vyplní vaše firemné vzory</h3><p>Zadáte pozíciu, odmenu a dátum nástupu. Meno, adresu a ďalšie načítané údaje už AI doplní do pracovnej zmluvy, dotazníka aj ďalších dohodnutých dokumentov. Hotové návrhy skontrolujete pred použitím.</p></div></li><li><span>3</span><div><h3>Pri dodatku zadáte iba zmenu</h3><p>Mení sa odmena alebo pracovná pozícia? Vyberiete človeka a doplníte nové podmienky. AI pripraví návrh dodatku z uložených údajov a vášho vzoru. Doklady už znova nenahrávate.</p></div></li></ol>
        </div>
        <div className="auto-practical-benefits"><div><h3>Menej času na vypĺňanie</h3><p>Jedno meno a adresu už nekopírujete do každého súboru zvlášť.</p></div><div><h3>Menej preklepov a rozdielov</h3><p>Dokumenty čerpajú z toho istého profilu a dohodnutých vzorov.</p></div><div><h3>Prehľad pre celý tím</h3><p>Údaje, súbory a história zostávajú pri konkrétnom človeku alebo firme.</p></div></div>
      </section>
      <section className="auto-opportunity-section"><div className="bl-wrap auto-opportunity-grid">
        <div><p className="bl-eyebrow">Zákazky v praxi</p><h2>Vy si dáte rannú kávu.<br />AI už prešla zákazky.</h2><p>AI každý deň prehľadáva internet a vyhľadáva nové obchodné príležitosti. Z nájdených zákaziek vyberie tie, ktoré najlepšie sedia službám vašej firmy, regiónu a kapacite. Vhodné weby a zdroje nájdeme my a nastavíme ich sledovanie.</p><p>Ku každej stručne opíše, čo klient potrebuje, vytiahne dostupné podmienky, dohľadá kontaktnú osobu alebo firemný kontakt a priloží pôvodný zdroj. Hneď pripraví aj prvý e-mail podľa zadania a služieb vašej firmy.</p><p>Ráno otvoríte dashboard, vyberiete si príležitosť a skontrolujete pripravené oslovenie. Doplníte svoju ponuku a odošlete ju — namiesto ručného prechádzania portálov a písania od prázdneho e-mailu.</p><Link href={moduleLink("prilezitosti")} className="bl-text-link">Nastaviť hľadanie pre moju firmu <Arrow /></Link></div>
        <div className="auto-email-example"><div className="auto-email-top"><span>Návrh e-mailu</span><span>Ukážka</span></div><dl><div><dt>K zákazke</dt><dd>Elektroinštalácia novej prevádzky</dd></div><div><dt>Predmet</dt><dd>Spolupráca na elektroinštalácii v Bratislave</dd></div></dl><div className="auto-email-body"><p>Dobrý deň,</p><p>zaujalo nás vaše zadanie elektroinštalácie novej prevádzky v Bratislave. Naša firma sa venuje elektroinštalačným prácam pre firemné priestory.</p><p>Radi by sme si prešli rozsah prác a požadovaný termín. Môžete nám, prosím, poslať bližšie podklady?</p><p>Ďakujeme,<br />tím vašej firmy</p></div><p className="auto-email-foot">Pripravené na kontrolu a odoslanie · fiktívny príklad</p></div>
      </div></section>

      <section className="auto-founder bl-wrap" id="o-mne"><div className="auto-founder-id"><span className="auto-founder-mark" aria-hidden="true">MB</span><div><h2>Marek Benda</h2><p>Tvorca BendaLabs</p><a href="mailto:info@bendalabs.sk">info@bendalabs.sk</a><a href="tel:+421944388123">+421 944 388 123</a></div></div><div className="auto-founder-copy"><h3>Vaše zadanie prejdete priamo so mnou.</h3><p>V BendaLabs tvorím automatizácie pomocou AI. Ukážete mi dokument, ktorý ručne vypĺňate, alebo zákazku, akú chcete nájsť. Na tomto konkrétnom príklade navrhnem, čo za vás bude robiť AI a čo zostane na vašej kontrole.</p><p>Podobnej práci s dokladmi a zmluvami sa venujem aj v projekte Zmluvomat. Výsledný systém nastavím podľa potrieb vašej firmy a ukážem vášmu tímu, ako ho používať.</p><Link href="/labs" className="bl-text-link">Pozrieť moje ďalšie projekty <Arrow /></Link></div></section>
      <div className="auto-final-cta bl-wrap"><h2>Začnime tým, čo dnes riešite.</h2><a className="bl-button" href="#konfigurator">Poslať krátky opis situácie <Arrow /></a></div>
      <section className="auto-faq bl-wrap"><div><p className="bl-eyebrow">Pred spoluprácou</p><h2>Časté otázky</h2></div><div>{faqs.map(([question, answer]) => <details key={question}><summary>{question}<span aria-hidden="true">+</span></summary><p>{answer}</p></details>)}</div></section>
    </main><Footer />
  </div>;
}
