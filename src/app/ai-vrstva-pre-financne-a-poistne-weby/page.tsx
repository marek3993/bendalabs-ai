import type { Metadata } from "next";
import ServicePageTemplate from "@/components/bendalabs/service-page-template";

export const metadata: Metadata = {
  title: "AI vrstva pre financne a poistne weby | BendaLabs",
  description:
    "AI vrstva, ktora dostane navstevnika do spravnej kalkulacky, formulara alebo produktu skor a s mensim odpadom pred odoslanim dopytu.",
};

const sections = [
  {
    id: "problem",
    label: "Problem",
    title: "Najvacsi problem nie je traffic. Je to zly vyber prveho kroku.",
    description:
      "Na financnych a poistnych weboch ludia neprichadzaju s nazvom produktu. Prichadzaju s potrebou. Chcu znizit splatku, vyriesit PZP, zistit ci ma zmysel investovanie alebo sa len dostat ku kontaktu. Ak web od nich hned pyta spravnu kategoriu, velka cast sa odpoji skor, ako otvori relevantny flow.",
    surface: "soft" as const,
    cards: [
      {
        title: "Hypoteky a refinancovanie",
        text: "Pouzivatel casto nevie, ci patri do novej hypoteky, refinancovania alebo len orientacneho prepocitu. Ked netrafi spravnu kalkulacku, konverzia pada uz na vstupe.",
      },
      {
        title: "PZP a havarijne",
        text: "Rozhodovanie sa lame medzi cenou, rozsahom krytia a tym, ci clovek riesi novu zmluvu alebo zmenu. Menu a filtre tu nestacia.",
      },
      {
        title: "Investovanie a sporenie",
        text: "Navstevnik vie povedat ciel, nie produkt. Ak ho web nuti vybrat nespravnu vetvu, odide bez kontaktu aj bez dopytu.",
      },
      {
        title: "Kontakt a formular",
        text: "Aj clovek pripraveny odoslat dopyt sa casto strati medzi viacerymi formularmi. Odpad pred formularom byva drahsi ako slabsi closing.",
      },
    ],
  },
  {
    id: "co-robi",
    label: "Co robi AI vrstva",
    title: "AI vrstva nepredava. Preradi cloveka do spravneho flowu skor, ako sa pomyli.",
    description:
      "Vrstva cita intent navstevnika vo vlastnych slovach, rozpozna hlavny use-case a posle ho do konkretneho dalsieho kroku. Nie do vseobecnej sekcie. Do kalkulacky, formulara, produktovej vetvy alebo kontaktu, ktory dava zmysel pre dany dopyt.",
    surface: "white" as const,
    cards: [
      {
        title: "Intent namiesto menu",
        text: "Pouzivatel napise, ze chce znizit mesacnu splatku, poistit auto alebo odkladat peniaze na rezervu. System nemusi cakat, kym sam najde spravny produkt.",
      },
      {
        title: "Menej odpadu pred formularom",
        text: "AI vrstva odfiltruje slepe odbočky a posuva navstevnika len do formulara, kde ma realnu sancu dokoncit dopyt.",
      },
      {
        title: "Odporucanie suvisiacich produktov",
        text: "Ak je clovek v spravnom momente, vrstva odporuci dalsi logicky krok. Napriklad popri refinancovani navrhne poistenie nehnutelnosti alebo popri sporiacom produkte investicnu vetvu.",
      },
      {
        title: "Lepsie presmerovanie na kontakt",
        text: "Tam, kde nema zmysel dalsie klikanie, posle AI cloveka rovno na kontakt alebo na presne ten formular, ktory vie obchodny tim spracovat.",
      },
    ],
  },
  {
    id: "konverzia",
    label: "Kde sa lame konverzia",
    title: "Lom nenastava v poslednom kroku. Zvycajne nastane o dve obrazovky skor.",
    description:
      "Najvacsi prepad byva medzi prvym intentom a prvym relevantnym flowom. Ked sa clovek pomyli v tom, ci otvori refinancovanie, PZP kalkulacku, investicny obsah alebo kontakt, web uz iba dobieha zle rozhodnutie.",
    surface: "tint" as const,
    bullets: [
      "Pouzivatel nevie, ci ma otvorit hypoteku, refinancovanie alebo len orientacny prepocet.",
      "Pri PZP a havarijnom poisteni sa zasekne medzi krytim, cenou a nejasnym dalsim krokom.",
      "Pri investovani a sporeni nenajde vetvu, ktora zodpoveda cielu a rizikovemu profilu.",
      "Pred formularom odpadne, lebo si nie je isty, ci je na spravnom mieste.",
      "Web neponukne suvisiaci produkt v momente, ked je navstevnik pripraveny pokracovat.",
    ],
  },
  {
    id: "meranie",
    label: "Co sa bude merat",
    title: "Ak sa to nema merat, nema zmysel to nasadzovat.",
    description:
      "Po nasadeni sa nesleduje iba pocet chat interakcii. Sleduje sa, ci vrstva skracuje cestu k dopytu, posiela viac ludi do spravnych kalkulaciek a ci obchod dostava cistejsie leady.",
    surface: "white" as const,
    bullets: [
      "Podiel navstevnikov, ktori sa z intent vstupu dostanu do spravnej kalkulacky alebo formulara.",
      "Pokles odpadu pred formularom a pocet dokoncenych dopytov na hypoteky, poistenie a investicne produkty.",
      "Kolko ludi AI presmerovala z vseobecneho vstupu na kontakt s realnym obchodnym potencialom.",
      "Miera prijatia odporucenych suvisiacich produktov alebo dalsich krokov.",
      "Kde sa ludia stale zasekavaju a ktore vetvy webu treba doladit ako dalsie.",
    ],
  },
] as const;

export default function FinanceAndInsurancePage() {
  return (
    <ServicePageTemplate
      eyebrow="AI vrstva pre financne a poistne weby"
      title="AI vrstva pre finančné a poistné weby"
      subtitle="Dostane viac ľudí do správnej kalkulačky, zníži odpad pred formulárom a zvýši počet dokončených dopytov."
      heroChips={[
        "Hypoteky a refinancovanie",
        "PZP a havarijne poistenie",
        "Investovanie, sporenie, kontakt",
      ]}
      sections={sections}
      ctaTitle="Ak mate financny alebo poistny web, pozriem sa, kde dnes stracate dopyty."
      ctaText="Poslite URL, hlavne produktove vetvy a miesto, kde sa vam dnes lomi konverzia. Vratim sa s konkretnym nazorom, ci tam AI vrstva vie realne zlepsit vykon."
      ctaButtonLabel="Poslat web na posudenie"
      ctaMailSubject="AI vrstva pre financny alebo poistny web"
    />
  );
}
