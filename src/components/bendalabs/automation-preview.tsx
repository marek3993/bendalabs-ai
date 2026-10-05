"use client";

import { useState } from "react";

const scenarios = [
  { id: "nastup", title: "Nástup" },
  { id: "dodatok", title: "Dodatok" },
  { id: "prilezitosti", title: "Príležitosti" },
] as const;
type Scenario = (typeof scenarios)[number]["id"];

export default function AutomationPreview() {
  const [active, setActive] = useState<Scenario>("nastup");
  const [generated, setGenerated] = useState(false);
  const [amended, setAmended] = useState(false);
  const [position, setPosition] = useState("Vedúca tímu");
  const [saved, setSaved] = useState(false);

  return <div className="auto-preview" id="ukazka">
    <div className="auto-preview-bar"><span><i aria-hidden="true" /> Váš firemný systém</span><span className="auto-demo-tag">Interaktívna ukážka</span></div>
    <div className="auto-preview-heading"><div><span className="auto-micro">TAKTO TO MÔŽE FUNGOVAŤ</span><h2>Údaje raz. Hotové podklady.</h2></div><span className="auto-avatar" aria-hidden="true">B</span></div>
    <div className="auto-preview-tabs" role="tablist" aria-label="Príklady použitia systému">
      {scenarios.map((scenario, index) => <button key={scenario.id} id={`demo-tab-${scenario.id}`} role="tab" aria-selected={active === scenario.id} aria-controls="demo-panel" tabIndex={active === scenario.id ? 0 : -1} onClick={() => setActive(scenario.id)} onKeyDown={event => {
        if (!["ArrowRight", "ArrowLeft", "Home", "End"].includes(event.key)) return;
        event.preventDefault();
        const next = event.key === "Home" ? 0 : event.key === "End" ? scenarios.length - 1 : (index + (event.key === "ArrowRight" ? 1 : scenarios.length - 1)) % scenarios.length;
        setActive(scenarios[next].id);
        document.getElementById(`demo-tab-${scenarios[next].id}`)?.focus();
      }}>{scenario.title}</button>)}
    </div>
    <div id="demo-panel" className="auto-demo-panel" role="tabpanel" aria-labelledby={`demo-tab-${active}`} tabIndex={0}>
      {active === "nastup" && <>
        <div className="auto-demo-label"><span>Nový zamestnanec</span><span className="auto-chip">Údaje načítané</span></div>
        <h3>Martina Nováková</h3>
        <div className="auto-source-file"><span aria-hidden="true">↳</span><div><strong>Občiansky preukaz · vzor</strong><span>Meno a adresa načítané do profilu</span></div><span aria-hidden="true">✓</span></div>
        <dl className="auto-demo-fields"><div><dt>Pracovná pozícia</dt><dd>Koordinátorka výroby</dd></div><div><dt>Nástup</dt><dd>1. november 2026</dd></div><div><dt>Firemné vzory</dt><dd>Nástupný balík</dd></div></dl>
        <button className="auto-demo-action" onClick={() => setGenerated(value => !value)}>{generated ? "Skryť pripravené dokumenty" : "Pripraviť nástupné dokumenty"}<span aria-hidden="true">↗</span></button>
        {generated && <div className="auto-demo-result" role="status"><strong>Podklady pre Martinu sú pripravené</strong><ul className="auto-generated-list"><li>Pracovná zmluva</li><li>Osobný dotazník</li><li>Protokol o prevzatí vybavenia</li></ul><span>Vyplnené podľa firemných vzorov. Pripravené na vašu kontrolu.</span></div>}
        <p className="auto-memory-note"><span aria-hidden="true">↻</span> Pri ďalšom dokumente použijete tento profil.</p>
      </>}
      {active === "dodatok" && <>
        <div className="auto-demo-label"><span>Zmena pracovnej pozície</span><span className="auto-chip">Z uloženého profilu</span></div>
        <h3>Martina Nováková</h3>
        <div className="auto-source-file"><span aria-hidden="true">✓</span><div><strong>Údaje už máte uložené</strong><span>Občiansky preukaz znova nenahrávate</span></div></div>
        <label className="auto-demo-input">Nová pracovná pozícia<select value={position} onChange={event => { setPosition(event.target.value); setAmended(false); }}><option>Vedúca tímu</option><option>Projektová manažérka</option><option>Koordinátorka prevádzky</option></select></label>
        <button className="auto-demo-action" onClick={() => setAmended(value => !value)}>{amended ? "Skryť ukážku dodatku" : "Pripraviť dodatok"}<span aria-hidden="true">↗</span></button>
        {amended && <div className="auto-demo-result" role="status"><strong>Personalizovaný dodatok pripravený</strong><p>Martina Nováková · nová pozícia: {position}.</p><span>Ostatné údaje sa doplnili z uloženého profilu.</span></div>}
        <p className="auto-memory-note"><span aria-hidden="true">↻</span> Doplníte iba to, čo sa mení.</p>
      </>}
      {active === "prilezitosti" && <>
        <div className="auto-demo-label"><span>Nová príležitosť</span><span className="auto-chip">Váš odbor a región</span></div>
        <h3>Elektroinštalácia prevádzky</h3>
        <dl className="auto-demo-fields"><div><dt>Región</dt><dd>Bratislavský kraj</dd></div><div><dt>Typ zákazky</dt><dd>Dodávka a montáž</dd></div><div><dt>Zdroj</dt><dd>Dopytový portál · vzorový záznam</dd></div></dl>
        <p className="auto-demo-notice">Systém našiel zákazku podľa zamerania firmy. Podmienky a odkaz na zadanie máte pri nej.</p>
        <button className="auto-demo-action" onClick={() => setSaved(value => !value)}>{saved ? "Odobrať zo zoznamu" : "Uložiť príležitosť"}<span aria-hidden="true">{saved ? "✓" : "+"}</span></button>
        {saved && <div className="auto-demo-result" role="status"><strong>Uložené na prípravu ponuky</strong><p>Príležitosť nájdete vo svojom firemnom prehľade.</p></div>}
      </>}
    </div>
    <p className="auto-preview-caption">Ukážka s fiktívnymi údajmi. Váš systém vytvoríme podľa postupov vašej firmy.</p>
  </div>;
}
