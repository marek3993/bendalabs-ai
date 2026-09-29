"use client";

import { useCallback, useEffect, useId, useMemo, useReducer, useRef, useState, useSyncExternalStore, type KeyboardEvent, type PointerEvent } from "react";
import { COIN_INTERVAL_MS, GREETING_MS, LONG_PRESS_MS, TickerPressSession, initialTicker, matrixBits, messageColumns, tickerMessage, tickerReducer, type TickerButton } from "./ticker-device-model";
import "../../app/ticker-device.css";
import { subscribeMarket, type MarketState } from "./ticker-market";
import { COINS } from "./ticker-device-model";

function motionSubscribe(notify: () => void) { const query = window.matchMedia("(prefers-reduced-motion: reduce)"); query.addEventListener("change", notify); return () => query.removeEventListener("change", notify); }
function activitySubscribe(notify: () => void) {
  document.addEventListener("visibilitychange", notify); window.addEventListener("focus", notify); window.addEventListener("blur", notify);
  return () => { document.removeEventListener("visibilitychange", notify); window.removeEventListener("focus", notify); window.removeEventListener("blur", notify); };
}
const activitySnapshot = () => !document.hidden && document.hasFocus();
const motionSnapshot = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const circlePath = (x: number, y: number) => `M${x - 3.15},${y}a3.15,3.15 0 1,0 6.3,0a3.15,3.15 0 1,0 -6.3,0`;
const backgroundDots = Array.from({ length: 512 }, (_, index) => circlePath((index % 64) * 10 + 5, Math.floor(index / 64) * 10 + 5)).join("");

function Matrix({ text, active, reduced }: { text: string; active: boolean; reduced: boolean }) {
  const columns = useMemo(() => messageColumns(text), [text]);
  const [offset, setOffset] = useState(0);
  const cursor = useRef(0);
  useEffect(() => {
    if (!active || reduced) return;
    let request = 0;
    let previous = -1;
    let carry = 0;
    const tick = (now: number) => {
      if (previous < 0) previous = now;
      carry += Math.min(now - previous, 100);
      previous = now;
      if (carry >= 45) {
        const advance = Math.floor(carry / 45);
        carry %= 45;
        cursor.current = (cursor.current + advance) % Math.max(64, columns.length + 16);
        setOffset(cursor.current);
      }
      request = requestAnimationFrame(tick);
    };
    request = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(request);
  }, [active, reduced, columns]);
  const lit = matrixBits(columns, offset).flatMap((bits, column) => Array.from({ length: 8 }, (_, row) => bits & (1 << row) ? circlePath(column * 10 + 5, row * 10 + 5) : "")).join("");
  return <svg className="td-matrix" viewBox="0 0 640 80" aria-hidden="true"><path d={backgroundDots} className="td-dots-off" /><path d={lit} className="td-dots-on" /></svg>;
}

