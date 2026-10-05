import { pageMetadata } from "@/lib/bendalabs/seo";
import WorldHome from "@/components/bendalabs/world-home";

export default function Home() {
  return <WorldHome locale="sk" />;
}

export const metadata = pageMetadata("/", "BendaLabs — aplikácie, AI a robotika", "Projekty Mareka Bendu: Fakturomat, TrendAtlas, robotická ruka a ďalšie digitálne produkty a fyzické prototypy. Spoznajte BendaLabs a BendaRobotics.");
