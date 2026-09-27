"use client";

import { Component, lazy, Suspense, useEffect, useId, useRef, useState, type ReactNode } from "react";
import "../../app/project-demos.css";

const MecanumDrive = lazy(() => import("./mecanum-drive"));
const TickerDevice = lazy(() => import("./ticker-device"));
const PlatformExplainer = lazy(() => import("./platform-explainer"));

export type ProjectDemoKind = "platform" | "mecanum" | "ticker";

const titles: Record<ProjectDemoKind, [string, string]> = {
  platform: ["Preskúmať konštrukciu základne v 3D", "Prozkoumat konstrukci základny ve 3D"],
  mecanum: ["Sadnúť za ovládanie 3D robota", "Sednout za ovládání 3D robota"],
  ticker: ["Vyskúšať ticker tromi tlačidlami", "Vyzkoušet ticker třemi tlačítky"],
};

class DemoBoundary extends Component<{ cs: boolean; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (this.state.failed) return <p role="alert" className="bl-demo-message">{this.props.cs ? "Ukázku se nepodařilo načíst. Obnovte stránku a zkuste ji otevřít znovu." : "Ukážku sa nepodarilo načítať. Obnovte stránku a skúste ju otvoriť znovu."}</p>;
    return this.props.children;
  }
}

export default function ProjectDemo({ kind, cs = false, defaultOpen = false }: { kind: ProjectDemoKind; cs?: boolean; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const id = useId();
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const ancestors: HTMLDetailsElement[] = [];
    let parent = root.current?.parentElement;
    while (parent) {
      if (parent instanceof HTMLDetailsElement) ancestors.push(parent);
      parent = parent.parentElement;
    }
    const onToggle = () => { if (ancestors.some(details => !details.open)) setOpen(false); };
    ancestors.forEach(details => details.addEventListener("toggle", onToggle));
    return () => ancestors.forEach(details => details.removeEventListener("toggle", onToggle));
  }, []);
  return <div className="bl-project-demo" ref={root}>
    <button type="button" className="bl-demo-toggle" aria-expanded={open} aria-controls={id} onClick={() => setOpen(value => !value)}>
      <span><span className="bl-demo-kicker">{cs ? "Interaktivní ukázka" : "Interaktívna ukážka"}</span>{titles[kind][cs ? 1 : 0]}</span>
      <span className="bl-demo-symbol" aria-hidden="true">{open ? "−" : "+"}</span>
    </button>
    <div id={id} hidden={!open}>
      {open && <DemoBoundary cs={cs}><Suspense fallback={<p role="status" className="bl-demo-message">{cs ? "Připravuji ukázku…" : "Pripravujem ukážku…"}</p>}>
        {kind === "platform" ? <PlatformExplainer cs={cs} /> : kind === "mecanum" ? <MecanumDrive cs={cs} /> : <TickerDevice cs={cs} />}
      </Suspense></DemoBoundary>}
    </div>
  </div>;
}
