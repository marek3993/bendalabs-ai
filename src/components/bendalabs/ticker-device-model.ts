import type { Quote } from "./ticker-market";
export type TickerButton = "next" | "mode" | "currency";
export type TickerCurrency = "EUR" | "USD";
export type TickerState = { coin: number; view: number; currency: TickerCurrency; night: boolean; auto: boolean; greeting: boolean; greetingId: number };
export type TickerAction = { type: "press"; button: TickerButton; long: boolean } | { type: "greetingEnd" } | { type: "rotate" };
export const LONG_PRESS_MS = 1500;
export const COIN_INTERVAL_MS = 6500;
export const GREETING_MS = 5000;
export const initialTicker: TickerState = { coin: 0, view: 0, currency: "EUR", night: false, auto: false, greeting: false, greetingId: 0 };
export const COINS = ["BTC", "ETH", "SOL"] as const;

export function tickerReducer(state: TickerState, action: TickerAction): TickerState {
  if (action.type === "greetingEnd") return { ...state, greeting: false };
  if (action.type === "rotate") return state.auto && !state.greeting ? { ...state, coin: (state.coin + 1) % COINS.length } : state;
  if (action.button === "next") return action.long ? { ...state, greeting: true, greetingId: state.greetingId + 1 } : { ...state, coin: (state.coin + 1) % COINS.length };
  if (action.button === "mode") return action.long ? { ...state, night: !state.night } : { ...state, view: (state.view + 1) % 3 };
  return action.long ? { ...state, auto: !state.auto } : { ...state, currency: state.currency === "EUR" ? "USD" : "EUR" };
}

type HeldPress = { button: TickerButton; source: "pointer" | "keyboard"; identity: string; start: number };
export class TickerPressSession {
  private current: HeldPress | null = null;
  private suppressed: { button: TickerButton; until: number } | null = null;
  get held() { return this.current; }
  begin(button: TickerButton, source: HeldPress["source"], identity: string, now: number) {
    if (this.current) return false;
    this.current = { button, source, identity, start: now };
    return true;
  }
  release(button: TickerButton, source: HeldPress["source"], identity: string, now: number): TickerAction | null {
    const press = this.current;
    if (!press || press.button !== button || press.source !== source || press.identity !== identity) return null;
    this.current = null;
    this.suppressed = { button, until: now + 700 };
    return { type: "press", button, long: now - press.start >= LONG_PRESS_MS };
  }
  cancel(now: number) {
    if (this.current) this.suppressed = { button: this.current.button, until: now + 700 };
    this.current = null;
  }
  click(button: TickerButton, detail: number, now: number): TickerAction | null {
    if (this.suppressed?.button === button && now <= this.suppressed.until) {
      this.suppressed = null;
      return null;
    }
    if (detail > 0 || this.current) return null;
    return { type: "press", button, long: false };
  }
}

export function tickerMessage(state: TickerState, cs: boolean, quote: Quote | null = null, status = "connecting", en = false) {
  if (state.greeting) return { matrix: en ? "MERRY CHRISTMAS!" : cs ? "VESELE VANOCE!" : "VESELE VIANOCE!", title: en ? "Holiday greeting" : cs ? "Sváteční pozdrav" : "Sviatočný pozdrav", value: en ? "Merry Christmas!" : cs ? "Veselé Vánoce!" : "Veselé Vianoce!" };
  const coin = COINS[state.coin], unit = state.currency === "EUR" ? "€" : "$";
  if (!quote || quote.product !== coin + "-" + state.currency) return {
    matrix: status === "connecting" ? (en ? "CONNECTING..." : "PRIPAJAM...") : (en ? "DATA UNAVAILABLE" : "DATA NEDOSTUPNE"),
    title: coin + " · " + state.currency,
    value: status === "connecting" ? (en ? "Connecting…" : cs ? "Připojuji…" : "Pripájam…") : (en ? "Data unavailable" : cs ? "Data nejsou dostupná" : "Dáta nie sú dostupné"),
  };
  const format = (n: number, digits = 2) => new Intl.NumberFormat(en ? "en-GB" : cs ? "cs-CZ" : "sk-SK", {maximumFractionDigits:digits,minimumFractionDigits:digits}).format(n);
  if (state.view === 1) {
    const sign = quote.change > 0 ? "+" : "";
    return {matrix:coin + " 24H " + sign + quote.change.toFixed(2) + "%",title:coin + " · " + (en ? "24-hour change" : cs ? "Změna za 24 hodin" : "Zmena za 24 hodín"),value:sign + format(quote.change) + " %"};
  }
  if (state.view === 2) return {matrix:coin + " VOL " + quote.volume.toFixed(2),title:coin + " · " + (en ? "24-hour volume" : cs ? "Objem za 24 hodin" : "Objem za 24 hodín"),value:format(quote.volume) + " " + coin};
  return {matrix:coin + " " + unit + quote.price.toFixed(2),title:coin + (en ? " · Price" : " · Cena"),value:format(quote.price) + " " + unit};
}

