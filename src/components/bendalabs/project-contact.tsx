"use client";

import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { usePathname } from "next/navigation";
import type { SiteLocale } from "@/lib/bendalabs/site-content";
import { Arrow } from "./brand-shell";
import { trackGoogleAdsConversion } from "@/lib/analytics/google-ads";
import { parseContactRequestSubmission, getContactRequestFieldErrors } from "@/lib/leads/contact-request";
import { getLeadFormCopy } from "@/lib/bendalabs/lead-form-content";

export default function ProjectContact({ locale = "sk", robotics = false, invitation }: {
  locale?: SiteLocale; robotics?: boolean;
  invitation?: { title: string; text: string; buttonLabel: string; mailSubject: string };
}) {
  const cs = locale === "cs";
  const pathname = usePathname();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const inFlight = useRef(false);
  const errorElement = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    const recover = () => { inFlight.current = false; setPending(false); };
    window.addEventListener("pageshow", recover);
    return () => window.removeEventListener("pageshow", recover);
  }, []);
  useEffect(() => { if (error) errorElement.current?.focus(); }, [error]);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (inFlight.current) return;
    const form = event.currentTarget;
    const formData = new FormData(form);
    const submission = parseContactRequestSubmission(Object.fromEntries(formData));
    if (!submission.success) {
      const validationCopy = getLeadFormCopy(locale).validation;
      for (const [field, code] of Object.entries(getContactRequestFieldErrors(submission.error))) {
        const input = form.elements.namedItem(field);
        if (input instanceof HTMLInputElement || input instanceof HTMLTextAreaElement) {
          input.setCustomValidity(validationCopy[code]);
          input.reportValidity();
          break;
        }
      }
      return;
    }
    inFlight.current = true;
    setPending(true);
    setError("");
    try {
      const response = await fetch(form.action, { method: "POST", body: formData });
      const destination = new URL(response.url);
      const success = cs ? "/cs/dekujeme" : "/dakujem";
      if (!response.ok || destination.origin !== window.location.origin || destination.pathname !== success) throw new Error("Submission failed");
      trackGoogleAdsConversion();
      window.location.assign(`${success}?back=${encodeURIComponent(`${pathname}#kontakt`)}`);
    } catch {
      inFlight.current = false;
      setPending(false);
      setError(cs ? "Zprávu se nepodařilo odeslat. Vaše zadání zůstalo vyplněné. Zkuste to znovu nebo napište na info@bendalabs.sk." : "Správu sa nepodarilo odoslať. Vaše zadanie zostalo vyplnené. Skúste to znova alebo napíšte na info@bendalabs.sk.");
    }
  }
  return <section className={invitation ? "bl-contact bl-contact-context" : "bl-contact"} id="kontakt"><div className="bl-wrap bl-contact-grid"><div>
    <p className="bl-eyebrow">{cs ? "Začněme rozhovorem" : "Začnime rozhovorom"}</p>
    <h2>{invitation?.title ?? (robotics ? (cs ? "Co spolu\nvyzkoušíme?" : "Čo spolu\nvyskúšame?") : (cs ? "Co chcete\npostavit?" : "Čo chcete\npostaviť?"))}</h2>
    <p className="bl-contact-intro">{invitation?.text ?? (cs ? "Stačí problém, nápad nebo první zadání. Probereme, co má smysl postavit a jaký bude první krok." : "Stačí problém, nápad alebo prvé zadanie. Prejdeme si, čo má zmysel postaviť a aký bude prvý krok.")}</p>
    <div className="bl-person"><span className="bl-person-mark" aria-hidden="true">MB</span><div><strong>Marek Benda</strong><a href="mailto:info@bendalabs.sk">info@bendalabs.sk</a><a href="tel:+421944388123">+421 944 388 123</a></div></div>
    <p className="bl-contact-note">{cs ? "Projekt zatím nemá web?" : "Projekt zatiaľ nemá web?"}<br /><a href={`mailto:info@bendalabs.sk?subject=${encodeURIComponent(invitation?.mailSubject ?? (robotics ? (cs ? "BendaRobotics — spolupráce" : "BendaRobotics — spolupráca") : "BendaLabs — nový projekt"))}`}>{cs ? "Napište mi přímo e-mailem" : "Napíšte mi priamo e-mailom"}<Arrow diagonal /></a></p>
  </div><form className="bl-project-form" action="/api/contact-requests" method="post" onSubmit={submit} onInput={event => { const input = event.target; if (input instanceof HTMLInputElement || input instanceof HTMLTextAreaElement) input.setCustomValidity(""); }} aria-busy={pending}>
    <input type="hidden" name="locale" value={locale} /><input type="hidden" name="source" value="contact_section" /><input type="hidden" name="returnPath" value={`${pathname}#kontakt`} /><input type="hidden" name="successPath" value={cs ? "/cs/dekujeme" : "/dakujem"} /><input type="hidden" name="errorPath" value={cs ? "/cs/odeslani-selhalo" : "/odoslanie-zlyhalo"} /><input type="text" name="company" className="bl-honeypot" aria-hidden="true" tabIndex={-1} autoComplete="off" />
    <div className="bl-form-row"><label>{cs ? "Jméno" : "Meno"}<input name="name" autoComplete="name" placeholder={cs ? "Vaše jméno" : "Vaše meno"} required maxLength={120} /></label><label>E-mail<input type="email" name="email" autoComplete="email" placeholder="vy@firma.sk" required maxLength={180} /></label></div>
    <label>{cs ? "Web projektu nebo firmy" : "Web projektu alebo firmy"}<input name="website" inputMode="url" autoComplete="url" placeholder="vasafirma.sk" required maxLength={2000} onInput={event => event.currentTarget.setCustomValidity("")} /></label>
    <label>{cs ? "Co chcete vyřešit?" : "Čo chcete vyriešiť?"}<textarea name="message" rows={4} minLength={10} maxLength={4000} required placeholder={robotics ? (cs ? "Prototyp, experiment, sběr dat…" : "Prototyp, experiment, zber dát…") : (cs ? "Popište nápad, problém nebo výsledek, který potřebujete." : "Popíšte nápad, problém alebo výsledok, ktorý potrebujete.")} /></label>
    {error && <p className="bl-form-error" ref={errorElement} role="alert" tabIndex={-1}>{error}</p>}
    <div className="bl-form-submit"><p>{cs ? "Údaje použijeme k odpovědi na vaši poptávku." : "Údaje použijeme na odpoveď na váš dopyt."}</p><button className="bl-button" type="submit" disabled={pending}>{pending ? (cs ? "Odesílání…" : "Odosielanie…") : (invitation?.buttonLabel ?? (cs ? "Odeslat zadání" : "Odoslať zadanie"))}<Arrow /></button></div>
  </form></div></section>;
}
