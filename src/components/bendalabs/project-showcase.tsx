import Image from "next/image";
import type { ReactNode } from "react";
import type { SiteLocale } from "@/lib/bendalabs/site-content";
import { Arrow } from "./brand-shell";
import MotionStudy from "./motion-study";
import ProjectDemo from "./project-demo";
import { ArmDetails, FakturomatDetails, FeederDetails, MecanumDetails, ProjectPhoto, TrendAtlasDetails } from "./project-details";

type Props = { locale?: SiteLocale; standalone?: boolean };

function MoreProject({ id, title, summary, status, children }: { id?: string; title: string; summary: string; status: string; children: ReactNode }) {
  return <details id={id} className="bl-more-project"><summary><div><h3>{title}</h3><p>{summary}</p><span className="bl-status">{status}</span></div><span className="bl-expand" aria-hidden="true">+</span></summary><div className="bl-more-content">{children}</div></details>;
}

export function LabsProjects({ locale = "sk", standalone = false }: Props) {
  const cs = locale === "cs";
  const Heading = standalone ? "h1" : "h2";
  const developing = cs ? "Funkční projekt · ve vývoji" : "Fungujúci projekt · vo vývoji";
  return <section id="labs" className="bl-labs bl-wrap bl-showcase">
    <header className="bl-section-heading"><div><p className="bl-eyebrow">{cs ? "Software a AI" : "Softvér a AI"}</p><Heading>BendaLabs<span>.</span></Heading></div><p>{cs ? "Méně ruční práce s doklady. Lepší přehled v datech. Vlastní produkty pro konkrétní úkoly." : "Menej ručnej práce s dokladmi. Lepší prehľad v dátach. Vlastné produkty pre konkrétne úlohy."}</p></header>
    <div className="bl-labs-featured">
      <article className="bl-software-project" id="fakturomat">
        <span className="bl-status">{developing}</span><h3>Fakturomat</h3>
        <p className="bl-project-lead">{cs ? "Z objednávky do faktury." : "Z objednávky do faktúry."}</p>
        <p>{cs ? "Načte PDF objednávku a připraví údaje pro fakturu slovenského nebo českého živnostníka. Po kontrole získáte fakturu a podepsanou původní objednávku. AI pomáhá doplnit údaje, které běžné čtení PDF nezachytí." : "Načíta PDF objednávku a pripraví údaje pre faktúru slovenského alebo českého živnostníka. Po kontrole získate faktúru a podpísanú pôvodnú objednávku. AI pomáha doplniť údaje, ktoré bežné čítanie PDF nezachytí."}</p>
        <ol className="bl-workflow" aria-label={cs ? "Postup ve Fakturomatu" : "Postup vo Fakturomate"}>{(cs ? ["PDF objednávka", "Kontrola údajů", "Dva hotové dokumenty"] : ["PDF objednávka", "Kontrola údajov", "Dva hotové dokumenty"]).map(step => <li key={step}>{step}</li>)}</ol>
        <FakturomatDetails cs={cs} />
      </article>
      <article className="bl-software-project" id="trendatlas">
        <span className="bl-status">{cs ? "V provozu pro vlastní použití" : "V prevádzke pre vlastné použitie"}</span><h3>TrendAtlas</h3>
        <p className="bl-project-lead">{cs ? "Od tržních dat k automatickému obchodování." : "Od trhových dát k automatickému obchodovaniu."}</p>
        <p>{cs ? "Vlastní platforma propojuje kryptoměnovou strategii, Hyperliquid a webový dashboard. Pravidelně zpracuje data, zkontroluje podmínky, provede obchod a ověří skutečný stav účtu. Běží na vlastním Raspberry Pi serveru." : "Vlastná platforma prepája kryptomenovú stratégiu, Hyperliquid a webový dashboard. Pravidelne spracuje dáta, skontroluje podmienky, vykoná obchod a overí skutočný stav účtu. Beží na vlastnom Raspberry Pi serveri."}</p>
        <ul className="bl-project-tags"><li>{cs ? "Kontrola dat" : "Kontrola dát"}</li><li>{cs ? "Provedení obchodu" : "Vykonanie obchodu"}</li><li>{cs ? "Ověření výsledku" : "Overenie výsledku"}</li></ul>
        <TrendAtlasDetails cs={cs} />
      </article>
    </div>
    <div className="bl-more-projects"><p className="bl-eyebrow">{cs ? "Další projekty" : "Ďalšie projekty"}</p>
      <MoreProject title="Zmluvomat" summary={cs ? "Tvorba pracovních a obchodních dokumentů z dokladů." : "Tvorba pracovných a obchodných dokumentov z dokladov."} status={cs ? "Pro vlastní použití · ve vývoji" : "Pre vlastné použitie · vo vývoji"}><p>{cs ? "Načítá údaje z faktur a dokladů, zpracovává je hromadně a vytváří dokumenty s elektronickým podpisem." : "Načítava údaje z faktúr a dokladov, spracúva ich hromadne a vytvára dokumenty s elektronickým podpisom."}</p></MoreProject>
      <MoreProject title="Rentulo" summary={cs ? "Půjčování nářadí, vybavení a věcí mezi lidmi." : "Požičiavanie náradia, vybavenia a vecí medzi ľuďmi."} status={cs ? "Vývoj pozastaven" : "Vývoj pozastavený"}>
        <p>{cs ? "Marketplace vznikl do pokročilé fáze: nabídky s fotografiemi, hledání na mapě, dostupnost, rezervace a správa předání. Projekt počítá i s fotografiemi stavu věcí před půjčením a po vrácení." : "Marketplace vznikol do pokročilej fázy: ponuky s fotografiami, hľadanie na mape, dostupnosť, rezervácie a správa odovzdania. Projekt počíta aj s fotografiami stavu vecí pred požičaním a po vrátení."}</p>
        <p>{cs ? "Ukázka používá demonstrační nabídky. Automatické výplaty a úplné ověření identity zůstaly nedokončené." : "Ukážka používa demonštračné ponuky. Automatické výplaty a úplné overenie identity ostali nedokončené."}</p>
        <a href="https://rentulo.vercel.app/" className="bl-text-link">{cs ? "Otevřít ukázku Rentulo" : "Otvoriť ukážku Rentulo"}<Arrow diagonal /></a>
        <figure className="bl-supplied-visual"><Image src="/projects/rentulo-concept.png" alt={cs ? "Vizuální koncept Rentulo s nabídkou věcí k zapůjčení" : "Vizuálny koncept Rentulo s ponukou vecí na požičanie"} width={1535} height={1024} sizes="(max-width: 760px) 90vw, 900px" /><figcaption>{cs ? "Vizuální koncept produktu; zachycuje i plánované funkce." : "Vizuálny koncept produktu; zachytáva aj plánované funkcie."}</figcaption></figure>
      </MoreProject>
      <MoreProject title="imLayer" summary={cs ? "Paměť, která pomáhá AI pracovat s historií rozhodnutí." : "Pamäť, ktorá pomáha AI pracovať s históriou rozhodnutí."} status={cs ? "Výzkumný prototyp" : "Výskumný prototyp"}>
        <p>{cs ? "Z delší historie vybírá podstatné informace a skládá je do stručného stavu pro další rozhodnutí. Sleduje aktuálnost, rozpory a nejistotu, aby se staré informace nevydávaly za platné." : "Z dlhšej histórie vyberá podstatné informácie a skladá ich do stručného stavu pre ďalšie rozhodnutie. Sleduje aktuálnosť, rozpory a neistotu, aby sa staré informácie nevydávali za platné."}</p>
        <p>{cs ? "Prototyp se testuje na úlohách zákaznické podpory a ve výzkumné části TrendAtlasu. Vývoj porovnává přínos paměti i její náklady v konkrétních úlohách." : "Prototyp sa testuje na úlohách zákazníckej podpory a vo výskumnej časti TrendAtlasu. Vývoj porovnáva prínos pamäte aj jej náklady v konkrétnych úlohách."}</p>
        <p className="bl-tech-line">Python · Pydantic · API</p>
      </MoreProject>
    </div>
  </section>;
}

