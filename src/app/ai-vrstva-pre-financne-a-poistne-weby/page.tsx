import type { Metadata } from "next";
import AuditBot from "@/components/bendalabs/audit-bot";
import ServicePageTemplate from "@/components/bendalabs/service-page-template";
import { getFinancePageContent } from "@/lib/bendalabs/site-content";

const content = getFinancePageContent("sk");

export const metadata: Metadata = {
  title: content.metadataTitle,
  description: content.metadataDescription,
};

export default function FinanceAndInsurancePage() {
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
