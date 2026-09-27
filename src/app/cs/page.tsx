import type { Metadata } from "next";
import WorldHome from "@/components/bendalabs/world-home";

export const metadata: Metadata = { title: "BendaLabs — aplikace, AI a robotika", description: "Marek Benda. Vlastní aplikace, AI nástroje a robotické prototypy. Prohlédněte si skutečné projekty a ozvěte se s vlastním nápadem." };

export default function CzechHomePage() {
  return <WorldHome locale="cs" />;
}
