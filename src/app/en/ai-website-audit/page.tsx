import AuditBot from "@/components/bendalabs/audit-bot";
import ServicePageTemplate from "@/components/bendalabs/service-page-template";
import { getAuditPageContent } from "@/lib/bendalabs/site-content";
import { pageMetadata } from "@/lib/bendalabs/seo";
const content = getAuditPageContent("en");
export const metadata = pageMetadata("/en/ai-website-audit", content.metadataTitle, content.metadataDescription);
export default function Page() { return <ServicePageTemplate locale="en" {...content} heroAddon={<AuditBot locale="en" {...content.auditBot} />} />; }
