"use client";

import { useRef, useState, type FormEvent } from "react";
import { automationModules, euro, getAutomationQuote, type AutomationModuleId } from "@/lib/bendalabs/automation";
import { Arrow } from "./brand-shell";

export default function AutomationConfigurator({ initialModules }: { initialModules: AutomationModuleId[] }) {
  const [selected, setSelected] = useState(initialModules);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [users, setUsers] = useState("zatiaľ neviem");
  const inFlight = useRef(false);
  const errorRef = useRef<HTMLParagraphElement>(null);
  const quote = getAutomationQuote(selected);
  function toggle(id: AutomationModuleId) { setSelected(current => current.includes(id) ? current.filter(item => item !== id) : [...current, id]); }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (inFlight.current) return;
    const form = event.currentTarget;
    const values = new FormData(form);
    const custom = String(values.get("custom") || "").trim();
    if (!selected.length && custom.length < 10) {
      setError("Vyberte aspoň jednu službu alebo opíšte vlastnú požiadavku aspoň 10 znakmi.");
      requestAnimationFrame(() => errorRef.current?.focus());
      return;
    }
    inFlight.current = true;
    setPending(true); setError("");
    const url = new URL(window.location.href);
    const campaign = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "utm_id"].map(key => url.searchParams.has(key) ? `${key}=${url.searchParams.get(key)}` : "").filter(Boolean).join("; ").slice(0, 400);
    let failureMessage = "Dopyt sa nepodarilo odoslať. Skúste znova alebo napíšte na info@bendalabs.sk.";
    try {
      const response = await fetch("/api/automation-requests", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
        name: values.get("name"), email: values.get("email"), business: values.get("business"), website: values.get("website"), users,
        modules: selected, details: Object.fromEntries(automationModules.map(module => [module.id, values.get(`details-${module.id}`) || ""])), custom, company: values.get("company"), campaign,
      }) });
      const result = await response.json().catch(() => null);
      if (!response.ok || result?.success !== true) {
        if (typeof result?.error === "string") failureMessage = result.error;
        throw new Error("Automation submission failed");
      }
      setSuccess(true);
      requestAnimationFrame(() => document.getElementById("automation-success")?.focus());
    } catch {
      setError(`${failureMessage} Vaše zadanie zostalo vyplnené.`);
      requestAnimationFrame(() => errorRef.current?.focus());
    } finally { inFlight.current = false; setPending(false); }
  }

  return <section className="auto-config-section" id="konfigurator"><div className="bl-wrap">
    <div className="auto-section-heading"><p className="bl-eyebrow">Nezáväzné zadanie</p><h2>Čo by ste chceli<br />zjednodušiť vo svojej firme?</h2><p>Stačí stručný opis. Ozvem sa vám a prejdeme si konkrétny príklad aj cenu.</p></div>
    {success ? <div className="auto-success" id="automation-success" role="status" tabIndex={-1}><span aria-hidden="true">✓</span><h3>Dopyt je odoslaný.</h3><p>Ďakujem. Ozvem sa na uvedený e-mail a prejdeme si vaše zadanie aj ďalší postup.</p><p>Odoslaním sa k ničomu nezaväzujete.</p><button className="bl-text-link" onClick={() => { setSuccess(false); setError(""); }}>Upraviť výber a poslať nový dopyt <Arrow /></button></div> : <form className="auto-config-form" onSubmit={submit} aria-busy={pending}>
      <div className="auto-config-main">
        <fieldset className="auto-module-choices"><legend><span>1</span> S čím vám má systém pomôcť?</legend>{automationModules.map(module => <label key={module.id} className={`auto-module-choice ${selected.includes(module.id) ? "is-selected" : ""}`}><input type="checkbox" name="modules" value={module.id} checked={selected.includes(module.id)} onChange={() => toggle(module.id)} disabled={pending} /><span><strong>{module.title}</strong><small>{module.choiceDescription}</small></span><span className="auto-choice-mark" aria-hidden="true">{selected.includes(module.id) ? "✓" : "+"}</span></label>)}</fieldset>
        <fieldset className="auto-form-fields"><legend><span>2</span> Čo dnes robíte ručne?</legend>
          {automationModules.map(module => <label key={module.id} hidden={!selected.includes(module.id)}>{module.question}<textarea name={`details-${module.id}`} rows={2} maxLength={700} placeholder={module.placeholder} /></label>)}
          <label>Čo ďalšie potrebujete automatizovať?<span className="auto-field-hint">Máte požiadavku mimo ponuky? Opíšte vlastnú úlohu a navrhnem, ako ju riešiť.</span><textarea name="custom" rows={3} maxLength={1200} placeholder="Napr. každý týždeň ručne zbierame údaje z viacerých tabuliek…" /></label>
        </fieldset>
        <fieldset className="auto-form-fields"><legend><span>3</span> Kam sa vám mám ozvať?</legend>
          <div className="auto-fields-row"><label>Meno a priezvisko<input name="name" required maxLength={120} autoComplete="name" placeholder="Vaše meno" /></label><label>Firemný e-mail<input name="email" required type="email" maxLength={180} autoComplete="email" placeholder="vy@firma.sk" /></label></div>
          <div className="auto-fields-row"><label>Názov firmy<input name="business" required maxLength={180} autoComplete="organization" placeholder="Vaša firma" /></label><label>Počet používateľov<select name="users" value={users} onChange={event => setUsers(event.target.value)}><option value="1–5">1–5 používateľov</option><option value="6–20">6–20 používateľov</option><option value="viac ako 20">Viac ako 20 používateľov</option><option value="zatiaľ neviem">Zatiaľ neviem</option></select></label></div>
          <label>Web firmy <span className="auto-optional">nepovinné</span><input name="website" maxLength={500} inputMode="url" autoComplete="url" placeholder="vasafirma.sk" /></label>
          <label className="auto-honeypot" aria-hidden="true">Nechajte prázdne<input name="company" tabIndex={-1} autoComplete="off" /></label>
        </fieldset>
        {error && <p ref={errorRef} className="bl-form-error" role="alert" tabIndex={-1}>{error}</p>}
        <div className="auto-form-bottom"><p>Údaje použijeme na spracovanie vášho dopytu. Nejde o záväznú objednávku.</p><button type="submit" className="bl-button" disabled={pending}>{pending ? "Odosielanie…" : "Poslať nezáväzné zadanie"}<Arrow /></button></div>
      </div>
      <aside className="auto-price-summary" aria-label="Cena vybraného systému"><span className="auto-offer-label">Uvádzacia ponuka · prvých 5 klientov</span><h3>Váš systém</h3><div aria-live="polite" aria-atomic="true">{selected.length ? <><dl className="auto-total"><div><dt>Vytvorenie a nastavenie · jednorazovo</dt><dd data-price="setup"><small>od </small>{euro(quote.setup)}</dd></div><div><dt>Prevádzka a starostlivosť</dt><dd data-price="monthly"><small>od </small>{euro(quote.monthly)}<small> / mesiac</small></dd></div></dl><div className="auto-price-breakdown"><p>Vybrali ste si:</p>{automationModules.filter(module => selected.includes(module.id)).map(module => <div key={module.id}><span>{module.title}</span></div>)}<p>Vlastný dashboard je už zahrnutý.{selected.length > 1 ? " Spoločné nastavenie platíte iba raz." : ""}</p></div></> : <p className="auto-empty-price">Vyberte službu a uvidíte orientačnú cenu.<br />Vlastnú požiadavku naceníme individuálne.</p>}</div>
        <ul className="auto-included"><li>Vlastný dashboard pre váš tím</li><li>Nastavenie podľa vašich postupov</li><li>Odovzdanie a vysvetlenie používania</li><li>Hosting, zálohy a opravy chýb</li></ul>

        <p className="auto-price-note">Konkrétnu cenu dostanete po prejdení zadania. Mesačnú prevádzku platíte až po odovzdaní systému.</p><a href="mailto:info@bendalabs.sk" className="auto-summary-contact">Radšej priamo? info@bendalabs.sk <span aria-hidden="true">↗</span></a>
      </aside>
    </form>}
  </div></section>;
}
