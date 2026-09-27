import { pageMetadata } from "@/lib/bendalabs/seo";
import AuditBot from "@/components/bendalabs/audit-bot";
import ServicePageTemplate from "@/components/bendalabs/service-page-template";
import { getMarketplacePageContent } from "@/lib/bendalabs/site-content";

const content = getMarketplacePageContent("cs");

export const metadata = pageMetadata("/cs/ai-vrstva-pro-marketplace-a-rental-weby", content.metadataTitle, content.metadataDescription);

export default function CzechMarketplaceAndRentalPage() {
  return (
    <ServicePageTemplate
      locale="cs"
      eyebrow={content.eyebrow}
      title={content.title}
      subtitle={content.subtitle}
      heroChips={content.heroChips}
      heroAddon={
        <AuditBot
          locale="cs"
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
