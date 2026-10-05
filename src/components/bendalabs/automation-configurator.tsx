"use client";

import { useRef, useState, type FormEvent } from "react";
import { automationBase, automationModules, euro, getAutomationQuote, type AutomationModuleId } from "@/lib/bendalabs/automation";
import { Arrow } from "./brand-shell";

export default function AutomationConfigurator({ initialModules }: { initialModules: AutomationModuleId[] }) {
  const [selected, setSelected] = useState(initialModules);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [users, setUsers] = useState("1–5");
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
      setError("Vyberte aspoň jeden modul alebo opíšte vlastnú požiadavku aspoň 10 znakmi.");
      requestAnimationFrame(() => errorRef.current?.focus());
      return;
    }
    inFlight.current = true;
    setPending(true); setError("");
    const url = new URL(window.location.href);
    const campaign = ["utm_source", "utm_medium", "utm_campaign", "utm_content"].map(key => url.searchParams.has(key) ? `${key}=${url.searchParams.get(key)}` : "").filter(Boolean).join("; ").slice(0, 400);
    try {
      const response = await fetch("/api/automation-requests", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
        name: values.get("name"), email: values.get("email"), business: values.get("business"), website: values.get("website"), users,
        modules: selected, details: Object.fromEntries(automationModules.map(module => [module.id, values.get(`details-${module.id}`) || ""])), custom, company: values.get("company"), campaign,
      }) });
      const result = await response.json();
      if (!response.ok || result.success !== true) throw new Error(result.error || "Dopyt sa nepodarilo odoslať.");
      setSuccess(true);
      requestAnimationFrame(() => document.getElementById("automation-success")?.focus());
    } catch (failure) {
      setError(`${failure instanceof Error ? failure.message : "Dopyt sa nepodarilo odoslať."} Vaše zadanie zostalo vyplnené.`);
      requestAnimationFrame(() => errorRef.current?.focus());
    } finally { inFlight.current = false; setPending(false); }
  }

  return <section className="auto-config-section" id="konfigurator"><div className="bl-wrap">
    <div className="auto-section-heading"><p className="bl-eyebrow">Poskladajte si svoj systém</p><h2>Začnite tým,<br />čo vás najviac zdržiava.</h2><p>Vyberte jeden modul alebo ich skombinujte. Spoločný firemný priestor platíte iba raz.</p></div>
    {success ? <div className="auto-success" id="automation-success" role="status" tabIndex={-1}><span aria-hidden="true">✓</span><h3>Dopyt je odoslaný.</h3><p>Ďakujeme. Ozveme sa na uvedený e-mail a prejdeme si s vami rozsah, ukážkové podklady a ďalší postup.</p><p>Odoslaním sa k ničomu nezaväzujete.</p><button className="bl-text-link" onClick={() => { setSuccess(false); setError(""); }}>Upraviť výber a poslať nový dopyt <Arrow /></button></div> : <form className="auto-config-form" onSubmit={submit} aria-busy={pending}>
      <div className="auto-config-main">
        <fieldset className="auto-module-choices"><legend><span>1</span> Vyberte moduly</legend>{automationModules.map(module => <label key={module.id} className={`auto-module-choice ${selected.includes(module.id) ? "is-selected" : ""}`}><input type="checkbox" name="modules" value={module.id} checked={selected.includes(module.id)} onChange={() => toggle(module.id)} disabled={pending} /><span><strong>{module.title}</strong><small>+ {euro(module.setup)} jednorazovo / + {euro(module.monthly)} mesačne</small></span><span className="auto-choice-mark" aria-hidden="true">{selected.includes(module.id) ? "✓" : "+"}</span></label>)}</fieldset>
        <fieldset className="auto-form-fields"><legend><span>2</span> Povedzte nám, čo potrebujete</legend>
          {automationModules.map(module => <label key={module.id} hidden={!selected.includes(module.id)}>{module.question}<textarea name={`details-${module.id}`} rows={2} maxLength={700} placeholder={module.placeholder} /></label>)}
          <label>Čo ďalšie potrebujete automatizovať?<span className="auto-field-hint">Mimo ponuky — napíšte konkrétnu úlohu, ktorú dnes robíte ručne.</span><textarea name="custom" rows={3} maxLength={1200} placeholder="Napr. každý týždeň ručne zbierame údaje z viacerých tabuliek…" /></label>
        </fieldset>
        <fieldset className="auto-form-fields"><legend><span>3</span> Kam sa vám ozveme?</legend>
          <div className="auto-fields-row"><label>Meno a priezvisko<input name="name" required maxLength={120} autoComplete="name" placeholder="Vaše meno" /></label><label>Firemný e-mail<input name="email" required type="email" maxLength={180} autoComplete="email" placeholder="vy@firma.sk" /></label></div>
          <div className="auto-fields-row"><label>Názov firmy<input name="business" required maxLength={180} autoComplete="organization" placeholder="Vaša firma" /></label><label>Počet používateľov<select name="users" value={users} onChange={event => setUsers(event.target.value)}><option value="1–5">1–5 používateľov</option><option value="viac ako 5">Viac ako 5 používateľov</option></select></label></div>
          <label>Web firmy <span className="auto-optional">nepovinné</span><input name="website" maxLength={500} inputMode="url" autoComplete="url" placeholder="vasafirma.sk" /></label>
          <label className="auto-honeypot" aria-hidden="true">Nechajte prázdne<input name="company" tabIndex={-1} autoComplete="off" /></label>
        </fieldset>
        {error && <p ref={errorRef} className="bl-form-error" role="alert" tabIndex={-1}>{error}</p>}
        <div className="auto-form-bottom"><p>Údaje použijeme na spracovanie vášho dopytu. Nejde o záväznú objednávku.</p><button type="submit" className="bl-button" disabled={pending}>{pending ? "Odosielanie…" : "Chcem svoj systém"}<Arrow /></button></div>
      </div>
      <aside className="auto-price-summary" aria-label="Cena vybraného systému"><span className="auto-offer-label">Uvádzacia ponuka · prvých 5 klientov</span><h3>Váš systém</h3><div aria-live="polite" aria-atomic="true">{selected.length ? <><dl className="auto-total"><div><dt>Vytvorenie a nastavenie</dt><dd data-price="setup">{euro(quote.setup)}</dd></div><div><dt>Prevádzka a starostlivosť</dt><dd data-price="monthly">{euro(quote.monthly)}<small> / mesiac</small></dd></div></dl><div className="auto-price-breakdown"><p>V cene máte:</p><div><span>Spoločný firemný dashboard</span><small>{euro(automationBase.setup)} + {euro(automationBase.monthly)}/mes.</small></div>{automationModules.filter(module => selected.includes(module.id)).map(module => <div key={module.id}><span>{module.title}</span><small>{euro(module.setup)} + {euro(module.monthly)}/mes.</small></div>)}</div></> : <p className="auto-empty-price">Vyberte modul a uvidíte cenu.<br />Vlastnú požiadavku naceníme individuálne.</p>}</div>
        <ul className="auto-included"><li>Váš firemný priestor a vybrané moduly</li><li>Do 5 používateľov</li><li>Nastavenie a odovzdanie systému</li><li>Hosting, zálohy a opravy chýb</li></ul>
        {users === "viac ako 5" && <p className="auto-price-note">Pre viac ako 5 používateľov cenu potvrdíme individuálne.</p>}
        <p className="auto-price-note">Cena platí pre rozsah uvedený pri moduloch. Vlastné požiadavky, vyššie objemy a ďalšie integrácie naceníme vopred.</p><a href="mailto:info@bendalabs.sk" className="auto-summary-contact">Radšej priamo? info@bendalabs.sk <span aria-hidden="true">↗</span></a>
      </aside>
    </form>}
  </div></section>;
}
