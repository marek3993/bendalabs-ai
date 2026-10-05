import AiCustomProposalFlow from "@/components/bendalabs/ai-custom-proposal-flow";
import { PageShell } from "@/components/bendalabs/brand-shell";
import { pageMetadata } from "@/lib/bendalabs/seo";
export const metadata = pageMetadata("/en/custom-ai-proposal", "Custom AI proposal | BendaLabs", "Describe your website and goals. Get a proposal for an intelligent layer over your existing website that helps visitors choose and prepares better enquiries.");
export default function Page() { return <PageShell locale="en"><div id="main" className="bl-product-content bl-wrap bl-proposal"><AiCustomProposalFlow locale="en" /></div></PageShell>; }
