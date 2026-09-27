import Image from "next/image";
import type { ReactNode } from "react";
import { Arrow } from "./brand-shell";

export function ProjectPhoto({ src, caption, width, height, className = "" }: {
  src: string; caption: string; width: number; height: number; className?: string;
}) {
  return <figure className={`bl-project-photo ${className}`}>
    <a href={src} target="_blank" rel="noreferrer" aria-label={caption}>
      <Image src={src} alt={caption} width={width} height={height} sizes="(max-width: 760px) 90vw, 550px" />
      <span className="bl-photo-zoom" aria-hidden="true"><Arrow diagonal /></span>
    </a>
    <figcaption>{caption}</figcaption>
  </figure>;
}

export function ProjectDetails({ title, children }: { title: string; children: ReactNode }) {
  return <details className="bl-case-details"><summary>{title}<span aria-hidden="true">+</span></summary><div className="bl-case-content">{children}</div></details>;
}

export function FakturomatDetails({ cs }: { cs: boolean }) {
  return <ProjectDetails title={cs ? "Jak Fakturomat funguje" : "Ako Fakturomat funguje"}>
    <h4>{cs ? "Kontrola před vystavením" : "Kontrola pred vystavením"}</h4>
    <p>{cs ? "Aplikace nejprve načte text a rozložení PDF. AI doplní chybějící údaje, aniž by přepsala již ověřené hodnoty. Neúplné výsledky zůstanou zachované a uživatel doplní jen to, co chybí." : "Aplikácia najprv načíta text a rozloženie PDF. AI doplní chýbajúce údaje bez prepísania už overených hodnôt. Neúplné výsledky ostanú zachované a používateľ doplní len to, čo chýba."}</p>
    <h4>{cs ? "Dva hotové dokumenty" : "Dva hotové dokumenty"}</h4>
    <p>{cs ? "Po kontrole vznikne PDF faktura a původní objednávka s vloženým podpisem. Číslování, přístup k dokumentům i historii spravuje server. Profil dodavatele lze načíst z jeho předchozí faktury." : "Po kontrole vznikne PDF faktúra a pôvodná objednávka s vloženým podpisom. Číslovanie, prístup k dokumentom aj históriu spravuje server. Profil dodávateľa sa dá načítať z jeho predchádzajúcej faktúry."}</p>
    <h4>{cs ? "Další vývoj" : "Ďalší vývoj"}</h4>
    <p>{cs ? "Samostatná mobilní aplikace pro iOS a Android je ve vývoji." : "Samostatná mobilná aplikácia pre iOS a Android je vo vývoji."}</p>
    <p className="bl-tech-line">Next.js · TypeScript · Supabase · PDF · OpenAI</p>
  </ProjectDetails>;
}

export function TrendAtlasDetails({ cs }: { cs: boolean }) {
  return <ProjectDetails title={cs ? "Jak TrendAtlas funguje" : "Ako TrendAtlas funguje"}>
    <h4>{cs ? "Od dat po kontrolu obchodu" : "Od dát po kontrolu obchodu"}</h4>
    <p>{cs ? "Systém načte tržní data, vyhodnotí strategii a zkontroluje podmínky pro obchod. Po odeslání objednávky přes Hyperliquid ověří skutečnou pozici na účtu. Při obnově kontroluje předchozí objednávky, aby je zbytečně neopakoval." : "Systém načíta trhové dáta, vyhodnotí stratégiu a skontroluje podmienky na obchod. Po odoslaní objednávky cez Hyperliquid overí skutočnú pozíciu na účte. Pri obnove kontroluje predchádzajúce objednávky, aby ich zbytočne neopakoval."}</p>
    <h4>{cs ? "Vlastní server a dohled" : "Vlastný server a dohľad"}</h4>
    <p>{cs ? "Provoz na Raspberry Pi zahrnuje plánované výpočty, kontrolu aktuálnosti dat a obnovu vybraných chyb. Dashboard odděluje výsledky modelu od skutečného účtu." : "Prevádzka na Raspberry Pi zahŕňa plánované výpočty, kontrolu aktuálnosti dát a obnovu vybraných chýb. Dashboard oddeľuje výsledky modelu od skutočného účtu."}</p>
    <h4>{cs ? "Výzkum má vlastní prostor" : "Výskum má vlastný priestor"}</h4>
    <p>{cs ? "Experimentální AI nástroje pomáhají zkoumat tržní vzorce. Jejich výstupy samy nemění strategii používanou při obchodování." : "Experimentálne AI nástroje pomáhajú skúmať trhové vzorce. Ich výstupy samy nemenia stratégiu používanú pri obchodovaní."}</p>
    <p className="bl-tech-line">Python · Pandas · Streamlit · Plotly · Hyperliquid · Raspberry Pi</p>
  </ProjectDetails>;
}

