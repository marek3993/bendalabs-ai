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
  const en = locale === "en";
  const Heading = standalone ? "h1" : "h2";
  const developing = en ? "Working project · in development" : cs ? "Funkční projekt · ve vývoji" : "Fungujúci projekt · vo vývoji";
  return <section id="labs" className="bl-labs bl-wrap bl-showcase">
    <header className="bl-section-heading"><div><p className="bl-eyebrow">{en ? "Software and AI" : cs ? "Software a AI" : "Softvér a AI"}</p><Heading>BendaLabs<span>.</span></Heading></div><p>{en ? "Less manual paperwork. Clearer insights from data. Original products built for specific tasks." : cs ? "Méně ruční práce s doklady. Lepší přehled v datech. Vlastní produkty pro konkrétní úkoly." : "Menej ručnej práce s dokladmi. Lepší prehľad v dátach. Vlastné produkty pre konkrétne úlohy."}</p></header>
    <div className="bl-labs-featured">
      <article className="bl-software-project" id="fakturomat">
        <span className="bl-status">{developing}</span><h3>Fakturomat</h3>
        <p className="bl-project-lead">{en ? "From purchase order to invoice." : cs ? "Z objednávky do faktury." : "Z objednávky do faktúry."}</p>
        <p>{en ? "Reads a PDF purchase order and prepares invoice details for Slovak or Czech sole traders. After reviewing the data, you receive an invoice and the original purchase order with a signature. AI helps fill in details that standard PDF extraction misses." : cs ? "Načte PDF objednávku a připraví údaje pro fakturu slovenského nebo českého živnostníka. Po kontrole získáte fakturu a podepsanou původní objednávku. AI pomáhá doplnit údaje, které běžné čtení PDF nezachytí." : "Načíta PDF objednávku a pripraví údaje pre faktúru slovenského alebo českého živnostníka. Po kontrole získate faktúru a podpísanú pôvodnú objednávku. AI pomáha doplniť údaje, ktoré bežné čítanie PDF nezachytí."}</p>
        <ol className="bl-workflow" aria-label={en ? "How Fakturomat works" : cs ? "Postup ve Fakturomatu" : "Postup vo Fakturomate"}>{(en ? ["PDF purchase order", "Review the details", "Two completed documents"] : cs ? ["PDF objednávka", "Kontrola údajů", "Dva hotové dokumenty"] : ["PDF objednávka", "Kontrola údajov", "Dva hotové dokumenty"]).map(step => <li key={step}>{step}</li>)}</ol>
        <FakturomatDetails cs={cs} en={en} />
      </article>
      <article className="bl-software-project" id="trendatlas">
        <span className="bl-status">{en ? "Running for personal use" : cs ? "V provozu pro vlastní použití" : "V prevádzke pre vlastné použitie"}</span><h3>TrendAtlas</h3>
        <p className="bl-project-lead">{en ? "From market data to automated trading." : cs ? "Od tržních dat k automatickému obchodování." : "Od trhových dát k automatickému obchodovaniu."}</p>
        <p>{en ? "A custom platform connects a cryptocurrency strategy, Hyperliquid and a web dashboard. It regularly processes data, checks trading conditions, executes trades and verifies the actual account state. It runs on a dedicated Raspberry Pi server." : cs ? "Vlastní platforma propojuje kryptoměnovou strategii, Hyperliquid a webový dashboard. Pravidelně zpracuje data, zkontroluje podmínky, provede obchod a ověří skutečný stav účtu. Běží na vlastním Raspberry Pi serveru." : "Vlastná platforma prepája kryptomenovú stratégiu, Hyperliquid a webový dashboard. Pravidelne spracuje dáta, skontroluje podmienky, vykoná obchod a overí skutočný stav účtu. Beží na vlastnom Raspberry Pi serveri."}</p>
        <ul className="bl-project-tags"><li>{en ? "Data checks" : cs ? "Kontrola dat" : "Kontrola dát"}</li><li>{en ? "Trade execution" : cs ? "Provedení obchodu" : "Vykonanie obchodu"}</li><li>{en ? "Result verification" : cs ? "Ověření výsledku" : "Overenie výsledku"}</li></ul>
        <TrendAtlasDetails cs={cs} en={en} />
      </article>
    </div>
    <div className="bl-more-projects"><p className="bl-eyebrow">{en ? "More projects" : cs ? "Další projekty" : "Ďalšie projekty"}</p>
      <MoreProject title="Zmluvomat" summary={en ? "Employment and business documents created from source records." : cs ? "Tvorba pracovních a obchodních dokumentů z dokladů." : "Tvorba pracovných a obchodných dokumentov z dokladov."} status={en ? "For personal use · in development" : cs ? "Pro vlastní použití · ve vývoji" : "Pre vlastné použitie · vo vývoji"}><p>{en ? "Extracts data from invoices and other records, processes it in batches and creates documents with electronic signatures. The project also includes an Opportunities section." : cs ? "Načítá údaje z faktur a dokladů, zpracovává je hromadně a vytváří dokumenty s elektronickým podpisem." : "Načítava údaje z faktúr a dokladov, spracúva ich hromadne a vytvára dokumenty s elektronickým podpisom."}</p></MoreProject>
      <MoreProject title="Rentulo" summary={en ? "Peer-to-peer rentals of tools, equipment and everyday items." : cs ? "Půjčování nářadí, vybavení a věcí mezi lidmi." : "Požičiavanie náradia, vybavenia a vecí medzi ľuďmi."} status={en ? "Development paused" : cs ? "Vývoj pozastaven" : "Vývoj pozastavený"}>
        <p>{en ? "The marketplace reached an advanced stage: photo listings, map search, availability, bookings and handover management. The project also envisages photos documenting the condition of items before rental and after return." : cs ? "Marketplace vznikl do pokročilé fáze: nabídky s fotografiemi, hledání na mapě, dostupnost, rezervace a správa předání. Projekt počítá i s fotografiemi stavu věcí před půjčením a po vrácení." : "Marketplace vznikol do pokročilej fázy: ponuky s fotografiami, hľadanie na mape, dostupnosť, rezervácie a správa odovzdania. Projekt počíta aj s fotografiami stavu vecí pred požičaním a po vrátení."}</p>
        <p>{en ? "The demo uses sample listings. Automated payouts and full identity verification remain unfinished." : cs ? "Ukázka používá demonstrační nabídky. Automatické výplaty a úplné ověření identity zůstaly nedokončené." : "Ukážka používa demonštračné ponuky. Automatické výplaty a úplné overenie identity ostali nedokončené."}</p>
        <a href="https://rentulo.vercel.app/" className="bl-text-link">{en ? "Open the Rentulo demo" : cs ? "Otevřít ukázku Rentulo" : "Otvoriť ukážku Rentulo"}<Arrow diagonal /></a>
        <figure className="bl-supplied-visual"><Image src="/projects/rentulo-concept.png" alt={en ? "Rentulo product concept showing items available to rent" : cs ? "Vizuální koncept Rentulo s nabídkou věcí k zapůjčení" : "Vizuálny koncept Rentulo s ponukou vecí na požičanie"} width={1535} height={1024} sizes="(max-width: 760px) 90vw, 900px" /><figcaption>{en ? "Product concept; also depicts planned features." : cs ? "Vizuální koncept produktu; zachycuje i plánované funkce." : "Vizuálny koncept produktu; zachytáva aj plánované funkcie."}</figcaption></figure>
      </MoreProject>
      <MoreProject title="imLayer" summary={en ? "Memory that helps AI work with past decisions." : cs ? "Paměť, která pomáhá AI pracovat s historií rozhodnutí." : "Pamäť, ktorá pomáha AI pracovať s históriou rozhodnutí."} status={en ? "Research prototype" : cs ? "Výzkumný prototyp" : "Výskumný prototyp"}>
        <p>{en ? "Selects relevant information from a longer history and condenses it into a concise state for the next decision. It tracks freshness, contradictions and uncertainty so outdated information is not treated as current." : cs ? "Z delší historie vybírá podstatné informace a skládá je do stručného stavu pro další rozhodnutí. Sleduje aktuálnost, rozpory a nejistotu, aby se staré informace nevydávaly za platné." : "Z dlhšej histórie vyberá podstatné informácie a skladá ich do stručného stavu pre ďalšie rozhodnutie. Sleduje aktuálnosť, rozpory a neistotu, aby sa staré informácie nevydávali za platné."}</p>
        <p>{en ? "The prototype is being tested on customer support tasks and in the research part of TrendAtlas. Development compares the benefits and costs of memory in specific tasks." : cs ? "Prototyp se testuje na úlohách zákaznické podpory a ve výzkumné části TrendAtlasu. Vývoj porovnává přínos paměti i její náklady v konkrétních úlohách." : "Prototyp sa testuje na úlohách zákazníckej podpory a vo výskumnej časti TrendAtlasu. Vývoj porovnáva prínos pamäte aj jej náklady v konkrétnych úlohách."}</p>
        <p className="bl-tech-line">Python · Pydantic · API</p>
      </MoreProject>
    </div>
  </section>;
}

