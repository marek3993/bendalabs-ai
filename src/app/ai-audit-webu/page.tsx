import type { Metadata } from "next";
import ServicePageTemplate from "@/components/bendalabs/service-page-template";

export const metadata: Metadata = {
  title: "AI audit webu | BendaLabs",
  description:
    "AI audit webu ukaze, ci sa web hodi na AI vrstvu, kde sa lame konverzia a ako ma vyzerat prva faza nasadenia.",
};

const sections = [
  {
    id: "hodnoti",
    label: "Co audit hodnoti",
    title: "Audit nehodnoti, ci je web pekny. Hodnoti, ci vie cloveka dostat do spravneho flowu.",
    description:
      "Pozriem sa na to, ako sa navstevnik rozhoduje, kde sa straca a ci ma AI vrstva realny priestor zlepsit vykon. Zaujima ma, ci je problem v navigacii, produktovej logike, formulároch alebo v tom, ze web nevie pracovat s intentom.",
    surface: "soft" as const,
    cards: [
      {
        title: "Rozhodovacie miesta",
        text: "Kde musi navstevnik zvolit kategoriu, produkt, kalkulacku alebo formulár skor, ako ma dost informacii na spravne rozhodnutie.",
      },
      {
        title: "Lomy konverzie",
        text: "Kde ludia odpadaju pred formularom, medzi detailom a objednavkou alebo pri prechode do kontaktu.",
      },
      {
        title: "Sila use-casov",
        text: "Ci navstevnici prichadzaju s konkretnou ulohou a ci im web vie odporucit spravny dalsi krok bez bludenia.",
      },
      {
        title: "Pripravenost na AI vrstvu",
        text: "Ci je obsah, struktura a flow webu dost jasny na to, aby AI vrstva priniesla meratelny efekt uz v prvej faze.",
      },
    ],
  },
  {
    id: "dostanete",
    label: "Co dostanete",
    title: "Vystupom nie je vseobecny report. Vystupom je rozhodnutie, co nasadit ako prve.",
    description:
      "Audit ma pomoct rozhodnut, ci nasadenie dava zmysel, kde zacat a co nema zmysel robit hned. Bez tejto vrstvy sa casto riesi design alebo obsah, kym skutocny problem zostava v nespravnom toku navstevnika.",
    surface: "white" as const,
    bullets: [
      "Zrozumitelny nazor, ci je web vhodny na AI vrstvu a ktore use-casy maju najvyssiu sancu na prinos.",
      "Zoznam miest, kde sa dnes lame konverzia a preco tam ludia odpadaju.",
      "Navrh prvej fazy nasadenia: kde zacat, co presne ma AI vrstva robit a ake vetvy riesit najprv.",
      "Odporucanie, co sa oplati merat hned po spusteni, aby bolo jasne, ci nasadenie funguje.",
    ],
  },
  {
    id: "meranie",
    label: "Co sa bude merat po nasadeni",
    title: "Po nasadeni sa nehodnoti dojem. Hodnoti sa pohyb navstevnika a dopad na dopyt.",
    description:
      "Ak sa AI vrstva nasadi, musi byt od prveho dna jasne, co je uspech. Zaujima nas, ci ludia trafia spravne flowy, ci sa skracuje cesta ku konverzii a ci obchod dostava kvalitnejsie vstupy.",
    surface: "tint" as const,
    bullets: [
      "Kolko navstevnikov sa z intent vstupu dostalo do spravneho flowu bez bludenia cez menu a filtre.",
      "Pokles odpadu pred formularom, rezervaciou alebo objednavkou.",
      "Zmena v pocte dokoncenych dopytov alebo rezervacii po nasadeni prvej fazy.",
      "Miera prijatia odporucenych dalsich krokov alebo suvisiacich produktov.",
      "Kde sa stale objavuje trenie a co treba doladit v dalsom kole.",
    ],
  },
  {
    id: "cennik",
    label: "Cennik",
    title: "Cennik je pevny. Rozdiel je len v tom, aka zlozitost dava zmysel pre vas web.",
    description:
      "Ak web potrebuje len jednu rozhodovaciu vrstvu, implementacia je jednoduchsia. Ak ma viac vetiev, viac typov formularov alebo silnejsiu produktovu logiku, ide o zlozitejsie nasadenie.",
    surface: "white" as const,
    statements: [
      "Jednoduchšia implementácia — 1 500 € jednorazovo",
      "Zložitejšia implementácia — 2 500 € jednorazovo",
      "Mesačné doladenie — 190 € / mesiac",
      "AI computing power — odhad 10 až 100 € / mesiac, podľa reálneho používania, cez OpenAI účet klienta",
    ],
  },
] as const;

export default function AuditPage() {
  return (
    <ServicePageTemplate
      eyebrow="AI audit webu"
      title="AI audit webu"
      subtitle="Ukážem, či sa váš web hodí na AI vrstvu, kde sa láme konverzia a ako môže vyzerať prvá fáza nasadenia."
      heroChips={[
        "Audit vhodnosti pre AI vrstvu",
        "Miesta, kde sa lame konverzia",
        "Prva faza nasadenia",
      ]}
      sections={sections}
      ctaTitle="Poslite web a poviem vam, ci ma AI vrstva zmysel uz teraz alebo az po uprave flowov."
      ctaText="Staci URL a kratky popis, kde sa dnes stracaju navstevnici alebo dopyty. Vratim sa s konkretnym nazorom na vhodnost, prvu fazu a realny rozsah implementacie."
      ctaButtonLabel="Objednat AI audit webu"
      ctaMailSubject="AI audit webu"
    />
  );
}
