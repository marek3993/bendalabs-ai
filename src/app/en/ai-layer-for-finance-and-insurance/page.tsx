import AuditBot from "@/components/bendalabs/audit-bot";
import ServicePageTemplate from "@/components/bendalabs/service-page-template";
import { getFinancePageContent } from "@/lib/bendalabs/site-content";
import { pageMetadata } from "@/lib/bendalabs/seo";
const content = getFinancePageContent("en");
export const metadata = pageMetadata("/en/ai-layer-for-finance-and-insurance", content.metadataTitle, content.metadataDescription);
export default function Page() { return <ServicePageTemplate locale="en" {...content} heroAddon={<AuditBot locale="en" {...content.auditBot} />} />; }