export function ArmDetails({ cs }: { cs: boolean }) {
  return <ProjectDetails title={cs ? "Vývoj ruky a skutečné ovládání" : "Vývoj ruky a skutočné ovládanie"}>
    <div className="bl-detail-columns">
      <div><h4>{cs ? "Od PWM k sériovým servům" : "Od PWM k sériovým servám"}</h4><p>{cs ? "Původní zapojení s Arduino Mega a PCA9685 postupně nahradila sériová serva Hiwonder HTS-25L. Každé má vlastní adresu a umí vracet polohu, napětí a teplotu. Novější lokální řízení pracuje s nastaveným rozsahem pohybu a rychlostí serv." : "Pôvodné zapojenie s Arduino Mega a PCA9685 postupne nahradili sériové servá Hiwonder HTS-25L. Každé má vlastnú adresu a vie vracať polohu, napätie a teplotu. Novšie lokálne riadenie pracuje s nastaveným rozsahom pohybu a rýchlosťou serv."}</p></div>
      <div><h4>{cs ? "Co funguje a co následuje" : "Čo funguje a čo nasleduje"}</h4><p>{cs ? "Původní sestava ověřila webové řízení šesti kanálů i záznam a přehrání pohybu. Novější sestava se sériovými servy přidává lokální řízení třemi joysticky a displej. Kamera, LiDAR a autonomní AI plánování jsou další plánované kroky." : "Pôvodná zostava overila webové riadenie šiestich kanálov aj záznam a prehratie pohybu. Novšia zostava so sériovými servami pridáva lokálne riadenie tromi joystickmi a displej. Kamera, LiDAR a autonómne AI plánovanie sú ďalšie plánované kroky."}</p></div>
    </div>
    <h4>{cs ? "Ložisko nese konstrukci, servo ji otáčí" : "Ložisko nesie konštrukciu, servo ju otáča"}</h4>
    <p>{cs ? "Vlastní platforma přenáší zatížení ruky přes otočné ložisko do pevné základny. Spodní servo tak nemusí podpírat celou sestavu. Upravený horní díl má prostor pro dvě serva ohybu ramene, která mohou pracovat společně." : "Vlastná platforma prenáša zaťaženie ruky cez otočné ložisko do pevnej základne. Spodné servo tak nemusí podopierať celú zostavu. Upravený horný diel má priestor pre dve servá ohybu ramena, ktoré môžu pracovať spoločne."}</p>
    <p>{cs ? "Ložisko má vnější průměr 120 mm, vnitřní 70 mm a výšku 8,5 mm. Tělo serva HTS-25L měří 40 × 20 × 40,5 mm. Skutečná síla celé ruky závisí také na délce ramen, napájení a sladění serv." : "Ložisko má vonkajší priemer 120 mm, vnútorný 70 mm a výšku 8,5 mm. Telo serva HTS-25L meria 40 × 20 × 40,5 mm. Skutočná sila celej ruky závisí aj od dĺžky ramien, napájania a zosúladenia serv."}</p>
    <div className="bl-part-sources"><a className="bl-text-link" href="https://www.hiwonder.com/products/hts-25l" target="_blank" rel="noreferrer">Hiwonder HTS-25L<Arrow diagonal /></a><a className="bl-text-link" href="https://allegro.pl/oferta/podstawa-obrotowa-360-lozysko-obrotowe-obrotowego-krzesla-mebli-obracajace-15707167147" target="_blank" rel="noreferrer">{cs ? "Použité otočné ložisko" : "Použité otočné ložisko"}<Arrow diagonal /></a></div>
    <ProjectPhoto src="/projects/robot-arm-controller.png" width={2499} height={606} caption={cs ? "Webové ovládání s 2D modelem, posuvníky a záznamem pohybu." : "Webové ovládanie s 2D modelom, posuvníkmi a záznamom pohybu."} className="bl-controller-photo" />
    <div className="bl-photo-grid">
      <ProjectPhoto src="/projects/finished/robot-arm-base-v2.webp" width={1500} height={1600} caption={cs ? "Vlastní základna ramene během sestavování." : "Vlastná základňa ramena počas zostavovania."} />
      <ProjectPhoto src="/projects/finished/robot-arm-bus-servo-v2.webp" width={1200} height={1600} caption={cs ? "Detail sériového serva v konstrukci ramene." : "Detail sériového serva v konštrukcii ramena."} />
    </div>
  </ProjectDetails>;
}

