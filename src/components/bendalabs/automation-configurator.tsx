"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { type AutomationModuleId } from "@/lib/bendalabs/automation";
import { measureAutomationLead, openAiAdsPixelId, setOpenAiAdsConsent } from "@/lib/analytics/openai-ads";
import { Arrow } from "./brand-shell";

export default function AutomationConfigurator({ initialModules }: { initialModules: AutomationModuleId[] }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [measurementConsent, setMeasurementConsent] = useState(false);
  useEffect(() => () => setOpenAiAdsConsent(false), []);
  const inFlight = useRef(false);
  const errorRef = useRef<HTMLParagraphElement>(null);
  const jobs = initialModules.length === 1 && initialModules[0] === "prilezitosti";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (inFlight.current) return;
    const values = new FormData(event.currentTarget);
    const situation = String(values.get("situation") || "").trim();
    if (situation.length < 10) {
      setError("Opíšte svoju situáciu aspoň jednou krátkou vetou (minimálne 10 znakov).");
      requestAnimationFrame(() => errorRef.current?.focus());
      return;
    }
    inFlight.current = true;
    setPending(true); setError("");
    const url = new URL(window.location.href);
    const campaign = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "utm_id"].map(key => url.searchParams.has(key) ? `${key}=${url.searchParams.get(key)}` : "").filter(Boolean).join("; ").slice(0, 400);
    let failureMessage = "Situáciu sa nepodarilo odoslať. Skúste znova alebo napíšte na info@bendalabs.sk.";
    try {
      const response = await fetch("/api/automation-requests", {
        method: "POST", headers: { "Content-Type": "application/json" }, signal: AbortSignal.timeout(20000),
        body: JSON.stringify({ name: values.get("name"), email: values.get("email"), situation, modules: initialModules, company: values.get("company"), campaign }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || result?.success !== true) {
        if (typeof result?.error === "string") failureMessage = result.error;
        throw new Error("Automation submission failed");
      }
      measureAutomationLead(result.eventId);
      setSuccess(true);
      requestAnimationFrame(() => document.getElementById("automation-success")?.focus());
    } catch {
      setError(`${failureMessage} Vaše údaje zostali vyplnené.`);
      requestAnimationFrame(() => errorRef.current?.focus());
    } finally { inFlight.current = false; setPending(false); }
  }

  return <section className="auto-intake" id="konfigurator" aria-labelledby="intake-heading">
    <p className="bl-eyebrow">Začnime vašou situáciou</p>
    <h2 id="intake-heading">Čo potrebujete vyriešiť?</h2>
    <p className="auto-intake-lead">Napíšte pár viet. Vašu situáciu zanalyzujeme a ozveme sa s návrhom ďalšieho postupu.</p>
    {success ? <div className="auto-success" id="automation-success" role="status" tabIndex={-1}>
      <span aria-hidden="true">✓</span><h3>Vaša situácia je odoslaná.</h3>
      <p>Ďakujeme. Pozrieme sa na váš opis a ozveme sa na uvedený e-mail.</p>
      <p>Odoslaním ste si nič neobjednali. Prípadnú realizáciu a cenu si dohodneme osobitne.</p>
    </div> : <form className="auto-intake-form" onSubmit={submit} aria-busy={pending}>
      <div className="auto-form-fields">
        <label htmlFor="automation-situation">Vaša situácia v krátkosti<textarea id="automation-situation" name="situation" required minLength={10} maxLength={1200} rows={3} placeholder={jobs ? "Napr. sme elektroinštalačná firma v Bratislave a zákazky dnes hľadáme ručne na viacerých portáloch…" : "Napr. pri každom novom zamestnancovi prepisujeme tie isté údaje do zmluvy aj ďalších formulárov…"} /></label>
        <label htmlFor="automation-email">E-mail na odpoveď<input id="automation-email" name="email" required type="email" maxLength={180} autoComplete="email" placeholder="vas@email.sk" /></label>
        <label htmlFor="automation-name">Meno <span className="auto-optional">nepovinné</span><input id="automation-name" name="name" maxLength={120} autoComplete="name" placeholder="Ako vás máme osloviť?" /></label>
        <label className="auto-honeypot" aria-hidden="true">Nechajte prázdne<input name="company" tabIndex={-1} autoComplete="off" /></label>
      </div>
      {error && <p ref={errorRef} className="bl-form-error" role="alert" tabIndex={-1}>{error}</p>}
      <button type="submit" className="bl-button" disabled={pending}>{pending ? "Odosielanie…" : "Poslať situáciu na analýzu"}<Arrow /></button>
      <p className="auto-intake-note">Nezáväzne. Bez objednávky a platby. Údaje použijeme na spracovanie vášho dopytu.</p>
    </form>}
    {openAiAdsPixelId && <label className="auto-measurement-consent"><input type="checkbox" checked={measurementConsent} onChange={event => { setMeasurementConsent(event.target.checked); setOpenAiAdsConsent(event.target.checked); }} /><span>Súhlasím s meraním účinnosti reklamy pomocou OpenAI Pixelu (nepovinné). Používa reklamné cookies a odošle udalosť o odoslaní formulára, bez jeho obsahu. Súhlas môžete odškrtnutím odvolať. <a href="https://openai.com/policies/privacy-policy/" target="_blank" rel="noreferrer">Ochrana súkromia</a></span></label>}
    <a href="mailto:info@bendalabs.sk" className="auto-summary-contact">Radšej e-mail? info@bendalabs.sk <span aria-hidden="true">↗</span></a>
  </section>;
}
