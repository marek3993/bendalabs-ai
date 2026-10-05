"use client";

import { useState } from "react";
import { automationModules, type AutomationModuleId } from "@/lib/bendalabs/automation";

export default function AutomationPreview() {
  const [active, setActive] = useState<AutomationModuleId>("dokumenty");
  const [generated, setGenerated] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [saved, setSaved] = useState(false);
  return <div className="auto-preview" id="ukazka">
    <div className="auto-preview-bar"><span><i aria-hidden="true" /> Firemný priestor</span><span className="auto-demo-tag">Ukážka</span></div>
    <div className="auto-preview-heading"><div><span className="auto-micro">VAŠA FIRMA, S. R. O.</span><h2>Všetko pod kontrolou.</h2></div><span className="auto-avatar" aria-hidden="true">VF</span></div>
    <div className="auto-preview-tabs" role="tablist" aria-label="Ukážky modulov">
      {automationModules.map((module, index) => <button key={module.id} id={`demo-tab-${module.id}`} role="tab" aria-selected={active === module.id} aria-controls="demo-panel" tabIndex={active === module.id ? 0 : -1} onClick={() => setActive(module.id)} onKeyDown={event => {
        if (!["ArrowRight", "ArrowLeft", "Home", "End"].includes(event.key)) return;
        event.preventDefault();
        const next = event.key === "Home" ? 0 : event.key === "End" ? 2 : (index + (event.key === "ArrowRight" ? 1 : 2)) % 3;
        setActive(automationModules[next].id);
        document.getElementById(`demo-tab-${automationModules[next].id}`)?.focus();
      }}><span>{module.number}</span>{module.shortTitle}</button>)}
    </div>
    <div id="demo-panel" className="auto-demo-panel" role="tabpanel" aria-labelledby={`demo-tab-${active}`} tabIndex={0}>
      {active === "dokumenty" && <><div className="auto-demo-label"><span>Nový dokument</span><span className="auto-chip">Vaša šablóna</span></div><h3>Zmluva o dielo</h3><dl className="auto-demo-fields"><div><dt>Klient</dt><dd>Ukážková firma, s. r. o.</dd></div><div><dt>Predmet</dt><dd>Montáž vybavenia</dd></div><div><dt>Cena zákazky</dt><dd>2 400 €</dd></div></dl><button className="auto-demo-action" onClick={() => setGenerated(value => !value)}>{generated ? "Späť na údaje" : "Zobraziť vzorový dokument"}<span aria-hidden="true">↗</span></button>{generated && <div className="auto-demo-result" role="status"><strong>Vzorový dokument pripravený</strong><p>Objednávateľ: Ukážková firma, s. r. o.<br />Predmet: montáž vybavenia · cena: 2 400 €</p><span>Ďalší krok: vaša kontrola pred použitím.</span></div>}</>}
      {active === "spracovanie" && <><div className="auto-demo-label"><span>Prijatý dokument</span><span className="auto-chip">PDF</span></div><h3>dodaci-list-ukazka.pdf</h3><dl className="auto-demo-fields"><div><dt>Dodávateľ</dt><dd>Vzorový dodávateľ, s. r. o.</dd></div><div><dt>Číslo dokladu</dt><dd>DL-001</dd></div><div><dt>Počet položiek</dt><dd>12</dd></div></dl><p className="auto-demo-notice">Načítané údaje pred uložením skontrolujete.</p><button className="auto-demo-action" onClick={() => setConfirmed(value => !value)}>{confirmed ? "Vrátiť na kontrolu" : "Potvrdiť vzorové údaje"}<span aria-hidden="true">✓</span></button>{confirmed && <div className="auto-demo-result" role="status"><strong>Vzorové údaje potvrdené</strong><p>V reálnom systéme sa odošlú do dohodnutého výstupu.</p></div>}</>}
      {active === "prilezitosti" && <><div className="auto-demo-label"><span>Podľa profilu vašej firmy</span><span className="auto-chip">Zhodný odbor</span></div><h3>Montáž vybavenia prevádzky</h3><dl className="auto-demo-fields"><div><dt>Región</dt><dd>Bratislavský kraj</dd></div><div><dt>Typ zákazky</dt><dd>Dodávka a montáž</dd></div><div><dt>Zdroj</dt><dd>Dohodnutý portál · vzorový záznam</dd></div></dl><p className="auto-demo-notice">Odkaz na zdroj a podmienky máte na jednom mieste.</p><button className="auto-demo-action" onClick={() => setSaved(value => !value)}>{saved ? "Odobrať zo zoznamu" : "Uložiť vzorovú príležitosť"}<span aria-hidden="true">{saved ? "✓" : "+"}</span></button>{saved && <div className="auto-demo-result" role="status"><strong>Príležitosť vo vašom zozname</strong><p>O tom, či sa prihlásite, rozhodujete vy.</p></div>}</>}
    </div>
    <p className="auto-preview-caption">Ilustračná ukážka s fiktívnymi údajmi. Váš systém prispôsobíme dohodnutému postupu.</p>
  </div>;
}
