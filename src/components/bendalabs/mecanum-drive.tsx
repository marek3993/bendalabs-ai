"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { CSSProperties, KeyboardEvent as ReactKeyboardEvent } from "react";
import { advanceDrive, advanceDriveHold, createMecanumScene, crossesCheckpoint, DRIVE_CHECKPOINTS, DRIVE_PARK, headingDifference, initialDrivePose, isParked, releaseDriveHold } from "./mecanum-scene";
import type { DriveHold, DriveInput, DriveScene, DriveView } from "./mecanum-scene";
import "../../app/mecanum-drive.css";

type Action = "forward" | "back" | "left" | "right" | "turnLeft" | "turnRight";
type Snapshot = { checkpoint: number; complete: boolean; heading: number; distance: number; moving: boolean; paused: boolean; parking: number; started: boolean; nearPark: boolean };
type Controller = { press: (source: string, action: Action) => void; release: (source: string, completeTap?: boolean) => void; stop: () => void; activate: () => void; reset: () => void; pause: () => void; speed: (speed: number) => void; view: (view: DriveView) => void };
const KEY_ACTION: Record<string, Action> = { ArrowUp: "forward", ArrowDown: "back", ArrowLeft: "left", ArrowRight: "right", a: "turnLeft", q: "turnLeft", d: "turnRight", e: "turnRight" };
const START: Snapshot = { checkpoint: 0, complete: false, heading: 0, distance: 0, moving: false, paused: false, parking: 0, started: false, nearPark: false };
const CONTROL: { action: Action; glyph: string; sk: string; cs: string; key: string }[] = [
  { action: "turnLeft", glyph: "↶", sk: "Otočiť doľava", cs: "Otočit doleva", key: "A / Q" },
  { action: "forward", glyph: "↑", sk: "Dopredu", cs: "Dopředu", key: "↑" },
  { action: "turnRight", glyph: "↷", sk: "Otočiť doprava", cs: "Otočit doprava", key: "D / E" },
  { action: "left", glyph: "←", sk: "Posun doľava", cs: "Posun doleva", key: "←" },
  { action: "back", glyph: "↓", sk: "Dozadu", cs: "Dozadu", key: "↓" },
  { action: "right", glyph: "→", sk: "Posun doprava", cs: "Posun doprava", key: "→" },
];

