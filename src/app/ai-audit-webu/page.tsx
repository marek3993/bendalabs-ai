import { pageMetadata } from "@/lib/bendalabs/seo";
import type { Metadata } from "next";
import AuditBot from "@/components/bendalabs/audit-bot";
import ServicePageTemplate from "@/components/bendalabs/service-page-template";
import { getAuditPageContent } from "@/lib/bendalabs/site-content";

const content = getAuditPageContent("sk");

export const metadata: Metadata = pageMetadata("/ai-audit-webu", content.metadataTitle, content.metadataDescription);

export default function AuditPage() {
  return (
    <ServicePageTemplate
      locale="sk"
      eyebrow={content.eyebrow}
      title={content.title}
      subtitle={content.subtitle}
      heroChips={content.heroChips}
      heroAddon={
        <AuditBot
          locale="sk"
          title="Kde by AI mohla zjednodušiť váš web?"
          subtext="Zadajte adresu webu. Bez registrácie a e-mailu."
          description="Audit vychádza z verejne dostupného obsahu. Výsledok je podkladom pre ďalší návrh, nie meraním skutočných konverzií."
          badge={content.auditBot.badge}
          proposalTitle={content.auditBot.proposalTitle}
          proposalDescription={content.auditBot.proposalDescription}
          proposalButtonLabel={content.auditBot.proposalButtonLabel}
        />
      }
      sections={content.sections}
      ctaTitle={content.ctaTitle}
      ctaText={content.ctaText}
      ctaButtonLabel={content.ctaButtonLabel}
      ctaMailSubject={content.ctaMailSubject}
    />
  );
}
