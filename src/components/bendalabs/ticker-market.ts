export const MARKET_URL = "wss://ws-feed.exchange.coinbase.com";
export const PRODUCTS = ["BTC-EUR", "BTC-USD", "ETH-EUR", "ETH-USD", "SOL-EUR", "SOL-USD"] as const;
export type Quote = { product: string; price: number; change: number; volume: number; time: number; sequence: number };
export type MarketState = { product: string; status: "connecting" | "live" | "offline" | "paused"; quote: Quote | null };

export function parseQuote(input: unknown, product: string, now = Date.now()): Quote | null {
  if (!input || typeof input !== "object" || !PRODUCTS.some(p => p === product)) return null;
  const d = input as Record<string, unknown>;
  if (d.type !== "ticker" || d.product_id !== product) return null;
  const number = (value: unknown) => typeof value === "string" && value.trim() ? Number(value) : NaN;
  const price = number(d.price), open = number(d.open_24h), volume = number(d.volume_24h);
  const time = typeof d.time === "string" ? Date.parse(d.time) : NaN;
  if (![price,open,volume,time].every(Number.isFinite) || price <= 0 || open <= 0 || volume < 0 || time > now + 60000 || time < now - 86400000 || !Number.isSafeInteger(d.sequence)) return null;
  const change = (price / open - 1) * 100;
  if (!Number.isFinite(change)) return null;
  return { product, price, change, volume, time, sequence: d.sequence as number };
}

// Public market data only. Never retain a price as live after the feed disconnects.
export function subscribeMarket(product: string, notify: (state: MarketState) => void) {
  let socket: WebSocket | null = null, stopped = false, attempts = 0;
  let retry: ReturnType<typeof setTimeout> | undefined;
  let lastReceive = 0, latest: Quote | null = null, dirty = false;
  const emit = (status: MarketState["status"]) => notify({product,status,quote:status === "live" ? latest : null});
  const disconnect = () => {
    clearTimeout(retry);
    const old = socket; socket = null;
    if (old) { old.onclose = null; old.onerror = null; old.onmessage = null; old.onopen = null; old.close(); }
    latest = null; dirty = false;
  };
  const fail = () => {
    disconnect(); emit("offline");
    if (!stopped && !document.hidden) retry = setTimeout(connect, Math.min(30000,1000 * 2 ** Math.min(attempts++,5)));
  };
  function connect() {
    disconnect();
    if (stopped) return;
    if (document.hidden) { emit("paused"); return; }
    emit("connecting"); lastReceive = Date.now();
    try {
      const ws = new WebSocket(MARKET_URL); socket = ws;
      ws.onopen = () => ws.send(JSON.stringify({type:"subscribe",product_ids:[product],channels:["ticker","heartbeat"]}));
      ws.onmessage = event => {
        if (socket !== ws) return;
        let data;
        try { data = JSON.parse(event.data); } catch { return; }
        if (data?.type === "error") { fail(); return; }
        const now = Date.now(), quote = parseQuote(data,product,now);
        if (quote && (!latest || quote.sequence > latest.sequence)) {
          lastReceive = now; attempts = 0;
          const first = !latest; latest = quote; dirty = !first;
          if (first) emit("live");
        } else if (data?.type === "heartbeat" && data.product_id === product && typeof data.time === "string" && Math.abs(now-Date.parse(data.time)) < 60000) lastReceive = now;
      };
      ws.onclose = fail; ws.onerror = fail;
    } catch { fail(); }
  }
  const timer = setInterval(() => {
    if (socket && Date.now()-lastReceive > 15000) { fail(); return; }
    if (dirty) { dirty = false; emit("live"); }
  },1000);
  const visibility = () => { if (document.hidden) { disconnect(); emit("paused"); } else connect(); };
  const online = () => connect();
  const offline = () => { disconnect(); emit("offline"); };
  document.addEventListener("visibilitychange",visibility);
  window.addEventListener("online",online); window.addEventListener("offline",offline);
  connect();
  return () => {
    stopped = true; disconnect(); clearInterval(timer);
    document.removeEventListener("visibilitychange",visibility);
    window.removeEventListener("online",online); window.removeEventListener("offline",offline);
  };
}
