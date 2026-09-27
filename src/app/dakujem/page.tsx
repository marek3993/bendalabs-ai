import ContactRequestSuccessState from "@/components/bendalabs/contact-request-success-state";
import { contactReturnPath } from "@/lib/bendalabs/contact-return";

export default async function ContactRequestThankYouPage({ searchParams }: { searchParams: Promise<{ back?: string | string[] }> }) {
  const { back } = await searchParams;
  return (
    <ContactRequestSuccessState
      backHref={contactReturnPath(back, "sk")}
      backLabel="Späť na web"
      title="Ďakujem, zadanie dorazilo."
      description="Ozvem sa vám a prejdeme si ďalší krok."
    />
  );
}