export default function TickerDevice({ cs = false }: { cs?: boolean }) {
  const [state, dispatch] = useReducer(tickerReducer, initialTicker);
  const [pressed, setPressed] = useState<{ button: TickerButton; ready: boolean } | null>(null);
  const [hover, setHover] = useState(false);
  const reduced = useSyncExternalStore(motionSubscribe, motionSnapshot, () => false);
  const active = useSyncExternalStore(activitySubscribe, activitySnapshot, () => true);
  const session = useRef(new TickerPressSession());
  const longTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const uid = useId();
  const product = `${COINS[state.coin]}-${state.currency}`;
  const [market, setMarket] = useState<MarketState>({product,status:"connecting",quote:null});
  useEffect(() => subscribeMarket(product,setMarket),[product]);
  const quote = market.product === product && market.status === "live" ? market.quote : null;
  const status = market.product === product ? market.status : "connecting";
  const message = tickerMessage(state, cs, quote, status);
  const cancel = useCallback(() => {
    if (longTimer.current !== null) clearTimeout(longTimer.current);
    longTimer.current = null;
    session.current.cancel(performance.now());
    setPressed(null);
  }, []);

  useEffect(() => {
    const visibility = () => { if (document.hidden) cancel(); };
    window.addEventListener("blur", cancel); document.addEventListener("visibilitychange", visibility);
    const current = session.current;
    return () => {
      window.removeEventListener("blur", cancel); document.removeEventListener("visibilitychange", visibility);
      if (longTimer.current !== null) clearTimeout(longTimer.current);
      current.cancel(performance.now());
    };
  }, [cancel]);

  useEffect(() => {
    if (!active || !state.greeting) return;
    const timer = setTimeout(() => dispatch({ type: "greetingEnd" }), GREETING_MS);
    return () => clearTimeout(timer);
  }, [active, state.greeting, state.greetingId]);
  useEffect(() => {
    if (!active || !state.auto || state.greeting || reduced) return;
    const timer = setInterval(() => dispatch({ type: "rotate" }), COIN_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [active, state.auto, state.greeting, reduced]);

  function begin(button: TickerButton, source: "pointer" | "keyboard", identity: string, now: number) {
    if (!session.current.begin(button, source, identity, now)) return false;
    setPressed({ button, ready: false });
    const held = session.current.held;
    longTimer.current = setTimeout(() => {
      if (session.current.held === held) setPressed({ button, ready: true });
    }, LONG_PRESS_MS);
    return true;
  }
  function finish(button: TickerButton, source: "pointer" | "keyboard", identity: string, now: number) {
    const action = session.current.release(button, source, identity, now);
    if (!action) return;
    if (longTimer.current !== null) clearTimeout(longTimer.current);
    longTimer.current = null;
    setPressed(null);
    dispatch(action);
  }
  function pointerDown(button: TickerButton, event: PointerEvent<HTMLButtonElement>) {
    if (event.button !== 0 || !event.isPrimary || session.current.held) return;
    event.preventDefault();
    event.currentTarget.focus({ preventScroll: true });
    if (begin(button, "pointer", String(event.pointerId), event.timeStamp)) event.currentTarget.setPointerCapture(event.pointerId);
  }
  function pointerUp(button: TickerButton, event: PointerEvent<HTMLButtonElement>) {
    const held = session.current.held;
    if (held?.source !== "pointer" || held.identity !== String(event.pointerId)) return;
    const rect = event.currentTarget.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) cancel();
    else finish(button, "pointer", String(event.pointerId), event.timeStamp);
  }
  function keyDown(button: TickerButton, event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key !== " " && event.key !== "Enter") return;
    event.preventDefault();
    if (!event.repeat) begin(button, "keyboard", event.key, event.timeStamp);
  }
  function keyUp(button: TickerButton, event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key !== " " && event.key !== "Enter") return;
    event.preventDefault();
    finish(button, "keyboard", event.key, event.timeStamp);
  }
  const buttons: { key: TickerButton; label: string; short: string; long: string; icon: string }[] = [
    { key: "next", label: cs ? "MINCE" : "MINCA", short: cs ? "Další mince" : "Ďalšia minca", long: cs ? "Sváteční pozdrav" : "Sviatočný pozdrav", icon: "›" },
    { key: "mode", label: "ÚDAJ", short: "Cena / 24 h / objem", long: cs ? "Noční jas" : "Nočný jas", icon: "≡" },
    { key: "currency", label: "MENA", short: "EUR / USD", long: cs ? "Střídání mincí" : "Striedanie mincí", icon: "€/$" },
  ];
  const feedback = pressed ? pressed.ready ? `${cs ? "Uvolni" : "Uvoľni"}: ${buttons.find(button => button.key === pressed.button)?.long}.` : (cs ? "Pro druhou funkci podrž 1,5 sekundy a uvolni." : "Pre druhú funkciu podrž 1,5 sekundy a uvoľni.") : (cs ? "Krátký stisk změní údaj. Podržení odemkne druhou funkci." : "Krátke stlačenie zmení údaj. Podržanie odomkne druhú funkciu.");

  return <section className={`td-demo bl-demo-bounded${state.night ? " td-night" : ""}${reduced ? " td-reduced" : ""}`} aria-label={cs ? "Kryptoměnový ticker se třemi tlačítky" : "Kryptomenový ticker s tromi tlačidlami"}>
    <header className="td-heading"><p>{cs ? "Tři tlačítka. Celý přehled." : "Tri tlačidlá. Celý prehľad."}</p><span>{cs ? "Vyzkoušej i podržení" : "Vyskúšaj aj podržanie"}</span></header>
    <div className="bl-demo-workspace">
    <div className="bl-demo-preview">
    <div className="td-device-scene">
      <div className="td-enclosure">
        <div className="td-top-edge" aria-hidden="true" />
        <div className="td-brand-row"><span>BENDA LABS</span><span className="td-device-light" aria-hidden="true" /><span>{state.night ? (cs ? "NOČNÍ JAS" : "NOČNÝ JAS") : "64 × 8"}</span></div>
        <div className="td-screen-bezel" onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
          <div className="td-screen" role="img" aria-label={`${message.title}: ${message.value}`}>
            <Matrix text={message.matrix} active={active && !hover && !pressed} reduced={reduced} />
            {reduced && <div className="td-static-message" aria-hidden="true">{message.title}<strong>{message.value}</strong></div>}
          </div>
          <i className="td-screw td-screw-left" aria-hidden="true" /><i className="td-screw td-screw-right" aria-hidden="true" />
        </div>
        <div className="td-hardware-controls">{buttons.map(button => <div className="td-button-mount" key={button.key}>
          <button type="button" className={`td-button${pressed?.button === button.key ? " td-button-down" : ""}${pressed?.button === button.key && pressed.ready ? " td-button-ready" : ""}`} aria-label={button.short} aria-describedby={`${uid}-${button.key}`} onPointerDown={event => pointerDown(button.key, event)} onPointerUp={event => pointerUp(button.key, event)} onPointerCancel={cancel} onLostPointerCapture={() => { if (session.current.held?.source === "pointer" && session.current.held.button === button.key) cancel(); }} onKeyDown={event => keyDown(button.key, event)} onKeyUp={event => keyUp(button.key, event)} onBlur={() => { if (session.current.held?.button === button.key) cancel(); }} onClick={event => { const action = session.current.click(button.key, event.detail, performance.now()); if (action) dispatch(action); }} onContextMenu={event => event.preventDefault()}>
            <span className="td-button-icon" aria-hidden="true">{button.icon}</span><span className="td-hold-indicator" aria-hidden="true" />
          </button>
          <span className="td-button-engraving">{button.key === "currency" && cs ? "MĚNA" : button.label}</span>
        </div>)}</div>
        <div className="td-device-foot" aria-hidden="true"><i /><i /></div>
      </div>
    </div>
    <div className="td-reading" role="status"><span>{message.title}</span><strong>{message.value}</strong></div>
    <p className="td-feed-status" data-status={quote ? "live" : status}>
      <a href="https://exchange.coinbase.com/" target="_blank" rel="noreferrer">Coinbase Exchange</a>
      <span>{quote ? (cs ? "Živé ceny" : "Živé ceny") : status === "connecting" ? (cs ? "Připojuji…" : "Pripájam…") : status === "paused" ? (cs ? "Připojení pozastaveno" : "Pripojenie pozastavené") : (cs ? "Spojení přerušeno · obnovuji" : "Spojenie prerušené · obnovujem")}</span>
      {quote && <span>{cs ? "Poslední obchod" : "Posledný obchod"}: <time dateTime={new Date(quote.time).toISOString()}>{new Date(quote.time).toLocaleTimeString(cs ? "cs-CZ" : "sk-SK")}</time></span>}
    </p>
    <div className="td-current-mode"><span>{state.night ? (cs ? "Noční jas" : "Nočný jas") : (cs ? "Denní jas" : "Denný jas")}</span><span>{state.currency}</span><span>{state.auto ? (reduced ? (cs ? "Střídání pozastaveno" : "Striedanie pozastavené") : (cs ? "Mince se střídají" : "Mince sa striedajú")) : (cs ? "Ruční výběr mince" : "Ručný výber mincí")}</span></div>
    </div>
    <div className="bl-demo-panel" role="region" aria-label={cs ? "Funkce tlačítek tickeru" : "Funkcie tlačidiel tickera"} tabIndex={0}>
    <p className="td-feedback" role="status">{feedback}</p>
    <ol className="td-guide">{buttons.map((button, index) => <li key={button.key} id={`${uid}-${button.key}`}><span className="td-guide-number" aria-hidden="true">{index + 1}</span><strong>{button.short}</strong><span>{cs ? "Podrž" : "Podrž"} 1,5 s: {button.long.toLowerCase()}.</span></li>)}</ol>
    <p className="td-sample-note">{cs ? "Cena posledního obchodu na Coinbase v EUR nebo USD. Cena, změna a objem za 24 h se obnovují průběžně. Tlačítka fungují i klávesami Enter a mezerník." : "Cena posledného obchodu na Coinbase v EUR alebo USD. Cena, zmena a objem za 24 h sa obnovujú priebežne. Tlačidlá fungujú aj klávesmi Enter a medzerník."}</p>
    </div>
    </div>
  </section>;
}
