import ContactRequestSuccessState from "@/components/bendalabs/contact-request-success-state";
import { contactReturnPath } from "@/lib/bendalabs/contact-return";
import { privatePageMetadata } from "@/lib/bendalabs/seo";
export const metadata = privatePageMetadata("Thank you | BendaLabs");
export default async function Page({ searchParams }: { searchParams: Promise<{ back?: string | string[] }> }) {
  const { back } = await searchParams;
  return <ContactRequestSuccessState backHref={contactReturnPath(back, "en")} backLabel="Back to the website" title="Thank you. Your brief has arrived." description="I will be in touch to discuss the next step." />;
}
