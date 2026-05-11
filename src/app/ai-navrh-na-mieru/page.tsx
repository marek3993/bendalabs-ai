import type { Metadata } from "next";
import Link from "next/link";
import AiCustomProposalFlow from "@/components/bendalabs/ai-custom-proposal-flow";
import SiteBrand from "@/components/bendalabs/site-brand";

export const metadata: Metadata = {
  title: "AI navrh na mieru | BendaLabs",
  description:
    "Interaktivny flow, ktory ziska ciele, kontext a priority webu a na konci ukaze navrh AI vrstvy na mieru.",
};

export default function AiCustomProposalPage() {
  return (
    <div className="site-shell min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-black/8 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-4">
          <SiteBrand href="/" tagline="AI vrstva pre weby s viacerymi cestami ku konverzii" />

          <nav className="hidden items-center gap-6 text-sm text-neutral-500 md:flex">
            <Link href="/ai" className="hover:text-neutral-950">
              AI vrstva
            </Link>
            <Link href="/ai-audit-webu" className="hover:text-neutral-950">
              AI audit webu
            </Link>
          </nav>
        </div>
      </header>

      <AiCustomProposalFlow />
    </div>
  );
}
