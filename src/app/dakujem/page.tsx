import ContactRequestSuccessState from "@/components/bendalabs/contact-request-success-state";

export default function ContactRequestThankYouPage() {
  return (
    <ContactRequestSuccessState
      backHref="/"
      backLabel="Spat na web"
      title="Dakujem, dopyt je odoslany."
      description="Ozvem sa vam."
    />
  );
}
