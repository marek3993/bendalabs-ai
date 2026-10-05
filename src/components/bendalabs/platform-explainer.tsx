"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPlatformRenderer, type PlatformMeshes, type PlatformMode, type PlatformPart, type PlatformScene, type PlatformVariant, type PlatformView } from "./platform-renderer";
import "@/app/platform-explainer.css";

export default function PlatformExplainer({ cs = false, en = false }: { cs?: boolean; en?: boolean }) {
  const uid = useId();
  const canvas = useRef<HTMLCanvasElement>(null);
  const renderer = useRef<ReturnType<typeof createPlatformRenderer> | null>(null);
  const animation = useRef(0);
  const reducedMotion = useRef(false);
  const scene = useRef<PlatformScene>({ spread: 0, yaw: 0, variant: "top-dual", view: "front", mode: "load", selected: "all" });
  const [spread, setSpread] = useState(0);
  const [mode, setMode] = useState<PlatformMode>("load");
  const [selected, setSelected] = useState<PlatformPart>("all");
  const [yaw, setYaw] = useState(0);
  const [variant, setVariant] = useState<PlatformVariant>("top-dual");
  const [view, setView] = useState<PlatformView>("front");
  const [playing, setPlaying] = useState(false);
  const [status, setStatus] = useState<"loading" | "ready" | "unavailable">("loading");
  const [attempt, setAttempt] = useState(0);
  const ready = status === "ready";

  const stop = useCallback(() => {
    if (animation.current) cancelAnimationFrame(animation.current);
    animation.current = 0;
    setPlaying(false);
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    reducedMotion.current = media.matches;
    const onMotion = () => { reducedMotion.current = media.matches; if (media.matches) stop(); };
    const onVisibility = () => { if (document.hidden) stop(); };
    media.addEventListener("change", onMotion);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      media.removeEventListener("change", onMotion);
      document.removeEventListener("visibilitychange", onVisibility);
      if (animation.current) cancelAnimationFrame(animation.current);
      animation.current = 0;
    };
  }, [stop]);

  useEffect(() => {
    let disposed = false;
    const controller = new AbortController();
    const target = canvas.current;
    if (!target) return;
    fetch("/projects/platform-meshes.json", { signal: controller.signal })
      .then(response => {
        if (!response.ok) throw new Error("Model unavailable");
        return response.json() as Promise<PlatformMeshes>;
      })
      .then(data => {
        if (disposed) return;
        const instance = createPlatformRenderer(target, data, next => { if (!disposed) setStatus(next); }, stop);
        renderer.current = instance;
        instance.update(scene.current);
        setStatus("ready");
      })
      .catch(() => { if (!disposed) setStatus("unavailable"); });
    return () => {
      disposed = true;
      controller.abort();
      renderer.current?.dispose();
      renderer.current = null;
    };
  }, [attempt, stop]);

  useEffect(() => {
    scene.current = { spread, yaw, variant, view, mode, selected };
    renderer.current?.update(scene.current);
  }, [spread, yaw, variant, view, mode, selected]);

  function play() {
    if (playing) { stop(); return; }
    if (mode === "rotation") {
      const from = yaw, to = yaw >= 60 ? -60 : 60;
      if (reducedMotion.current) { setYaw(to); return; }
      const start = performance.now(); setPlaying(true);
      const tick = (now: number) => {
        const time = Math.min(1, (now - start) / 3000), ease = time * time * (3 - 2 * time);
        setYaw(Math.round(from + (to - from) * ease));
        if (time < 1) animation.current = requestAnimationFrame(tick);
        else { animation.current = 0; setPlaying(false); }
      };
      animation.current = requestAnimationFrame(tick); return;
    }
    setMode("parts"); setSelected("all");
    const to = spread >= 100 ? 0 : 100;
    if (reducedMotion.current) { setSpread(to); return; }
    const from = spread, start = performance.now(), duration = Math.max(700, 40 * Math.abs(to - from));
    setPlaying(true);
    const tick = (now: number) => {
      const time = Math.min(1, (now - start) / duration), ease = time * time * (3 - 2 * time);
      setSpread(Math.round(from + (to - from) * ease));
      if (time < 1) animation.current = requestAnimationFrame(tick);
      else { animation.current = 0; setPlaying(false); }
    };
    animation.current = requestAnimationFrame(tick);
  }

  function chooseView(next: PlatformView) {
    stop(); setView(next); renderer.current?.resetView(next);
  }

  function chooseMode(next: PlatformMode) {
    stop(); setMode(next); setSelected("all");
    if (next === "parts") { if (spread === 0) setSpread(65); }
    else setSpread(0);
  }
  function choosePart(next: PlatformPart) {
    stop(); setSelected(selected === next ? "all" : next);
    if (mode !== "parts") { setMode("parts"); setSpread(65); }
  }

  const viewLabels: [PlatformView, string][] = en ? [["front", "Front"], ["back", "Back"], ["side", "Left"], ["right", "Right"], ["top", "Top"], ["under", "Bottom"]] : cs
    ? [["front", "Zepředu"], ["back", "Zezadu"], ["side", "Zleva"], ["right", "Zprava"], ["top", "Shora"], ["under", "Zespodu"]]
    : [["front", "Spredu"], ["back", "Zozadu"], ["side", "Zľava"], ["right", "Sprava"], ["top", "Zhora"], ["under", "Zospodu"]];
  const playLabel = playing ? (en ? "Pause" : cs ? "Pozastavit" : "Pozastaviť") : mode === "rotation" ? (en ? "Show rotation" : cs ? "Ukázat otáčení" : "Ukázať otáčanie") : spread >= 100
    ? (en ? "Assemble platform" : cs ? "Složit platformu" : "Zložiť platformu") : (en ? "Explode platform" : cs ? "Rozložit platformu" : "Rozložiť platformu");
  const parts: { id: PlatformPart; label: string; description: string }[] = en ? [
    { id: "upper", label: "Upper part", description: "The rotating upper part carries the arm mount. The raised variant adds a side platform for a second shoulder servo." },
    { id: "bearing", label: "Bearing", description: "The large bearing supports the rotating part and transfers the arm's weight to the fixed frame while allowing it to rotate." },
    { id: "frame", label: "Fixed frame", description: "The pillars and bottom plate transfer the load from the bearing to the supporting surface. This part stays still when the base rotates." },
    { id: "servo", label: "Servos", description: "The bottom servo drives the base rotation. The upper servo, or pair of servos, bends and lifts the arm." },
  ] : cs ? [
    { id: "upper", label: "Horní díl", description: "Otočný horní díl nese uchycení ramene. Zvýšená varianta přidává boční plošinu pro druhé ramenní servo." },
    { id: "bearing", label: "Ložisko", description: "Velké ložisko podpírá otočný díl a přenáší hmotnost ruky do pevného rámu. Současně umožňuje otáčení." },
    { id: "frame", label: "Pevný rám", description: "Sloupky a spodní deska přenášejí zatížení od ložiska do podložky. Tato část se při otáčení základny nepohybuje." },
    { id: "servo", label: "Serva", description: "Spodní servo pohání otáčení základny. Horní servo, případně dvojice serv, slouží k ohybu a zdvihu ramene." },
  ] : [
    { id: "upper", label: "Horný diel", description: "Otočný horný diel nesie uchytenie ramena. Zvýšený variant pridáva bočnú plošinu pre druhé ramenné servo." },
    { id: "bearing", label: "Ložisko", description: "Veľké ložisko podopiera otočný diel a prenáša hmotnosť ruky do pevného rámu. Súčasne umožňuje otáčanie." },
    { id: "frame", label: "Pevný rám", description: "Stĺpiky a spodná doska prenášajú zaťaženie od ložiska do podložky. Táto časť sa pri otáčaní základne nepohybuje." },
    { id: "servo", label: "Servá", description: "Spodné servo poháňa otáčanie základne. Horné servo, prípadne dvojica serv, slúži na ohyb a zdvih ramena." },
  ];
  const focusDescription = selected !== "all" ? parts.find(part => part.id === selected)!.description
    : mode === "load" ? (en ? "Green arrows show the load path: upper part → bearing → fixed frame." : cs ? "Zelené šipky ukazují směr přenosu hmotnosti: horní díl → ložisko → pevný rám." : "Zelené šípky ukazujú smer prenosu hmotnosti: horný diel → ložisko → pevný rám.")
    : mode === "rotation" ? (en ? "Orange arcs show rotation. The bottom servo drives the upper part while the fixed frame stays in place." : cs ? "Oranžové oblouky ukazují otáčení. Spodní servo pohání horní díl, pevný rám zůstává na místě." : "Oranžové oblúky ukazujú otáčanie. Spodné servo poháňa horný diel, pevný rám zostáva na mieste.")
    : (en ? "Select a part to explore its role. Select it again to show the whole assembly." : cs ? "Vyberte díl a prohlédněte si jeho roli. Opětovným stiskem zobrazíte celou sestavu." : "Vyberte diel a prezrite si jeho úlohu. Opätovným stlačením zobrazíte celú zostavu.");

  return <section className="pf-demo bl-demo-bounded" aria-labelledby={`${uid}-title`}>
    <header className="pf-demo-header">
      <div><span className="pf-demo-eyebrow">{en ? "Explore the structure" : cs ? "Prohlédněte si konstrukci" : "Prezrite si konštrukciu"}</span>
        <h4 id={`${uid}-title`}>{en ? "The platform from every angle" : cs ? "Platforma ze všech stran" : "Platforma zo všetkých strán"}</h4></div>
      <span className="pf-demo-badge">3D</span>
    </header>

    <div className="bl-demo-workspace">
    <figure className="pf-demo-figure bl-demo-preview">
      <div className="pf-demo-stage" aria-busy={status === "loading"}>
        <canvas key={attempt} ref={canvas} tabIndex={ready ? 0 : -1} role="img"
          aria-label={en ? "3D model of the supporting platform: fixed frame, bearing, rotating upper part and servos." : cs ? "3D model nosné platformy: pevný rám, ložisko, otočný vrch a serva." : "3D model nosnej platformy: pevný rám, ložisko, otočný vrch a servá."}
          aria-describedby={`${uid}-help ${uid}-caption`} aria-hidden={!ready}>
          {en ? "The bearing transfers the arm's weight into the fixed frame. The bottom servo drives rotation." : cs ? "Ložisko přenáší hmotnost ramene do pevného rámu. Spodní servo zajišťuje otáčení." : "Ložisko prenáša hmotnosť ramena do pevného rámu. Spodné servo zabezpečuje otáčanie."}
        </canvas>
        {status === "loading" && <div className="pf-demo-state" role="status"><span className="pf-demo-loader" aria-hidden="true" />{en ? "Loading the 3D model…" : cs ? "Načítám 3D model…" : "Načítavam 3D model…"}</div>}
        {status === "unavailable" && <div className="pf-demo-state" role="status">
          <strong>{en ? "3D view is unavailable." : cs ? "3D zobrazení není dostupné." : "3D zobrazenie nie je dostupné."}</strong>
          <span>{en ? "The bearing carries the load into the fixed frame; the bottom servo rotates the upper part." : cs ? "Ložisko nese hmotnost do pevného rámu, spodní servo otáčí horní částí." : "Ložisko nesie hmotnosť do pevného rámu, spodné servo otáča hornou časťou."}</span>
          <button type="button" className="pf-demo-retry" onClick={() => { stop(); setStatus("loading"); setAttempt(value => value + 1); }}>{en ? "Try again" : cs ? "Zkusit znovu" : "Skúsiť znova"}</button>
        </div>}
        {ready && <span className="pf-demo-stage-label" aria-hidden="true">{spread === 0 ? (en ? "Assembled platform" : cs ? "Složená platforma" : "Zložená platforma") : en ? "Exploded platform" : "Rozložená platforma"}</span>}
      </div>
    </figure>
    <div className="bl-demo-panel" role="region" aria-label={en ? "Platform controls" : cs ? "Ovládání platformy" : "Ovládanie platformy"} tabIndex={0}>
    <div className="pf-demo-modes" role="group" aria-label={en ? "What the platform does" : cs ? "Co platforma dělá" : "Čo platforma robí"}>
      {(["load", "rotation", "parts"] as const).map((item, index) => <button key={item} type="button" disabled={!ready} aria-pressed={mode === item} onClick={() => chooseMode(item)}>{(en ? ["Carries the load", "Rotates the arm", "Explore the parts"] : cs ? ["Přenáší hmotnost", "Otáčí ramenem", "Prohlédnout díly"] : ["Prenáša hmotnosť", "Otáča ramenom", "Prezrieť diely"])[index]}</button>)}
    </div>

    <div className="pf-demo-toolbar">
      <label className="pf-demo-field" htmlFor={`${uid}-variant`}>
        <span>{en ? "Arm mount" : cs ? "Uchycení ramene" : "Uchytenie ramena"}</span>
        <select id={`${uid}-variant`} value={variant} disabled={!ready} onChange={event => { stop(); setVariant(event.target.value as PlatformVariant); }}>
          <option value="top-dual">{en ? "Modified for two servos" : cs ? "Úprava pro dvě serva" : "Úprava pre dve servá"}</option>
          <option value="top-original">{en ? "Original upper part · one servo" : cs ? "Původní vrch · jedno servo" : "Pôvodný vrch · jedno servo"}</option>
        </select>
      </label>
      <button className="pf-demo-play" type="button" disabled={!ready} onClick={play}>
        <span aria-hidden="true">{playing ? "Ⅱ" : mode === "rotation" ? "↻" : spread >= 100 ? "↓" : "↑"}</span>{playLabel}
      </button>
    </div>

    <div className="pf-demo-sliders">
      <label className="pf-demo-field" htmlFor={`${uid}-spread`}>
        <span>{en ? "Exploded view" : cs ? "Rozložení" : "Rozloženie"}<output htmlFor={`${uid}-spread`}>{spread} %</output></span>
        <input id={`${uid}-spread`} type="range" min="0" max="100" step="1" value={spread} disabled={!ready} onChange={event => { stop(); setMode("parts"); setSpread(Number(event.target.value)); }} />
        <span className="pf-demo-range-ends" aria-hidden="true"><span>{en ? "Assembled" : cs ? "Složené" : "Zložené"}</span><span>{en ? "Exploded" : "Rozložené"}</span></span>
      </label>
      <label className="pf-demo-field" htmlFor={`${uid}-yaw`}>
        <span>{en ? "Base rotation" : cs ? "Otočení základny" : "Otočenie základne"}<output htmlFor={`${uid}-yaw`}>{yaw}°</output></span>
        <input id={`${uid}-yaw`} type="range" min="-90" max="90" step="1" value={yaw} disabled={!ready} aria-valuetext={`${yaw}°`} onChange={event => { stop(); if (mode === "load") setMode("rotation"); setYaw(Number(event.target.value)); }} />
        <span className="pf-demo-range-ends" aria-hidden="true"><span>−90°</span><span>90°</span></span>
      </label>
    </div>

      <div className="pf-demo-part-buttons" role="group" aria-label={en ? "Select an assembly part" : cs ? "Vybrat díl sestavy" : "Vybrať diel zostavy"}>
        {parts.map((part, index) => <button type="button" key={part.id} disabled={!ready} aria-pressed={selected === part.id} onClick={() => choosePart(part.id)}><span aria-hidden="true">{index + 1}</span>{part.label}</button>)}
      </div>
      <p className={`pf-demo-focus-copy pf-demo-focus-${mode}`} role="status">{focusDescription}</p>
      <p className="pf-demo-caption" id={`${uid}-caption`}>
        {en ? "Printed parts from my own design. The bearing and servos use simplified shapes based on their dimensions; their positions in the assembly are approximate." : cs ? "Tištěné díly z vlastního návrhu. Ložisko a serva mají zjednodušené tvary podle rozměrů; jejich umístění v sestavě je orientační." : "Tlačené diely z vlastného návrhu. Ložisko a servá majú zjednodušené tvary podľa rozmerov; ich umiestnenie v zostave je orientačné."}
      </p>

    <div className="pf-demo-views" role="group" aria-label={en ? "Platform view" : cs ? "Pohled na platformu" : "Pohľad na platformu"}>
      {viewLabels.map(([value, label]) => <button key={value} type="button" disabled={!ready} aria-pressed={view === value} onClick={() => chooseView(value)}>{label}</button>)}
    </div>
    <p className="pf-demo-help" id={`${uid}-help`}>{en ? "Drag or use the arrow keys to rotate the view. Home restores the selected view." : cs ? "Pohled otočíte tažením nebo šipkami na klávesnici. Klávesa Home obnoví zvolený pohled." : "Pohľad otočíte potiahnutím alebo šípkami na klávesnici. Kláves Home obnoví zvolený pohľad."}</p>

    <div className="pf-demo-explanation">
      <p className="pf-demo-path-label">{en ? "Where the load goes" : cs ? "Kam se přenáší hmotnost" : "Kam sa prenáša hmotnosť"}</p>
      <ol className="pf-demo-load-path">
        {(en ? ["Arm", "Upper part", "Bearing", "Fixed frame"] : cs ? ["Rameno", "Horní díl", "Ložisko", "Pevný rám"] : ["Rameno", "Horný diel", "Ložisko", "Pevný rám"]).map(item => <li key={item}>{item}</li>)}
      </ol>
      <p>{en ? "The bottom servo produces rotation. The arm's weight passes through the bearing into the supporting structure." : cs ? "Spodní servo vytváří otáčení. Hmotnost ruky se přes ložisko přenáší do nosné konstrukce." : "Spodné servo vytvára otáčanie. Hmotnosť ruky sa cez ložisko prenáša do nosnej konštrukcie."}</p>
      <p className="pf-demo-variant-copy" aria-live="polite">{variant === "top-dual"
        ? (en ? "The raised upper part and side platform provide space for two shoulder servos. Their combined effect depends on mounting, synchronisation and load." : cs ? "Zvýšený vrch a boční plošina vytvářejí místo pro dvě ramenní serva. Jejich společný účinek závisí na uchycení, synchronizaci a zatížení." : "Zvýšený vrch a bočná plošina vytvárajú miesto pre dve ramenné servá. Ich spoločný účinok závisí od uchytenia, synchronizácie a zaťaženia.")
        : (en ? "The original upper part has a lower mount and a cutout near the rotation axis. It is shown here with one shoulder servo." : cs ? "Původní vrch má nižší uložení a výřez u osy otáčení. Zde je zobrazený s jedním ramenním servem." : "Pôvodný vrch má nižšie uloženie a výrez pri osi otáčania. Tu je zobrazený s jedným ramenným servom.")}</p>
    </div>
    </div>
    </div>
  </section>;
}
