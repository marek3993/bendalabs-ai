"use client";

export const openAiAdsPixelId = process.env.NEXT_PUBLIC_OPENAI_ADS_PIXEL_ID?.trim();
let consented = false;
let frame: HTMLIFrameElement | undefined;
let ready = false;
const pending: string[] = [];
const sentEvents = new Set<string>();

function send(message: object) {
  frame?.contentWindow?.postMessage(message, window.location.origin);
}

export function setOpenAiAdsConsent(granted: boolean) {
  if (!openAiAdsPixelId || typeof window === "undefined") return;
  consented = granted;
  if (!frame && granted) {
    // Keep automatic form matching away from customer input fields.
    frame = document.createElement("iframe");
    frame.hidden = true;
    frame.title = "Meranie účinnosti reklamy";
    const url = new URL("/api/ads-pixel", window.location.origin);
    const oppref = new URL(window.location.href).searchParams.get("oppref");
    if (oppref) url.searchParams.set("oppref", oppref);
    frame.src = url.href;
    window.addEventListener("message", event => {
      if (event.origin !== window.location.origin || event.source !== frame?.contentWindow || event.data?.kind !== "pixel-ready") return;
      ready = true;
      send({ kind: "consent", granted: consented });
      if (consented) for (const eventId of pending.splice(0)) send({ kind: "lead", eventId });
      else pending.length = 0;
    });
    document.body.appendChild(frame);
  }
  if (!granted) pending.length = 0;
  if (ready) send({ kind: "consent", granted });
}

export function measureAutomationLead(eventId: unknown) {
  if (!consented || !frame || typeof eventId !== "string" || !eventId || sentEvents.has(eventId)) return;
  try {
    sentEvents.add(eventId);
    if (ready) send({ kind: "lead", eventId });
    else pending.push(eventId);
  } catch { /* Measurement must never prevent a successful submission. */ }
}
