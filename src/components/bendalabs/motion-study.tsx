"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { SiteLocale } from "@/lib/bendalabs/site-content";
import ArmModel from "./arm-model";
import type { ArmView } from "./arm-model";
import { appendFrame, clampPose, formatTime, HOME_POSE, JOINTS, MAX_RECORDING_MS, PARK_POSE, playbackTime, poseAt, presetDuration, presetPose, SAMPLE_INTERVAL_MS } from "./arm-motion";
import type { ArmPose, MotionFrame } from "./arm-motion";
import { advanceCubeTask, CUBE_DEMO, constrainCubePose, cubeGripDistance, initialCubeTask, TASK_APPROACH } from "./arm-geometry";
import type { CubeTaskState } from "./arm-geometry";

type Mode = "idle" | "recording" | "playing" | "paused";

export default function MotionStudy({ locale = "sk" }: { locale?: SiteLocale }) {
  const cs = locale === "cs";
  const uid = useId();
  const [pose, setPose] = useState<ArmPose>([...HOME_POSE]);
  const [view, setView] = useState<ArmView>("perspective");
  const [mode, setMode] = useState<Mode>("idle");
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [task, setTask] = useState<CubeTaskState | null>(null);
  const taskRef = useRef<CubeTaskState | null>(null);
  const [example, setExample] = useState<"idle" | "playing" | "paused">("idle");
  const [reducedExample, setReducedExample] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const demoCursor = useRef(0);
  const poseRef = useRef<ArmPose>([...HOME_POSE]);
  const frames = useRef<MotionFrame[]>([]);
  const startTime = useRef(0);
  const playFrom = useRef(0);
  const cursor = useRef(0);
  const durationRef = useRef(0);
  const presetRequest = useRef(0);
  const recording = mode === "recording";
  const playing = mode === "playing";
  const hasRecording = duration > 0;

  const updatePose = useCallback((next: ArmPose) => {
    let safe = clampPose(next);
    if (taskRef.current) {
      const constrained = constrainCubePose(safe, taskRef.current);
      if (!constrained) { setBlocked(true); return; }
      safe = constrained;
      const updated = advanceCubeTask(taskRef.current, safe);
      taskRef.current = updated;
      setTask(updated);
    }
    setBlocked(false);
    poseRef.current = safe;
    setPose(safe);
  }, []);

  const cancelPreset = useCallback(() => {
    cancelAnimationFrame(presetRequest.current);
    presetRequest.current = 0;
  }, []);

  useEffect(() => {
    const visibility = () => { if (document.hidden) cancelPreset(); };
    document.addEventListener("visibilitychange", visibility);
    return () => { cancelPreset(); document.removeEventListener("visibilitychange", visibility); };
  }, [cancelPreset]);

  function moveToPreset(target: ArmPose) {
    if (playing || example === "playing") return;
    cancelPreset();
    if (mode === "paused") setMode("idle");
    const from: ArmPose = [...poseRef.current], to = clampPose(target);
    const total = presetDuration(from, to);
    if (!total) return;
    let previous = performance.now(), elapsed = 0;
    const tick = (now: number) => {
      // Keep delayed frames from skipping a large part of the physical movement.
      elapsed = Math.min(total, elapsed + Math.min(100, now - previous));
      previous = now;
      updatePose(presetPose(from, to, elapsed, total));
      presetRequest.current = elapsed < total ? requestAnimationFrame(tick) : 0;
    };
    presetRequest.current = requestAnimationFrame(tick);
  }

  function resetTask() {
    cancelPreset();
    setMode("idle"); setExample("idle"); setBlocked(false); demoCursor.current = 0;
    const fresh = initialCubeTask(); taskRef.current = fresh; setTask(fresh);
    updatePose([...TASK_APPROACH]);
  }

  function playExample() {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setReducedExample(reduce);
    if (example === "playing") { setExample("paused"); return; }
    if (!task || example === "idle") resetTask();
    if (reduce) {
      const next = CUBE_DEMO.find(frame => frame.time > demoCursor.current);
      if (next) {
        updatePose(next.pose); demoCursor.current = next.time;
        if (taskRef.current?.phase === "falling") {
          const settled = advanceCubeTask(taskRef.current, poseRef.current, 2); taskRef.current = settled; setTask(settled);
        }
        setExample(next === CUBE_DEMO.at(-1) ? "idle" : "paused");
      }
    } else setExample("playing");
  }

  useEffect(() => {
    if (example !== "playing") return;
    let request = 0, lastUpdate = 0;
    const from = demoCursor.current, start = performance.now(), total = CUBE_DEMO.at(-1)!.time;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const tick = (now: number) => {
      const position = Math.min(total, from + now - start);
      if (now - lastUpdate > 1000 / 30 || position === total) {
        demoCursor.current = position; updatePose(poseAt(CUBE_DEMO, position)); lastUpdate = now;
      }
      if (position >= total) { setExample("idle"); return; }
      request = requestAnimationFrame(tick);
    };
    const pause = () => { if (document.hidden || media.matches) { cancelAnimationFrame(request); setExample("paused"); setReducedExample(media.matches); } };
    request = requestAnimationFrame(tick);
    document.addEventListener("visibilitychange", pause); media.addEventListener("change", pause);
    return () => { cancelAnimationFrame(request); document.removeEventListener("visibilitychange", pause); media.removeEventListener("change", pause); };
  }, [example, updatePose]);

  useEffect(() => {
    if (task?.phase !== "falling") return;
    let request = 0, previous = performance.now();
    const tick = (now: number) => {
      if (!taskRef.current || taskRef.current.phase !== "falling") return;
      const dt = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 2 : Math.min(.05, (now - previous) / 1000);
      const next = advanceCubeTask(taskRef.current, poseRef.current, dt);
      previous = now; taskRef.current = next; setTask(next);
      if (next.phase === "falling") request = requestAnimationFrame(tick);
    };
    const visibility = () => { cancelAnimationFrame(request); previous = performance.now(); if (!document.hidden) request = requestAnimationFrame(tick); };
    request = requestAnimationFrame(tick); document.addEventListener("visibilitychange", visibility);
    return () => { cancelAnimationFrame(request); document.removeEventListener("visibilitychange", visibility); };
  }, [task?.phase]);

  function record(now: number) {
    frames.current = [];
    appendFrame(frames.current, 0, poseRef.current);
    startTime.current = now;
    cursor.current = 0;
    durationRef.current = 0;
    setTime(0);
    setDuration(0);
    setMode("recording");
  }

  function stop(now: number) {
    cancelPreset();
    if (recording) {
      const elapsed = Math.min(MAX_RECORDING_MS, now - startTime.current);
      appendFrame(frames.current, elapsed, poseRef.current);
      cursor.current = elapsed;
      durationRef.current = elapsed;
      setDuration(elapsed);
      setTime(elapsed);
    }
    setMode("idle");
  }

  function play(now: number) {
    if (!hasRecording) return;
    cancelPreset();
    const from = mode === "paused" && cursor.current < duration ? cursor.current : 0;
    playFrom.current = from;
    cursor.current = from;
    startTime.current = now;
    updatePose(poseAt(frames.current, from));
    setTime(from);
    setMode("playing");
  }

  function seek(next: number) {
    cancelPreset();
    cursor.current = next;
    setTime(next);
    updatePose(poseAt(frames.current, next));
    setMode("paused");
  }

  function manualPose(next: ArmPose, now: number) {
    if (playing || example === "playing") return;
    cancelPreset();
    if (example === "paused") setExample("idle");
    if (mode === "paused") setMode("idle");
    updatePose(next);
    if (recording) appendFrame(frames.current, now - startTime.current, poseRef.current);
  }

  useEffect(() => {
    if (mode !== "recording" && mode !== "playing") return;
    let request = 0;
    let lastUpdate = -SAMPLE_INTERVAL_MS;
    const tick = (now: number) => {
      const elapsed = now - startTime.current;
      if (mode === "recording") {
        const position = Math.min(elapsed, MAX_RECORDING_MS);
        if (position - lastUpdate >= SAMPLE_INTERVAL_MS || position === MAX_RECORDING_MS) {
          appendFrame(frames.current, position, poseRef.current);
          cursor.current = position;
          durationRef.current = position;
          setTime(position);
          setDuration(position);
          lastUpdate = position;
        }
        if (position >= MAX_RECORDING_MS) { setMode("idle"); return; }
      } else {
        const total = durationRef.current;
        const position = playbackTime(playFrom.current, elapsed, speed, total);
        if (elapsed - lastUpdate >= 1000 / 30 || position === total) {
          const next = poseAt(frames.current, position);
          poseRef.current = next;
          cursor.current = position;
          setPose(next);
          setTime(position);
          lastUpdate = elapsed;
        }
        if (position >= total) { setMode("idle"); return; }
      }
      request = requestAnimationFrame(tick);
    };
    const visibility = () => {
      if (!document.hidden) return;
      cancelAnimationFrame(request);
      if (mode === "recording") {
        const elapsed = Math.min(MAX_RECORDING_MS, performance.now() - startTime.current);
        appendFrame(frames.current, elapsed, poseRef.current);
        cursor.current = elapsed;
        durationRef.current = elapsed;
        setTime(elapsed);
        setDuration(elapsed);
        setMode("idle");
      } else setMode("paused");
    };
    request = requestAnimationFrame(tick);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      cancelAnimationFrame(request);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, [mode, speed]);

  const status = recording ? (cs ? "Nahrávám" : "Nahrávam")
    : playing ? (cs ? "Přehrávám" : "Prehrávam")
    : mode === "paused" ? (cs ? "Pozastaveno" : "Pozastavené")
    : hasRecording ? (cs ? "Záznam připraven" : "Záznam pripravený")
    : (cs ? "Připraveno k ovládání" : "Pripravené na ovládanie");
  const taskStep = !task ? 0 : task.phase === "placed" ? 3 : task.lifted ? 2 : task.attachment ? 1 : 0;
  const taskHint = !task ? "" : blocked
    ? (cs ? "Kostka by narazila do podložky. Nejprve ji zvedněte." : "Kocka by narazila do podložky. Najprv ju zdvihnite.")
    : task.phase === "placed" ? (cs ? "Hotovo. Kostka byla zvednutá, přenesená a položená do cíle." : "Hotovo. Kocka bola zdvihnutá, prenesená a položená do cieľa.")
    : task.phase === "falling" ? (cs ? "Kostka je uvolněná a dosedá na podložku." : "Kocka je uvoľnená a dosadá na podložku.")
    : task.phase === "missed" ? (cs ? "Kostka zůstala mimo cíl. Otevřete chapadlo, přibližte se a uchopte ji znovu." : "Kocka ostala mimo cieľa. Otvorte chápadlo, priblížte sa a uchopte ju znova.")
    : task.attachment ? task.lifted
      ? (cs ? "Přeneste kostku nad zelený cíl, spusťte ji nízko a otevřete chapadlo." : "Preneste kocku nad zelený cieľ, spustite ju nízko a otvorte chápadlo.")
      : (cs ? "Kostka drží v chapadle. Nyní ji zvedněte nad podložku." : "Kocka drží v chápadle. Teraz ju zdvihnite nad podložku.")
    : cubeGripDistance(pose, task) < 8 ? (cs ? "Jste u kostky. Nasměrujte chapadlo dolů a pomalu ho zavřete." : "Ste pri kocke. Nasmerujte chápadlo nadol a pomaly ho zatvorte.")
    : (cs ? "Otevřete chapadlo a přibližte je shora ke kostce. Pomůže pohled z boku nebo shora." : "Otvorte chápadlo a priblížte ho zhora ku kocke. Pomôže pohľad z boku alebo zhora.");

  return <div className="bl-study">
    <div className="bl-study-top"><span>{cs ? "Vyzkoušejte moji ruku" : "Vyskúšajte moju ruku"}</span><span>{cs ? "Simulace v prohlížeči" : "Simulácia v prehliadači"}</span></div>
    <div className="bl-study-workspace">
    <div className="bl-study-preview">
      <ArmModel pose={pose} view={view} cs={cs} task={task} />
      <div className="bl-study-views" role="group" aria-label={cs ? "Pohled na model" : "Pohľad na model"}>
        {(["perspective", "side", "top"] as const).map((item, index) => <button key={item} type="button" aria-pressed={view === item} onClick={() => setView(item)}>{(cs ? ["Prostorový", "Z boku", "Shora"] : ["Priestorový", "Z boku", "Zhora"])[index]}</button>)}
      </div>
    </div>
    <div className="bl-study-panel" role="region" aria-label={cs ? "Ovládání ruky a záznam pohybu" : "Ovládanie ruky a záznam pohybu"} tabIndex={0}>
    <div className="bl-arm-task">
      <div className="bl-arm-task-heading"><h4>{cs ? "Uchop a přenes kostku" : "Uchop a prenes kocku"}</h4><span>{cs ? "Vyzkoušejte koordinaci os" : "Vyskúšajte koordináciu osí"}</span></div>
      <div className="bl-arm-task-actions">
        {!task && <button type="button" disabled={recording || playing} onClick={resetTask}>{cs ? "Zkusit výzvu" : "Skúsiť výzvu"}</button>}
        <button type="button" disabled={recording || playing} onClick={playExample}>{example === "playing" ? "Pauza" : example === "paused" ? reducedExample ? (cs ? "Další krok ukázky" : "Ďalší krok ukážky") : (cs ? "Pokračovat v ukázce" : "Pokračovať v ukážke") : (cs ? "Ukázat příklad" : "Ukázať príklad")}</button>
        {task && <><button type="button" onClick={resetTask}>{cs ? "Zkusit od začátku" : "Skúsiť od začiatku"}</button><button type="button" onClick={() => { setExample("idle"); taskRef.current = null; setTask(null); setBlocked(false); }}>{cs ? "Vlastní pohyb" : "Vlastný pohyb"}</button></>}
      </div>
    </div>
    {task && <div className="bl-arm-task-progress">
      <ol aria-label={cs ? "Postup úlohy" : "Postup úlohy"}>{(cs ? ["Uchopit", "Zvednout", "Položit do cíle"] : ["Uchopiť", "Zdvihnúť", "Položiť do cieľa"]).map((label, index) => <li key={label} className={taskStep > index ? "is-done" : taskStep === index ? "is-current" : ""}><span aria-hidden="true">{taskStep > index ? "✓" : index + 1}</span>{label}</li>)}</ol>
      <p role="status">{taskHint}</p>
    </div>}
    <fieldset className="bl-study-controls" disabled={playing || example === "playing"}>
      <legend className="bl-sr-only">{cs ? "Ovládání šesti os" : "Ovládanie šiestich osí"}</legend>
      {JOINTS.map((joint, index) => <label key={joint.sk} htmlFor={uid + "-joint-" + index}>
        <span><small aria-hidden="true">{String(index + 1).padStart(2, "0")}</small>{cs ? joint.cs : joint.sk}</span>
        <output htmlFor={uid + "-joint-" + index}>{Math.round(pose[index])}{joint.unit}</output>
        <input id={uid + "-joint-" + index} type="range" min={joint.min} max={joint.max} step="1" value={pose[index]}
          aria-valuetext={Math.round(pose[index]) + joint.unit}
          onChange={event => { const next: ArmPose = [...poseRef.current]; next[index] = +event.target.value; manualPose(next, event.timeStamp); }} />
      </label>)}
    </fieldset>
    {!task && <div className="bl-study-presets" role="group" aria-label={cs ? "Výchozí polohy" : "Východiskové polohy"}>
      <button type="button" disabled={playing} onClick={() => moveToPreset(HOME_POSE)}>{cs ? "Výchozí poloha" : "Východisková poloha"}</button>
      <button type="button" disabled={playing} onClick={() => moveToPreset(PARK_POSE)}>{cs ? "Složit ruku" : "Zložiť ruku"}</button>
    </div>}
    {!task && <div className="bl-study-recorder">
      <div className="bl-study-record-heading"><h4>{cs ? "Vlastní pohyb" : "Vlastný pohyb"}</h4><span role="status" className={recording ? "is-recording" : ""}>{recording && <i aria-hidden="true" />}{status}</span></div>
      <div className="bl-study-transport">
        <button type="button" className="bl-record-button" onClick={event => record(event.timeStamp)} disabled={playing || recording}><span aria-hidden="true">●</span>{hasRecording ? "Nový záznam" : (cs ? "Nahrát pohyb" : "Nahrať pohyb")}</button>
        <button type="button" onClick={event => playing ? setMode("paused") : play(event.timeStamp)} disabled={!hasRecording || recording}>
          <span aria-hidden="true">{playing ? "Ⅱ" : "▶"}</span>{playing ? "Pauza" : mode === "paused" && time < duration ? (cs ? "Pokračovat" : "Pokračovať") : (cs ? "Přehrát" : "Prehrať")}
        </button>
        <button type="button" className="bl-stop-button" onClick={event => stop(event.timeStamp)} disabled={mode === "idle"}><span aria-hidden="true">■</span>Stop</button>
      </div>
      <label className="bl-study-timeline" htmlFor={uid + "-timeline"}>
        <span>{cs ? "Časová osa" : "Časová os"}</span><output htmlFor={uid + "-timeline"}>{formatTime(time)} / {formatTime(recording ? MAX_RECORDING_MS : duration)}</output>
        <input id={uid + "-timeline"} type="range" min="0" max={duration || 1} step="any" value={Math.min(time, duration)} disabled={!hasRecording || recording} onChange={event => seek(+event.target.value)} aria-valuetext={formatTime(time) + " / " + formatTime(duration)} />
      </label>
      <div className="bl-study-record-options">
        <label htmlFor={uid + "-speed"}>{cs ? "Rychlost přehrávání" : "Rýchlosť prehrávania"}<select id={uid + "-speed"} value={speed} disabled={recording || playing} onChange={event => setSpeed(+event.target.value)}><option value="0.5">0,5×</option><option value="1">1×</option><option value="1.5">1,5×</option><option value="2">2×</option></select></label>
        <button type="button" disabled={!hasRecording || recording || playing} onClick={() => { frames.current = []; cursor.current = 0; durationRef.current = 0; setTime(0); setDuration(0); setMode("idle"); }}>{cs ? "Vymazat záznam" : "Vymazať záznam"}</button>
      </div>
      <p className="bl-study-hint">{cs ? "Spusťte nahrávání, pohybujte osami a stiskněte Stop. Přehraje se i vaše tempo a přestávky. Záznam do 60 sekund zůstává do obnovení stránky." : "Spustite nahrávanie, pohybujte osami a stlačte Stop. Prehrá sa aj vaše tempo a prestávky. Záznam do 60 sekúnd zostáva do obnovenia stránky."}</p>
    </div>}
    </div>
    </div>
  </div>;
}

