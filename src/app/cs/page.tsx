import SiteStructuredData from "@/components/bendalabs/site-structured-data";
import { pageMetadata } from "@/lib/bendalabs/seo";
import WorldHome from "@/components/bendalabs/world-home";

export const metadata = pageMetadata("/cs", "BendaLabs — aplikace, AI a robotika", "Marek Benda. Vlastní aplikace, AI nástroje a robotické prototypy. Prohlédněte si skutečné projekty a ozvěte se s vlastním nápadem.");

export default function CzechHomePage() {
  return <><SiteStructuredData /><WorldHome locale="cs" /></>;
}
