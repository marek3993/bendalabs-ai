import SiteStructuredData from "@/components/bendalabs/site-structured-data";
import { pageMetadata } from "@/lib/bendalabs/seo";
import WorldHome from "@/components/bendalabs/world-home";

export const metadata = pageMetadata("/", "BendaLabs — aplikácie, AI a robotika", "Projekty Mareka Bendu: Fakturomat, TrendAtlas, robotická ruka a ďalšie digitálne produkty a fyzické prototypy. Spoznajte BendaLabs a BendaRobotics.");

export default function Home() {
  return <><SiteStructuredData /><WorldHome locale="sk" /></>;
}
