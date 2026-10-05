import { RequestFailure } from "@/components/bendalabs/request-status";
import { contactReturnPath } from "@/lib/bendalabs/contact-return";
import { privatePageMetadata } from "@/lib/bendalabs/seo";
export const metadata = privatePageMetadata("Message not sent | BendaLabs");
export default async function Page({ searchParams }: { searchParams: Promise<{ back?: string; details?: string }> }) {
  const params = await searchParams;
  return <RequestFailure locale="en" back={contactReturnPath(params.back, "en")} details={params.details} />;
}
