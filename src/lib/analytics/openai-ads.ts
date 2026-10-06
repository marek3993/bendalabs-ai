"use client";

// Pixel setup: https://developers.openai.com/ads/measurement-pixel
// Keep empty until a real pixel has been created in this advertiser's account.
export const openAiAdsPixelId = process.env.NEXT_PUBLIC_OPENAI_ADS_PIXEL_ID?.trim();
type PixelQueue = ((...args: unknown[]) => void) & { q?: unknown[][] };
declare global { interface Window { oaiq?: PixelQueue } }
let initialized = false;
let consented = false;
const sentEvents = new Set<string>();

export function setOpenAiAdsConsent(granted: boolean) {
  if (!openAiAdsPixelId || typeof window === "undefined") return;
  consented = granted;
  if (!initialized && granted) {
    if (!window.oaiq) {
      const queue: PixelQueue = (...args: unknown[]) => { queue.q?.push(args); };
      queue.q = [];
      window.oaiq = queue;
      const script = document.createElement("script");
      script.async = true;
      script.src = "https://bzrcdn.openai.com/sdk/oaiq.min.js";
      document.head.appendChild(script);
    }
    window.oaiq("consent", false);
    window.oaiq("init", { pixelId: openAiAdsPixelId });
    initialized = true;
  }
  if (initialized) window.oaiq?.("consent", granted);
}

export function measureAutomationLead(eventId: unknown) {
  if (!consented || !initialized || typeof eventId !== "string" || !eventId || sentEvents.has(eventId)) return;
  // The API returns this id only for a persisted request, never for spam or errors.
  // A lead is not a paid order: no invented purchase value or personal data.
  try {
    window.oaiq?.("measure", "lead_created", { type: "customer_action" }, { event_id: eventId });
    sentEvents.add(eventId);
  } catch { /* Measurement must never prevent a successful form submission. */ }
}
