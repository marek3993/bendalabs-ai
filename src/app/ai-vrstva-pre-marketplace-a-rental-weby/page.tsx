import type { Metadata } from "next";
import AuditBot from "@/components/bendalabs/audit-bot";
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
        text: "Pouzivatel nevie, ci potrebuje konkretny produkt, sluzbu alebo cely set. Vie len, co chce spravit a v akom case.",
      },
      {
        title: "Menu nepozna konkretnu situaciu",
        text: "Klasicka navigacia nepovie, co je najlepsi dalsi krok pre dany problem, termin, rozpocet alebo sposob pouzitia.",
      },
      {
        title: "Rezervacia je prilis daleko",
        text: "Kazdy nadbytocny klik medzi prvou potrebou a rezervaciou zvysuje sancu, ze clovek odide alebo skonci bez akcie.",
      },
    ],
  },
  {
    id: "intent",
    label: "Ako sa hlada",
    title: "Pouzivatel nepride s nazvom produktu. Pride s ulohou, problemom alebo situaciou.",
    description:
      "AI vrstva z textu pochopi intent a prelozi ho na spravny produkt, ponuku alebo dalsi krok. Nemusi cakat, kym clovek trafi internu strukturu katalogu alebo pozna spravne nazvy kategorii.",
    surface: "white" as const,
    cards: [
      {
        title: "Uloha namiesto produktu",
        text: "Navstevnik napise, co chce vyriesit, a web to prelozi na konkretny typ produktu, sluzby alebo rezervacneho flowu.",
      },
      {
        title: "Spravna ponuka na prvy pokus",
        text: "AI odporuci spravny produkt alebo ponuku bez toho, aby navstevnik musel rucne prechadzat viac kategorii, filtrov a technickych parametrov.",
      },
      {
        title: "Dalsi krok bez bludenia",
        text: "Ak dopyt este nie je pripraveny na rezervaciu, vrstva posle cloveka na relevantny detail, porovnanie, formular alebo kontakt. Nie spat na zoznam.",
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
    title: "AI vrstva chape intent, nie len klucove slova.",
    description:
      "Vrstva priradi intent ku konkretnej casti webu a odporuci spravny produkt, sluzbu, rental flow alebo dalsi krok. Pomaha hlavne tam, kde vacsi katalog a viac vetiev vytvara zbytocny chaos uz na zaciatku navstevy.",
    surface: "tint" as const,
    bullets: [
      "Rozpozna, ci clovek hlada produkt, rezervaciu, doplnkovu sluzbu alebo len potrebuje pomoct s vyberom.",
      "Pomaha najst spravny produkt, sluzbu alebo rental flow aj vtedy, ked navstevnik nepozna presny nazov kategorie.",
      "Znizuje chaos pri vacsom katalogu, kde menu a filtre nestacia na rychle rozhodnutie.",
      "Posle cloveka rovno na dalsi krok, ktory zvysuje sancu na dopyt, rezervaciu alebo objednavku.",
      "Vie odporucit aj suvisiacu ponuku, ak dava zmysel pre konkretnu situaciu alebo termin pouzitia.",
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
      eyebrow="MARKETPLACE A RENTAL"
      title="AI vrstva pre marketplace a rental weby"
      subtitle="Pouzivatel casto nepride s presnym nazvom produktu alebo sluzby. Pride s ulohou, problemom alebo situaciou. AI vrstva z jeho zadania pochopi intent a navedie ho na spravny produkt, ponuku alebo dalsi krok."
      heroChips={[
        "Vela kategorii a filtrov",
        "Intent podla ulohy",
        "Kratsia cesta k rezervacii",
      ]}
      heroAddon={
        <AuditBot
          proposalTargetId="cta"
          badge="AI audit webu"
          title="Zadajte URL a hned uvidite, kde sa na marketplace alebo rental webe predlzuje cesta k rezervacii."
          description="Audit preveri homepage aj klucove podstranky a ukaze, kde by AI vrstva vedela lepsie priradit intent k produktu, ponuke alebo dalsiemu kroku."
          proposalTitle="Chcete audit a konkretny navrh AI vrstvy pre vas marketplace alebo rental web?"
          proposalDescription="Po audite sa vieme pozriet na miesta, kde dnes navstevnik hlada prilis dlho, netrafi spravnu ponuku alebo odpadne pred rezervaciou."
          proposalButtonLabel="Prejst na CTA"
        />
      }
      sections={sections}
      ctaTitle="Ak mate marketplace alebo rental web, pozriem sa, kde sa dnes zbytocne predlzuje cesta k rezervacii."
      ctaText="Poslite URL, hlavne vetvy katalogu a miesto, kde dnes ludia najcastejsie bludia alebo odpadaju. Vratim sa s konkretnym nazorom, ci AI vrstva vie skracovat cestu k dopytu, rezervacii alebo objednavke uz v prvej faze."
      ctaButtonLabel="Poslat marketplace alebo rental web"
      ctaMailSubject="AI vrstva pre marketplace alebo rental web"
    />
  );
}
