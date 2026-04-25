import type { Metadata } from "next";
import ServicePageTemplate from "@/components/bendalabs/service-page-template";

export const metadata: Metadata = {
  title: "AI vrstva pre marketplace a rental weby | BendaLabs",
  description:
    "AI vrstva, ktora naviguje navstevnika podla ulohy, nie podla nazvu produktu, a skracuje cestu k rezervacii alebo objednavke.",
};

const sections = [
  {
    id: "problem",
    label: "Problem",
    title: "Marketplace a rental weby casto neprehravaju na ponuke. Prehravaju na orientacii.",
    description:
      "Velke mnozstvo kategorii, filtrov a typov ponuk vyzera dobre v produktovej mape. Pre navstevnika je to casto brzda. Neprichadza s nazvom produktu. Prichadza s ulohou, ktoru chce vyriesit teraz.",
    surface: "soft" as const,
    cards: [
      {
        title: "Prilis vela kategorii",
        text: "Ak ma web vela vetiev, clovek musi najprv pochopit internu logiku katalogu. To je zla pozicia hned na zaciatku.",
      },
      {
        title: "Filtre nepracuju s intentom",
        text: "Pouzivatel nevie, ci potrebuje vapku, brusku alebo kompletny set. Vie len, ze chce cez vikend vyriesit terasu alebo plot.",
      },
      {
        title: "Menu nepozna konkretnu situaciu",
        text: "Klasicka navigacia nepovie, co je najlepsi dalsi krok pre dany use-case, termin, rozpocet alebo sposob pouzitia.",
      },
      {
        title: "Rezervacia je prilis daleko",
        text: "Kazdy nadbytocny klik medzi prvou potrebou a rezervaciou zvysuje sancu, ze clovek odide alebo zavola konkurencii.",
      },
    ],
  },
  {
    id: "rentulo",
    label: "Rentulo use-case",
    title: "Rentulo typ use-casu je presne miesto, kde AI vrstva dava zmysel.",
    description:
      "Pouzivatel nepride s tym, ze chce konkretny model stroja. Napise, ze potrebuje na vikend vycistit zamkovu dlazbu, zbrusit stary plot alebo odvrtat jadro. To je vstup, s ktorym ma web pracovat.",
    surface: "white" as const,
    cards: [
      {
        title: "Uloha namiesto produktu",
        text: "Web si zoberie vetu vo vlastnych slovach a prelozi ju na konkretny typ produktu, sluzby alebo rezervacneho flowu.",
      },
      {
        title: "Spravna ponuka na prvy pokus",
        text: "AI odporuci spravny produkt alebo ponuku bez toho, aby navstevnik musel rucne prechadzat viac kategorii a technickych parametrov.",
      },
      {
        title: "Dalsi krok bez bludenia",
        text: "Ak dopyt nie je pripraveny na rezervaciu, vrstva posle cloveka na relevantny detail, porovnanie alebo kontakt. Nie spat na zoznam.",
      },
      {
        title: "Menej prazdnych navstev",
        text: "Aj pri sirsej ponuke sa zvysi podiel ludi, ktori sa dostanu do realneho objednavkoveho alebo rezervacneho procesu.",
      },
    ],
  },
  {
    id: "co-robi",
    label: "Co robi AI vrstva",
    title: "AI vrstva skrati rozhodovanie aj cestu k objednavke.",
    description:
      "Vrstva priradi intent ku konkretnej casti webu a odporuci spravny produkt, ponuku alebo dalsi krok. Pracuje s ulohou navstevnika, nie len s taxonomiou katalogu.",
    surface: "tint" as const,
    bullets: [
      "Rozpozna, ci clovek hlada produkt, rezervaciu, doplnkovu sluzbu alebo len potrebuje pomoct s vyberom.",
      "Odporuci spravny produkt alebo ponuku aj vtedy, ked navstevnik nepozna presny nazov kategorie.",
      "Posle cloveka rovno na dalsi krok, ktory zvysuje sancu na rezervaciu alebo objednavku.",
      "Vie navrhnut aj suvisiacu ponuku, ak dava zmysel pre dany use-case alebo termin pouzitia.",
      "Znizi pocet navstevnikov, ktori sa stratia medzi kategoriami a filtrami bez akcie.",
    ],
  },
  {
    id: "prinos",
    label: "Co to prinesie",
    title: "Prinos je jednoduchy. Menej hladania, viac objednavok z existujucej navstevnosti.",
    description:
      "Nasadenie sa oplati tam, kde web nepotrebuje krajsi filter, ale rychlejsie priradenie potreby ku konkretnej ponuke. To je priamo viditelne na rezervaciach, objednavkach aj kvalite navstev, ktore sa dostanu do finalneho kroku.",
    surface: "white" as const,
    bullets: [
      "Kratsia cesta od prveho dotazu po rezervaciu alebo objednavku.",
      "Vyssi podiel navstevnikov, ktori trafia spravny produkt na prvy pokus.",
      "Menej odpadnutych navstev medzi zoznamom, detailom a kosikom alebo rezervacnym formularom.",
      "Lepsie data o tom, s akou ulohou ludia realne prichadzaju na web.",
      "Jasnejsie miesto, kde doladovat obsah, kategoriu alebo obchodne pravidla.",
    ],
  },
] as const;

export default function MarketplaceAndRentalPage() {
  return (
    <ServicePageTemplate
      eyebrow="AI vrstva pre marketplace a rental weby"
      title="AI vrstva pre marketplace a rental weby"
      subtitle="Návštevník nemusí hľadať cez menu a kategórie. Napíše, čo chce urobiť, a web ho tam dovedie."
      heroChips={[
        "Vela kategorii a filtrov",
        "Intent podla ulohy",
        "Kratsia cesta k rezervacii",
      ]}
      sections={sections}
      ctaTitle="Ak mate marketplace alebo rental web, pozriem sa, kde sa dnes zbytocne predlzuje cesta k rezervacii."
      ctaText="Poslite URL, hlavne use-casy a vetvy, kde musia ludia najviac hladat. Vratim sa s konkretnym nazorom, ci AI vrstva vie skracovat cestu k objednavke uz v prvej faze."
      ctaButtonLabel="Poslat marketplace alebo rental web"
      ctaMailSubject="AI vrstva pre marketplace alebo rental web"
    />
  );
}