export function RoboticsProjects({ locale = "sk", standalone = false }: Props) {
  const cs = locale === "cs";
  const en = locale === "en";
  const Heading = standalone ? "h1" : "h2";
  const prototype = en ? "Working prototype" : cs ? "Funkční prototyp" : "Fungujúci prototyp";
  return <section className="bl-robotics bl-showcase" id="robotics"><div className="bl-wrap">
    <header className="bl-section-heading"><div><p className="bl-eyebrow">{en ? "Robotics and hardware" : cs ? "Robotika a hardware" : "Robotika a hardvér"}</p><Heading>BendaRobotics<span>.</span></Heading></div><p>{en ? "From custom circuit boards to movement and control. Projects that work beyond the screen." : cs ? "Od vlastního plošného spoje po pohyb a ovládání. Projekty, které fungují i mimo obrazovku." : "Od vlastného plošného spoja po pohyb a ovládanie. Projekty, ktoré fungujú aj mimo obrazovky."}</p></header>
    <article className="bl-arm-project" id="roboticka-ruka"><div className="bl-arm-copy">
      <span className="bl-status">{prototype}</span><h3>{en ? "Robotic arm" : "Robotická ruka"}</h3><p className="bl-project-lead">{en ? "Six channels. Custom control." : cs ? "Šest kanálů. Vlastní řízení." : "Šesť kanálov. Vlastné riadenie."}</p>
      <p>{en ? "Development began with web controls and motion recording and playback. The newer assembly uses Hiwonder HTS-25L serial servos, three joysticks and a dedicated display. A printed base with a large bearing supports the arm; the bottom servo drives its rotation." : cs ? "Vývoj začal webovým ovládáním se záznamem a přehráním pohybu. Novější sestava používá sériová serva Hiwonder HTS-25L, tři joysticky a vlastní displej. Tištěná základna s velkým ložiskem podpírá ruku; spodní servo zajišťuje její otáčení." : "Vývoj začal webovým ovládaním so záznamom a prehratím pohybu. Novšia zostava používa sériové servá Hiwonder HTS-25L, tri joysticky a vlastný displej. Tlačená základňa s veľkým ložiskom podopiera ruku; spodné servo zabezpečuje jej otáčanie."}</p>
      <ProjectPhoto src="/projects/finished/robot-arm-v2.webp" width={1254} height={1254} caption={en ? "The arm with serial servos and a custom circular base." : cs ? "Ruka se sériovými servy a vlastní kruhovou základnou." : "Ruka so sériovými servami a vlastnou kruhovou základňou."} className="bl-arm-photo" />
      <a href="#ovladanie-ruky" className="bl-text-link">{en ? "Try the motion simulation" : cs ? "Vyzkoušet simulaci pohybu" : "Vyskúšať simuláciu pohybu"}<Arrow /></a></div><div id="ovladanie-ruky"><MotionStudy locale={locale} /></div>
    </article>
    <ArmDetails cs={cs} en={en} />
    <ProjectDemo kind="platform" cs={cs} en={en} />
    <article id="mecanum" className="bl-robot-project bl-mecanum-project">
      <div className="bl-mecanum-overview">
        <ProjectPhoto src="/projects/finished/mecanum-v2.webp" width={1086} height={1448} caption={en ? "The first Mecanum robot with a handmade circuit board." : cs ? "První verze Mecanum robota s ručně vyrobenou deskou." : "Prvá verzia Mecanum robota s ručne vyrobenou doskou."} className="bl-prototype-photo" />
        <div className="bl-robot-project-copy"><span className="bl-status">{prototype}</span><h3>Mecanum robot</h3>
          <p>{en ? "Four wheels allow forward and sideways movement and rotation on the spot. The robot receives commands over Wi-Fi, reads the operator's text aloud and sends back a person's response from its touchscreen." : cs ? "Čtyři kola umožňují pohyb vpřed, do stran i otáčení na místě. Robot přijímá povely přes Wi-Fi, nahlas přečte text operátora a přes dotykový displej mu vrátí odpověď člověka u robota." : "Štyri kolesá umožňujú pohyb vpred, do strán aj otáčanie na mieste. Robot prijíma povely cez Wi-Fi, nahlas prečíta text operátora a cez dotykový displej mu vráti odpoveď človeka pri robotovi."}</p>
          <p className="bl-project-detail">{en ? "I made the first circuit board by hand. The new design is ready for etching." : cs ? "První desku jsem vyrobil ručně. Nový návrh už je připravený na leptání." : "Prvú dosku som vyrobil ručne. Nový návrh už je pripravený na leptanie."}</p>
          <MecanumDetails cs={cs} en={en} />
        </div>
      </div>
      <ProjectDemo kind="mecanum" cs={cs} en={en} defaultOpen />
    </article>
    <div className="bl-more-projects"><p className="bl-eyebrow">{en ? "More systems and experiments" : cs ? "Další systémy a experimenty" : "Ďalšie systémy a experimenty"}</p>
      <MoreProject title="Crypto Ticker Display" summary={en ? "Market and system data on a standalone device." : cs ? "Tržní a systémová data na samostatném zařízení." : "Trhové a systémové dáta na samostatnom zariadení."} status={en ? "Working experimental prototype" : cs ? "Funkční experimentální prototyp" : "Fungujúci experimentálny prototyp"}>
        <p>{en ? "Displays cryptocurrency and system data away from the computer. It connects custom software, displays, network data and embedded hardware." : cs ? "Zobrazuje kryptoměnová a systémová data mimo počítač. Propojuje vlastní software, displeje, síťová data a embedded hardware." : "Zobrazuje kryptomenové a systémové dáta mimo počítača. Prepája vlastný softvér, displeje, sieťové dáta a embedded hardvér."}</p>
        <ProjectDemo kind="ticker" cs={cs} en={en} />
      </MoreProject>
      <MoreProject id="krmicka" title={en ? "Smart feeder" : cs ? "Inteligentní krmítko" : "Inteligentná krmička"} summary={en ? "Tops up the bowl based on its actual weight." : cs ? "Doplní misku podle její skutečné hmotnosti." : "Doplní misku podľa jej skutočnej hmotnosti."} status={prototype}>
        <div className="bl-more-project-overview">
          <ProjectPhoto src="/projects/finished/feeder-v2.webp" width={1086} height={1448} caption={en ? "The assembled feeder prototype with printed parts." : cs ? "Sestavený prototyp krmítka s tištěnými díly." : "Zostavený prototyp krmičky s tlačenými dielmi."} className="bl-more-project-photo" />
          <div className="bl-more-project-copy">
            <p>{en ? "Weighs the contents of the bowl and dispenses food to a target weight. Readings appear on a display; dispensing can be controlled with buttons, over the network or through Telegram." : cs ? "Zváží obsah misky a doplní krmivo do cílové hmotnosti. Údaje zobrazuje na displeji; dávkování se ovládá tlačítky, po síti nebo přes Telegram." : "Odváži obsah misky a doplní krmivo do cieľovej hmotnosti. Údaje zobrazuje na displeji; dávkovanie sa ovláda tlačidlami, po sieti alebo cez Telegram."}</p>
            <p className="bl-project-detail">{en ? "I designed and 3D-printed the mechanical parts. The working prototype took 17 days to build." : cs ? "Mechanické díly jsem navrhl a vytiskl na 3D tiskárně. Funkční prototyp vznikl za 17 dní." : "Mechanické diely som navrhol a vytlačil na 3D tlačiarni. Funkčný prototyp vznikol za 17 dní."}</p>
            <FeederDetails cs={cs} en={en} />
          </div>
        </div>
      </MoreProject>
      <MoreProject title={en ? "Smart blinds and home automation" : cs ? "Chytré rolety a domácí automatizace" : "Smart rolety a domáca automatizácia"} summary={en ? "Home controls used every day." : cs ? "Ovládání domácnosti používané každý den." : "Ovládanie domácnosti používané každý deň."} status={en ? "System in daily use" : cs ? "Denně používaný systém" : "Denne používaný systém"}>
        <p>{en ? "Servomotors control the blinds through voice or AI commands, a Raspberry Pi dashboard, the web and a local controller." : cs ? "Servomotory ovládají rolety přes hlasové nebo AI příkazy, Raspberry Pi dashboard, web i lokální ovladač." : "Servomotory ovládajú rolety cez hlasové alebo AI príkazy, Raspberry Pi dashboard, web aj lokálny ovládač."}</p>
      </MoreProject>
      <MoreProject title="AI hologram interface" summary={en ? "An AI assistant with a holographic face, voice and memory." : cs ? "AI asistent s holografickou tváří, hlasem a pamětí." : "AI asistent s holografickou tvárou, hlasom a pamäťou."} status={en ? "Experimental prototype · in development" : cs ? "Experimentální prototyp · ve vývoji" : "Experimentálny prototyp · vo vývoji"}>
        <p>{en ? "The prototype connects a rotating holographic display to a Raspberry Pi, microphone and speaker. The AI assistant listens, speaks and accompanies the conversation with facial expressions timed to match it. This creates the impression of talking to a hologram present in the room." : cs ? "Prototyp propojuje rotující holografický displej s Raspberry Pi, mikrofonem a reproduktorem. AI asistent poslouchá, odpovídá hlasem a doprovází rozhovor výrazy tváře načasovanými podle jeho průběhu. Vzniká tak dojem, že člověk mluví s hologramem přítomným v místnosti." : "Prototyp prepája rotujúci holografický displej s Raspberry Pi, mikrofónom a reproduktorom. AI asistent počúva, odpovedá hlasom a sprevádza rozhovor výrazmi tváre načasovanými podľa jeho priebehu. Vzniká tak dojem, že človek hovorí s hologramom prítomným v miestnosti."}</p>
        <h4>{en ? "Custom personality and memory" : cs ? "Vlastní charakter a paměť" : "Vlastný charakter a pamäť"}</h4>
        <p>{en ? "I designed and configured the assistant's personality, behaviour rules and tasks myself. I can give it new information and instructions during a conversation. It stores them in memory and uses them in later interactions, so each conversation does not have to start from scratch." : cs ? "Charakter asistenta, pravidla jeho chování a úkoly, které má plnit, jsem navrhl a nastavil sám. Nové informace a pokyny mu mohu předávat přímo během rozhovoru. Ukládá si je do paměti a využívá je v další komunikaci, takže interakce nemusí pokaždé začínat od nuly." : "Charakter asistenta, pravidlá jeho správania a úlohy, ktoré má plniť, som navrhol a nastavil sám. Nové informácie a pokyny mu môžem odovzdávať priamo počas rozhovoru. Ukladá si ich do pamäti a využíva ich v ďalšej komunikácii, takže interakcia nemusí zakaždým začínať od nuly."}</p>
        <h4>{en ? "From conversation to home control" : cs ? "Od rozhovoru k ovládání domácnosti" : "Od rozhovoru k ovládaniu domácnosti"}</h4>
        <p>{en ? "The assistant is also connected to the blinds. It can recognise the intent of an everyday sentence and identify the relevant device. If I say, “The right side of the room is too dark,” it recognises the need for more light and raises only the right blind. Natural conversation becomes a specific action in the room without an exact control command." : cs ? "Asistent je propojený také s ovládáním rolet. Z běžné věty dokáže rozpoznat záměr a určit, kterého zařízení se týká. Když řeknu „Na pravé straně pokoje mám příliš šero“, vyhodnotí potřebu více světla a zvedne pouze pravou roletu. Přirozený rozhovor se tak mění v konkrétní akci v místnosti, bez nutnosti vyslovit přesný ovládací příkaz." : "Asistent je prepojený aj s ovládaním roliet. Z bežnej vety dokáže rozpoznať zámer a určiť, ktorého zariadenia sa týka. Keď poviem „Na pravej strane izby mám príliš šero“, vyhodnotí potrebu viac svetla a zdvihne iba pravú roletu. Prirodzený rozhovor sa tak mení na konkrétnu akciu v miestnosti, bez potreby vysloviť presný ovládací príkaz."}</p>
        <figure className="bl-supplied-visual"><Image src="/projects/hologram-faces.png" alt={en ? "Blue holographic faces with different expressions for the AI interface" : cs ? "Sada modrých holografických tváří s různými výrazy pro AI rozhraní" : "Sada modrých holografických tvárí s rôznymi výrazmi pre AI rozhranie"} width={1448} height={1086} sizes="(max-width: 760px) 90vw, 900px" /><figcaption>{en ? "Face artwork for the AI interface." : cs ? "Vizuální podklady tváře pro AI rozhraní." : "Vizuálne podklady tváre pre AI rozhranie."}</figcaption></figure>
      </MoreProject>
    </div>
  </div></section>;
}

