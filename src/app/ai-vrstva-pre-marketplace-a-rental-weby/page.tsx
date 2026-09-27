import { pageMetadata } from "@/lib/bendalabs/seo";
import AuditBot from "@/components/bendalabs/audit-bot";
import ServicePageTemplate from "@/components/bendalabs/service-page-template";
import { getMarketplacePageContent } from "@/lib/bendalabs/site-content";

const content = getMarketplacePageContent("sk");

export const metadata = pageMetadata("/ai-vrstva-pre-marketplace-a-rental-weby", content.metadataTitle, content.metadataDescription);

export default function MarketplaceAndRentalPage() {
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