export function RoboticsProjects({ locale = "sk", standalone = false }: Props) {
  const cs = locale === "cs";
  const Heading = standalone ? "h1" : "h2";
  const prototype = cs ? "Funkční prototyp" : "Fungujúci prototyp";
  return <section className="bl-robotics bl-showcase" id="robotics"><div className="bl-wrap">
    <header className="bl-section-heading"><div><p className="bl-eyebrow">{cs ? "Robotika a hardware" : "Robotika a hardvér"}</p><Heading>BendaRobotics<span>.</span></Heading></div><p>{cs ? "Od vlastního plošného spoje po pohyb a ovládání. Projekty, které fungují i mimo obrazovku." : "Od vlastného plošného spoja po pohyb a ovládanie. Projekty, ktoré fungujú aj mimo obrazovky."}</p></header>
    <article className="bl-arm-project" id="roboticka-ruka"><div className="bl-arm-copy">
      <span className="bl-status">{prototype}</span><h3>Robotická ruka</h3><p className="bl-project-lead">{cs ? "Šest kanálů. Vlastní řízení." : "Šesť kanálov. Vlastné riadenie."}</p>
      <p>{cs ? "Vývoj začal webovým ovládáním se záznamem a přehráním pohybu. Novější sestava používá sériová serva Hiwonder HTS-25L, tři joysticky a vlastní displej. Tištěná základna s velkým ložiskem podpírá ruku; spodní servo zajišťuje její otáčení." : "Vývoj začal webovým ovládaním so záznamom a prehratím pohybu. Novšia zostava používa sériové servá Hiwonder HTS-25L, tri joysticky a vlastný displej. Tlačená základňa s veľkým ložiskom podopiera ruku; spodné servo zabezpečuje jej otáčanie."}</p>
      <ProjectPhoto src="/projects/robot-arm-serial.jpeg" width={1536} height={2048} caption={cs ? "Ruka se sériovými servy a vlastní kruhovou základnou." : "Ruka so sériovými servami a vlastnou kruhovou základňou."} className="bl-arm-photo" />
      <a href="#ovladanie-ruky" className="bl-text-link">{cs ? "Vyzkoušet simulaci pohybu" : "Vyskúšať simuláciu pohybu"}<Arrow /></a></div><div id="ovladanie-ruky"><MotionStudy locale={locale} /></div>
    </article>
    <ArmDetails cs={cs} />
    <ProjectDemo kind="platform" cs={cs} />
    <article id="mecanum" className="bl-robot-project bl-mecanum-project">
      <div className="bl-mecanum-overview">
        <ProjectPhoto src="/projects/mecanum-chassis.jpeg" width={1536} height={2048} caption={cs ? "První verze Mecanum robota s ručně vyrobenou deskou." : "Prvá verzia Mecanum robota s ručne vyrobenou doskou."} className="bl-prototype-photo" />
        <div className="bl-robot-project-copy"><span className="bl-status">{prototype}</span><h3>Mecanum robot</h3>
          <p>{cs ? "Čtyři kola umožňují pohyb vpřed, do stran i otáčení na místě. Robot přijímá povely přes Wi-Fi, nahlas přečte text operátora a přes dotykový displej mu vrátí odpověď člověka u robota." : "Štyri kolesá umožňujú pohyb vpred, do strán aj otáčanie na mieste. Robot prijíma povely cez Wi-Fi, nahlas prečíta text operátora a cez dotykový displej mu vráti odpoveď človeka pri robotovi."}</p>
          <p className="bl-project-detail">{cs ? "První desku jsem vyrobil ručně. Nový návrh už je připravený na leptání." : "Prvú dosku som vyrobil ručne. Nový návrh už je pripravený na leptanie."}</p>
          <MecanumDetails cs={cs} />
        </div>
      </div>
      <ProjectDemo kind="mecanum" cs={cs} defaultOpen />
    </article>
    <div className="bl-more-projects"><p className="bl-eyebrow">{cs ? "Další systémy a experimenty" : "Ďalšie systémy a experimenty"}</p>
      <MoreProject title="Hardware market ticker" summary={cs ? "Tržní a systémová data na samostatném zařízení." : "Trhové a systémové dáta na samostatnom zariadení."} status={cs ? "Funkční experimentální prototyp" : "Fungujúci experimentálny prototyp"}>
        <p>{cs ? "Zobrazuje kryptoměnová a systémová data mimo počítač. Propojuje vlastní software, displeje, síťová data a embedded hardware." : "Zobrazuje kryptomenové a systémové dáta mimo počítača. Prepája vlastný softvér, displeje, sieťové dáta a embedded hardvér."}</p>
        <ProjectDemo kind="ticker" cs={cs} />
      </MoreProject>
      <MoreProject id="krmicka" title={cs ? "Inteligentní krmítko" : "Inteligentná krmička"} summary={cs ? "Doplní misku podle její skutečné hmotnosti." : "Doplní misku podľa jej skutočnej hmotnosti."} status={prototype}>
        <div className="bl-more-project-overview">
          <ProjectPhoto src="/projects/feeder-prototype.jpeg" width={1536} height={2048} caption={cs ? "Sestavený prototyp krmítka s tištěnými díly." : "Zostavený prototyp krmičky s tlačenými dielmi."} className="bl-more-project-photo" />
          <div className="bl-more-project-copy">
            <p>{cs ? "Zváží obsah misky a doplní krmivo do cílové hmotnosti. Údaje zobrazuje na displeji; dávkování se ovládá tlačítky, po síti nebo přes Telegram." : "Odváži obsah misky a doplní krmivo do cieľovej hmotnosti. Údaje zobrazuje na displeji; dávkovanie sa ovláda tlačidlami, po sieti alebo cez Telegram."}</p>
            <p className="bl-project-detail">{cs ? "Mechanické díly jsem navrhl a vytiskl na 3D tiskárně. Funkční prototyp vznikl za 17 dní." : "Mechanické diely som navrhol a vytlačil na 3D tlačiarni. Funkčný prototyp vznikol za 17 dní."}</p>
            <FeederDetails cs={cs} />
          </div>
        </div>
      </MoreProject>
      <MoreProject title={cs ? "Chytré rolety a domácí automatizace" : "Smart rolety a domáca automatizácia"} summary={cs ? "Ovládání domácnosti používané každý den." : "Ovládanie domácnosti používané každý deň."} status={cs ? "Denně používaný systém" : "Denne používaný systém"}>
        <p>{cs ? "Servomotory ovládají rolety přes hlasové nebo AI příkazy, Raspberry Pi dashboard, web i lokální ovladač." : "Servomotory ovládajú rolety cez hlasové alebo AI príkazy, Raspberry Pi dashboard, web aj lokálny ovládač."}</p>
      </MoreProject>
      <MoreProject title="AI hologram interface" summary={cs ? "Digitální inteligence s fyzickou přítomností." : "Digitálna inteligencia s fyzickou prítomnosťou."} status={cs ? "Experimentální prototyp · ve vývoji" : "Experimentálny prototyp · vo vývoji"}>
        <p>{cs ? "Fyzické rozhraní s LED nebo holografickou tváří, hlasovým vstupem a Raspberry Pi napojeným na AI." : "Fyzické rozhranie s LED alebo holografickou tvárou, hlasovým vstupom a Raspberry Pi napojeným na AI."}</p>
        <figure className="bl-supplied-visual"><Image src="/projects/hologram-faces.png" alt={cs ? "Sada modrých holografických tváří s různými výrazy pro AI rozhraní" : "Sada modrých holografických tvárí s rôznymi výrazmi pre AI rozhranie"} width={1448} height={1086} sizes="(max-width: 760px) 90vw, 900px" /><figcaption>{cs ? "Vizuální podklady tváře pro AI rozhraní." : "Vizuálne podklady tváre pre AI rozhranie."}</figcaption></figure>
      </MoreProject>
    </div>
  </div></section>;
}