const glyphs: Record<string, string[]> = {
  " ": ["00000", "00000", "00000", "00000", "00000", "00000", "00000"],
  A: ["01110", "10001", "10001", "11111", "10001", "10001", "10001"], B: ["11110", "10001", "10001", "11110", "10001", "10001", "11110"],
  C: ["01111", "10000", "10000", "10000", "10000", "10000", "01111"], D: ["11110", "10001", "10001", "10001", "10001", "10001", "11110"],
  E: ["11111", "10000", "10000", "11110", "10000", "10000", "11111"], F: ["11111", "10000", "10000", "11110", "10000", "10000", "10000"],
  G: ["01111", "10000", "10000", "10111", "10001", "10001", "01111"], H: ["10001", "10001", "10001", "11111", "10001", "10001", "10001"],
  I: ["11111", "00100", "00100", "00100", "00100", "00100", "11111"], J: ["00111", "00010", "00010", "00010", "10010", "10010", "01100"],
  K: ["10001", "10010", "10100", "11000", "10100", "10010", "10001"], L: ["10000", "10000", "10000", "10000", "10000", "10000", "11111"],
  M: ["10001", "11011", "10101", "10101", "10001", "10001", "10001"], N: ["10001", "11001", "11001", "10101", "10011", "10011", "10001"],
  O: ["01110", "10001", "10001", "10001", "10001", "10001", "01110"], P: ["11110", "10001", "10001", "11110", "10000", "10000", "10000"],
  Q: ["01110", "10001", "10001", "10001", "10101", "10010", "01101"], R: ["11110", "10001", "10001", "11110", "10100", "10010", "10001"],
  S: ["01111", "10000", "10000", "01110", "00001", "00001", "11110"], T: ["11111", "00100", "00100", "00100", "00100", "00100", "00100"],
  U: ["10001", "10001", "10001", "10001", "10001", "10001", "01110"], V: ["10001", "10001", "10001", "10001", "10001", "01010", "00100"],
  W: ["10001", "10001", "10001", "10101", "10101", "11011", "10001"], X: ["10001", "10001", "01010", "00100", "01010", "10001", "10001"],
  Y: ["10001", "10001", "01010", "00100", "00100", "00100", "00100"], Z: ["11111", "00001", "00010", "00100", "01000", "10000", "11111"],
  "0": ["01110", "10001", "10011", "10101", "11001", "10001", "01110"], "1": ["00100", "01100", "00100", "00100", "00100", "00100", "01110"],
  "2": ["01110", "10001", "00001", "00010", "00100", "01000", "11111"], "3": ["11110", "00001", "00001", "01110", "00001", "00001", "11110"],
  "4": ["00010", "00110", "01010", "10010", "11111", "00010", "00010"], "5": ["11111", "10000", "10000", "11110", "00001", "00001", "11110"],
  "6": ["01110", "10000", "10000", "11110", "10001", "10001", "01110"], "7": ["11111", "00001", "00010", "00100", "01000", "01000", "01000"],
  "8": ["01110", "10001", "10001", "01110", "10001", "10001", "01110"], "9": ["01110", "10001", "10001", "01111", "00001", "00001", "01110"],
  ".": ["00000", "00000", "00000", "00000", "00000", "00110", "00110"], ",": ["00000", "00000", "00000", "00000", "00110", "00110", "00100"],
  "%": ["11001", "11010", "00010", "00100", "01000", "01011", "10011"], "+": ["00000", "00100", "00100", "11111", "00100", "00100", "00000"],
  "-": ["00000", "00000", "00000", "11111", "00000", "00000", "00000"], "!": ["00100", "00100", "00100", "00100", "00100", "00000", "00100"],
  "^": ["00100", "01110", "10101", "00100", "00100", "00100", "00000"], "v": ["00000", "00100", "00100", "00100", "10101", "01110", "00100"],
  "$": ["00100", "01111", "10100", "01110", "00101", "11110", "00100"], "€": ["00111", "01000", "11110", "01000", "11110", "01000", "00111"],
  "?": ["01110", "10001", "00001", "00010", "00100", "00000", "00100"],
};

export function messageColumns(text: string) {
  const columns: number[] = [];
  const ascii = text.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  for (const character of ascii) {
    const rows = glyphs[character] ?? glyphs[character.toUpperCase()] ?? glyphs["?"];
    for (let column = 0; column < 5; column++) {
      let bits = 0;
      for (let row = 0; row < 7; row++) if (rows[row][column] === "1") bits |= 1 << row;
      columns.push(bits);
    }
    columns.push(0);
  }
  return columns;
}

export function matrixBits(columns: readonly number[], offset: number) {
  const cycle = Math.max(64, columns.length + 16);
  return Array.from({ length: 64 }, (_, column) => columns[((offset + column) % cycle + cycle) % cycle] ?? 0);
}
