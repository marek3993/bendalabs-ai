import type { Metadata } from "next";
import AiCustomProposalFlow from "@/components/bendalabs/ai-custom-proposal-flow";
import { PageShell } from "@/components/bendalabs/brand-shell";
export const metadata: Metadata = { title: "AI návrh na mieru | BendaLabs", description: "Odpovedzte na otázky o svojom webe a cieľoch. Získajte návrh AI vrstvy a zmysluplnej prvej fázy riešenia." };
export default function AiCustomProposalPage() {
  return <PageShell><div id="main" className="bl-product-content bl-wrap bl-proposal"><AiCustomProposalFlow /></div></PageShell>;
}