export function MecanumDetails({ cs }: { cs: boolean }) {
  return <ProjectDetails title={cs ? "Komunikace a vlastní elektronika" : "Komunikácia a vlastná elektronika"}>
    <p>{cs ? "Robot přehrává text napsaný operátorem. Slovenskou řeč vytváří lokální server s Piper TTS a robot ji přijímá přes Wi-Fi. Na dotykovém displeji může člověk u robota odpovědět na otázku; odpověď se vrátí do ovládacího panelu." : "Robot prehráva text napísaný operátorom. Slovenskú reč vytvára lokálny server s Piper TTS a robot ju prijíma cez Wi-Fi. Na dotykovom displeji môže človek pri robotovi odpovedať na otázku; odpoveď sa vráti do ovládacieho panela."}</p>
    <p>{cs ? "Motorové řízení, hlas a dotyková komunikace fungují. První verze vznikla na ručně vyrobené desce plošných spojů. Nový návrh desky je hotový a připravený na leptání. Živý kamerový přenos je další krok vývoje." : "Motorové riadenie, hlas a dotyková komunikácia fungujú. Prvá verzia vznikla na ručne vyrobenej doske plošných spojov. Nový návrh dosky je hotový a pripravený na leptanie. Živý kamerový prenos je ďalší krok vývoja."}</p>
    <h4>{cs ? "První verze: ruční výroba" : "Prvá verzia: ručná výroba"}</h4>
    <div className="bl-photo-grid">
      <ProjectPhoto src="/projects/finished/mecanum-pcb-components-v2.webp" width={1200} height={1600} caption={cs ? "První prototyp: osazená, ručně vyrobená deska." : "Prvý prototyp: osadená, ručne vyrobená doska."} />
      <ProjectPhoto src="/projects/finished/mecanum-pcb-traces-v2.webp" width={1152} height={1536} caption={cs ? "Detail měděných cest a pájených spojů první verze." : "Detail medených ciest a spájkovaných spojov prvej verzie."} />
    </div>
    <div className="bl-pcb-update">
      <span className="bl-status">{cs ? "Nová deska · připravená na leptání" : "Nová doska · pripravená na leptanie"}</span>
      <h4>{cs ? "Vlastní návrh pro další verzi" : "Vlastný návrh pre ďalšiu verziu"}</h4>
      <p>{cs ? "Deska o rozměrech 100 × 130 mm má připravené předlohy pro přenos horní i spodní strany. Součástí návrhu je i značka Benda Robotics. Následuje leptání, osazení a ověření na robotovi." : "Doska s rozmermi 100 × 130 mm má pripravené predlohy na prenos hornej aj spodnej strany. Súčasťou návrhu je aj značka Benda Robotics. Nasleduje leptanie, osadenie a overenie na robotovi."}</p>
      <ProjectPhoto src="/projects/mecanum-pcb-design.png" width={1460} height={1160} caption={cs ? "Náhled nového návrhu desky a značky Benda Robotics." : "Náhľad nového návrhu dosky a značky Benda Robotics."} />
      <a className="bl-text-link" href="/projects/mecanum-pcb-transfer.pdf" target="_blank" rel="noreferrer">{cs ? "Prohlédnout předlohu obou stran (PDF)" : "Pozrieť predlohu oboch strán (PDF)"}<Arrow diagonal /></a>
    </div>
    <p className="bl-tech-line">ESP32-S3 · TB6612FNG · FastAPI · Piper TTS · I²S</p>
  </ProjectDetails>;
}

export function FeederDetails({ cs }: { cs: boolean }) {
  return <ProjectDetails title={cs ? "Od 3D návrhu po vážení" : "Od 3D návrhu po váženie"}>
    <div className="bl-photo-grid">
      <ProjectPhoto src="/projects/finished/feeder-design-v2.webp" width={1441} height={1600} caption={cs ? "Příprava nádoby pro 3D tisk." : "Príprava nádoby na 3D tlač."} />
      <ProjectPhoto src="/projects/finished/feeder-weighing-v2.webp" width={1600} height={1200} caption={cs ? "Miska a ovládání během stavby prototypu." : "Miska a ovládanie počas stavby prototypu."} />
    </div>
  </ProjectDetails>;
}
