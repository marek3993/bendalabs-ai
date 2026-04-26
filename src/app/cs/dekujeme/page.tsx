import ContactRequestSuccessState from "@/components/bendalabs/contact-request-success-state";

export default function CzechContactRequestThankYouPage() {
  return (
    <ContactRequestSuccessState
      backHref="/cs"
      backLabel="Zpet na web"
      title="Dekuji, poptavka je odeslana."
      description="Ozvu se vam."
    />
  );
}
