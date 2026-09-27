import { privatePageMetadata } from "@/lib/bendalabs/seo";

export const metadata = privatePageMetadata("Děkujeme | BendaLabs");

import ContactRequestSuccessState from "@/components/bendalabs/contact-request-success-state";
import { contactReturnPath } from "@/lib/bendalabs/contact-return";

export default async function CzechContactRequestThankYouPage({ searchParams }: { searchParams: Promise<{ back?: string | string[] }> }) {
  const { back } = await searchParams;
  return (
    <ContactRequestSuccessState
      backHref={contactReturnPath(back, "cs")}
      backLabel="Zpět na web"
      title="Děkuji, zadání dorazilo."
      description="Ozvu se vám a probereme další krok."
    />
  );
}