export default function MecanumDrive({ cs = false }: { cs?: boolean }) {
  const canvas = useRef<HTMLCanvasElement>(null), arena = useRef<HTMLDivElement>(null), controller = useRef<Controller | null>(null);
  const releasedPointers = useRef(new Set<number>());
  const [available, setAvailable] = useState<boolean | null>(null), [snapshot, setSnapshot] = useState<Snapshot>(START);
  const [speed, setSpeed] = useState(1.65), [view, setView] = useState<DriveView>("arena"), [focused, setFocused] = useState(false);
  const [pressed, setPressed] = useState<Action[]>([]);
  const id = useId();

  useEffect(() => {
    if (!canvas.current) return;
    let disposed = false, ready = false, frame = 0, lastTime = 0, lastPublish = 0, distance = 0, parking = 0, started = false, paused = false, driveSpeed = 1.65;
    let scene: DriveScene = { pose: initialDrivePose(), path: [[-2.75, -1.65]], checkpoint: 0, complete: false, view: "arena" };
    let renderer: ReturnType<typeof createMecanumScene> | null = null;
    const held = new Map<string, DriveHold & { action: Action }>();
    const input = (): DriveInput => {
      const values = new Set([...held.values()].map(hold => hold.action));
      return { forward: Number(values.has("forward")) - Number(values.has("back")), strafe: Number(values.has("right")) - Number(values.has("left")), turn: Number(values.has("turnLeft")) - Number(values.has("turnRight")) };
    };
    const moving = () => { const i = input(); return Boolean(i.forward || i.strafe || i.turn); };
    function publish() {
      if (disposed) return;
      setSnapshot({ checkpoint: scene.checkpoint, complete: scene.complete, heading: scene.pose.yaw * 180 / Math.PI, distance, moving: moving(), paused, parking, started, nearPark: Math.hypot(scene.pose.x - DRIVE_PARK.x, scene.pose.y - DRIVE_PARK.y) < 0.6 });
      setPressed([...new Set([...held.values()].map(hold => hold.action))]);
    }
    function paint() { renderer?.update(scene); }
    function cancel() { cancelAnimationFrame(frame); frame = 0; lastTime = 0; }
    function stop() { held.clear(); parking = 0; cancel(); publish(); }
    function wake() { if (!frame && !paused && renderer && ready && !disposed && !document.hidden) { lastTime = performance.now(); frame = requestAnimationFrame(tick); } }
    function checkParking() { if (isParked(scene.pose, scene.checkpoint) && !scene.complete) wake(); }
    function tick(now: number) {
      frame = 0;
      if (paused || disposed) return;
      const dt = Math.min(0.05, (now - lastTime) / 1000); lastTime = now;
      const controls = input(), isMoving = Boolean(controls.forward || controls.strafe || controls.turn), before = scene.pose;
      if (isMoving) {
        scene.pose = advanceDrive(before, controls, dt, driveSpeed); started = true;
        distance += Math.hypot(scene.pose.x - before.x, scene.pose.y - before.y);
        const last = scene.path[scene.path.length - 1];
        if (Math.hypot(scene.pose.x - last[0], scene.pose.y - last[1]) > 0.065) {
          scene.path.push([scene.pose.x, scene.pose.y]);
          if (scene.path.length > 380) scene.path.shift();
        }
        const target = DRIVE_CHECKPOINTS[scene.checkpoint];
        if (target && crossesCheckpoint(before, scene.pose, target)) { scene.checkpoint++; publish(); }
      }
      for (const [source, hold] of held) {
        const next = advanceDriveHold(hold, dt);
        if (next) held.set(source, next); else held.delete(source);
      }
      const aligned = isParked(scene.pose, scene.checkpoint);
      parking = aligned && !isMoving && !scene.complete ? Math.min(1, parking + dt / 0.65) : 0;
      if (parking >= 1 && !scene.complete) { scene.complete = true; publish(); }
      paint();
      if (now - lastPublish > 90 || !isMoving) { publish(); lastPublish = now; }
      if (held.size || (aligned && !scene.complete)) frame = requestAnimationFrame(tick);
    }
    try {
      renderer = createMecanumScene(canvas.current, (nextReady) => { ready = nextReady; if (!disposed) { setAvailable(nextReady); if (!nextReady) stop(); else checkParking(); } });
      paint();
    } catch { queueMicrotask(() => { if (!disposed) setAvailable(false); }); }
    controller.current = {
      press(source, action) { if (paused || !renderer || !ready) return; held.set(source, { action, elapsed: 0, released: false }); parking = 0; publish(); wake(); },
      release(source, completeTap = true) {
        const hold = held.get(source); if (!hold) return;
        const next = releaseDriveHold(hold, completeTap);
        if (next) held.set(source, next); else held.delete(source);
        publish(); wake();
      },
      stop,
      activate: checkParking,
      reset() { stop(); scene = { pose: initialDrivePose(), path: [[-2.75, -1.65]], checkpoint: 0, complete: false, view: scene.view }; distance = 0; parking = 0; started = false; paused = false; paint(); publish(); },
      pause() { paused = !paused; stop(); publish(); if (!paused) checkParking(); },
      speed(next) { driveSpeed = next; checkParking(); },
      view(next) { scene.view = next; paint(); checkParking(); },
    };
    const hidden = () => { if (document.hidden) stop(); };
    window.addEventListener("blur", stop); document.addEventListener("visibilitychange", hidden);
    return () => { disposed = true; held.clear(); cancel(); controller.current = null; window.removeEventListener("blur", stop); document.removeEventListener("visibilitychange", hidden); renderer?.dispose(); };
  }, []);

  function handleKey(event: ReactKeyboardEvent<HTMLDivElement>, down: boolean) {
    if (down && (event.altKey || event.ctrlKey || event.metaKey)) return;
    const key = event.key.length === 1 ? event.key.toLowerCase() : event.key, action = KEY_ACTION[key];
    if (action) {
      event.preventDefault();
      if (down && !event.repeat) controller.current?.press(`key:${key}`, action);
      if (!down) controller.current?.release(`key:${key}`);
    } else if (down && !event.repeat && (event.key === " " || event.key === "Escape")) {
      event.preventDefault();
      if (event.key === "Escape") { controller.current?.stop(); arena.current?.blur(); } else controller.current?.pause();
    }
  }

  const complete = snapshot.complete;
  const cameraAngle = snapshot.heading * Math.PI / 180 - (view === "close" ? -1 : -Math.PI / 2);
  const projectedHeading = Math.atan2(Math.cos(cameraAngle), Math.sin(cameraAngle) * Math.sin(view === "close" ? 0.48 : 1.03)) * 180 / Math.PI;
  const instruction = complete
    ? cs ? "Zaparkováno. Zkus stejnou trasu s otočeným autem." : "Zaparkované. Skús rovnakú trasu s otočeným autom."
    : snapshot.checkpoint === 0 ? cs ? "Projeď autem přes kruh 1." : "Prejdi autom cez kruh 1."
    : snapshot.checkpoint === 1 ? cs ? "Posuň se doprava ke kruhu 2. Auto nemusíš otáčet." : "Posuň sa doprava ku kruhu 2. Auto nemusíš otáčať."
    : snapshot.nearPark && Math.abs(headingDifference(snapshot.heading * Math.PI / 180, DRIVE_PARK.yaw)) > DRIVE_PARK.angle
      ? cs ? "Srovnej předek auta se šipkou v parkovacím místě." : "Zarovnaj predok auta so šípkou na parkovacom mieste."
      : cs ? "Zacouvej do místa se šipkou a uvolni ovládání." : "Zacúvaj na miesto so šípkou a uvoľni ovládanie.";

  return (
    <section className="mc-drive bl-demo-bounded" aria-label={cs ? "Řízení Mecanum auta" : "Riadenie Mecanum auta"}>
      <div className="mc-drive-intro">
        <div><span className="mc-drive-eyebrow">MECANUM / ESP32</span><h3>{cs ? "Tohle auto umí jet bokem." : "Toto auto vie jazdiť bokom."}</h3><p>{cs ? "Projeď dva body a zaparkuj. Vyzkoušej, co běžná kola nedokážou." : "Prejdi dva body a zaparkuj. Vyskúšaj, čo bežné kolesá nedokážu."}</p></div>
        <div className="mc-drive-view" aria-label={cs ? "Pohled kamery" : "Pohľad kamery"}>
          {(["arena", "close"] as const).map(value => <button type="button" key={value} aria-pressed={view === value} onClick={() => { setView(value); controller.current?.view(value); }}>{value === "arena" ? cs ? "Celá dráha" : "Celá dráha" : cs ? "Zblízka" : "Zblízka"}</button>)}
        </div>
      </div>

      <div className="bl-demo-workspace">
      <div className="bl-demo-preview">
      <div className={`mc-drive-stage${focused ? " is-focused" : ""}${complete ? " is-complete" : ""}`} ref={arena} tabIndex={available ? 0 : -1} role="group"
        aria-label={cs ? "Jízdní plocha. Šipky pro jízdu, A a D pro otáčení, mezerník pro pauzu." : "Jazdná plocha. Šípky na jazdu, A a D na otáčanie, medzerník na pauzu."} aria-describedby={`${id}-keys`}
        onKeyDown={event => handleKey(event, true)} onKeyUp={event => handleKey(event, false)}
        onFocus={() => { setFocused(true); controller.current?.activate(); }} onBlur={() => { setFocused(false); controller.current?.stop(); }}
        onPointerDown={() => arena.current?.focus({ preventScroll: true })}>
        <canvas ref={canvas} className="mc-drive-canvas" aria-hidden="true" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", maxWidth: "100%", maxHeight: "100%", minWidth: 0, minHeight: 0 }} />
        <div className="mc-drive-hud" aria-hidden="true">
          <span className={`mc-drive-state${snapshot.moving ? " is-driving" : ""}`}><i />{snapshot.paused ? cs ? "Pozastaveno" : "Pozastavené" : snapshot.moving ? cs ? "Jízda" : "Jazda" : complete ? cs ? "Zaparkováno" : "Zaparkované" : cs ? "Připraveno" : "Pripravené"}</span>
          <span className="mc-drive-heading"><span style={{ transform: `rotate(${projectedHeading}deg)` }}>↑</span>{cs ? "předek" : "predok"}</span>
        </div>
        {!focused && !snapshot.started && available && <div className="mc-drive-start" aria-hidden="true"><span>↗</span>{cs ? "Klikni do dráhy a zkus šipky" : "Klikni do dráhy a skús šípky"}<small>{cs ? "nebo podrž směrová tlačítka" : "alebo podrž smerové tlačidlá"}</small></div>}
        {snapshot.paused && <div className="mc-drive-overlay"><strong>{cs ? "Jízda pozastavena" : "Jazda pozastavená"}</strong><span>{cs ? "Pokračuj tlačítkem nebo mezerníkem." : "Pokračuj tlačidlom alebo medzerníkom."}</span></div>}
        {available === false && <div className="mc-drive-overlay"><strong>{cs ? "3D zobrazení není dostupné" : "3D zobrazenie nie je dostupné"}</strong><span>{cs ? "Pro tuto ukázku povol v prohlížeči hardwarovou akceleraci." : "Pre túto ukážku povoľ v prehliadači hardvérovú akceleráciu."}</span></div>}
        <span className="mc-drive-photo-note">{cs ? "3D podoba mého prototypu podle fotografií" : "3D podoba môjho prototypu podľa fotografií"}</span>
      </div>

      <div className={`mc-drive-mission${complete ? " is-complete" : ""}`}>
        <div className="mc-drive-steps" aria-label={cs ? "Postup výzvy" : "Postup výzvy"}>
          {[0, 1, 2].map(i => <span key={i} className={i < snapshot.checkpoint || (i === 2 && complete) ? "is-done" : i === snapshot.checkpoint ? "is-current" : ""} aria-label={`${i === 2 ? cs ? "Parkování" : "Parkovanie" : `${cs ? "Bod" : "Bod"} ${i + 1}`}: ${i < snapshot.checkpoint || (i === 2 && complete) ? cs ? "hotovo" : "hotovo" : i === snapshot.checkpoint ? cs ? "na řadě" : "na rade" : cs ? "čeká" : "čaká"}`}>
            {i < snapshot.checkpoint || (i === 2 && complete) ? "✓" : i === 2 ? "P" : i + 1}
          </span>)}
        </div>
        <p aria-live="polite">{instruction}</p>
        {snapshot.parking > 0 && !complete && <span className="mc-drive-parking" style={{ "--parking": `${snapshot.parking * 100}%` } as CSSProperties}>{cs ? "Parkuji…" : "Parkujem…"}</span>}
      </div>

      </div>
      <div className="bl-demo-panel" role="region" aria-label={cs ? "Ovládání autíčka" : "Ovládanie autíčka"} tabIndex={0}>
      <div className="mc-drive-controls">
        <div className="mc-drive-pad" aria-label={cs ? "Podrž pro jízdu" : "Podrž na jazdu"}>
          {CONTROL.map(control => <button type="button" key={control.action} className={`mc-drive-key mc-drive-key-${control.action}${pressed.includes(control.action) ? " is-held" : ""}`} disabled={available !== true || snapshot.paused}
            aria-label={`${cs ? control.cs : control.sk} (${control.key})`} title={`${cs ? control.cs : control.sk} · ${control.key}`}
            onPointerDown={event => { if (event.button !== 0) return; event.preventDefault(); releasedPointers.current.delete(event.pointerId); arena.current?.focus({ preventScroll: true }); event.currentTarget.setPointerCapture(event.pointerId); controller.current?.press(`pointer:${event.pointerId}`, control.action); }}
            onPointerUp={event => { controller.current?.release(`pointer:${event.pointerId}`); if (event.currentTarget.hasPointerCapture(event.pointerId)) { releasedPointers.current.add(event.pointerId); event.currentTarget.releasePointerCapture(event.pointerId); } }}
            onPointerCancel={event => { releasedPointers.current.delete(event.pointerId); controller.current?.release(`pointer:${event.pointerId}`, false); }}
            onLostPointerCapture={event => { if (!releasedPointers.current.delete(event.pointerId)) controller.current?.release(`pointer:${event.pointerId}`, false); }}
            onKeyDown={event => { if (event.key === " " || event.key === "Enter") { event.preventDefault(); if (!event.repeat) controller.current?.press(`button:${control.action}`, control.action); } }}
            onKeyUp={event => { if (event.key === " " || event.key === "Enter") { event.preventDefault(); controller.current?.release(`button:${control.action}`); } }}
            onBlur={() => controller.current?.release(`button:${control.action}`, false)}>
            <span aria-hidden="true">{control.glyph}</span><small>{control.action.startsWith("turn") ? control.key : cs ? control.cs : control.sk}</small>
          </button>)}
        </div>
        <div className="mc-drive-settings">
          <p id={`${id}-keys`}><strong>{cs ? "Šipky = jízda a posun do stran." : "Šípky = jazda a posun do strán."}</strong> {cs ? "A / D nebo Q / E = otáčení. Směry se řídí předkem auta. Krátce ťukni pro krok, podrž pro plynulou jízdu." : "A / D alebo Q / E = otáčanie. Smery sa riadia predkom auta. Krátko ťukni na krok, podrž na plynulú jazdu."}</p>
          <label className="mc-drive-speed" htmlFor={`${id}-speed`}><span>{cs ? "Rychlost" : "Rýchlosť"}</span><input id={`${id}-speed`} type="range" min="0.7" max="2.6" step="0.05" value={speed} onChange={event => { const next = Number(event.target.value); setSpeed(next); controller.current?.speed(next); }} /><output>{Math.round(speed / 2.6 * 100)} %</output></label>
          <div className="mc-drive-actions"><button type="button" onClick={() => controller.current?.pause()} disabled={available !== true}>{snapshot.paused ? cs ? "Pokračovat" : "Pokračovať" : "Pauza"}<span aria-hidden="true">{snapshot.paused ? "▷" : "Ⅱ"}</span></button><button type="button" onClick={() => controller.current?.reset()} disabled={available !== true}>{cs ? "Znovu od startu" : "Znova od štartu"}<span aria-hidden="true">↺</span></button></div>
        </div>
      </div>
      <p className="mc-drive-explanation">{cs ? "Simulace v prohlížeči. Šikmé válečky a samostatně řízená kola umožňují pohyb bokem i otočení na místě. Při jízdě sleduj, jak každé kolo mění směr." : "Simulácia v prehliadači. Šikmé valčeky a samostatne riadené kolesá umožňujú pohyb bokom aj otočenie na mieste. Pri jazde sleduj, ako každé koleso mení smer."}</p>
      </div>
      </div>
    </section>
  );
}
