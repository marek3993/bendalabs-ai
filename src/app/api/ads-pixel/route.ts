export function GET() {
  const pixelId = process.env.NEXT_PUBLIC_OPENAI_ADS_PIXEL_ID?.trim();
  if (!pixelId) return new Response(null, { status: 404 });
  const safePixelId = JSON.stringify(pixelId).replace(/</g, "\\u003c");
  return new Response(`<!doctype html><html><head><meta charset="utf-8"><title>Meranie reklamy</title></head><body><script>
  (() => {
    let granted = false;
    const sent = new Set();
    const q = function() { q.q.push(arguments); };
    q.q = [];
    window.oaiq = q;
    oaiq("consent", false);
    oaiq("init", { pixelId: ${safePixelId} });
    window.addEventListener("message", event => {
      if (event.source !== parent || event.origin !== location.origin) return;
      const data = event.data;
      if (data?.kind === "consent") {
        granted = data.granted === true;
        oaiq("consent", granted);
      } else if (data?.kind === "lead" && granted && typeof data.eventId === "string" && data.eventId && !sent.has(data.eventId)) {
        sent.add(data.eventId);
        oaiq("measure", "lead_created", { type: "customer_action" }, { event_id: data.eventId });
      }
    });
    const sdk = document.createElement("script");
    sdk.async = true;
    sdk.src = "https://bzrcdn.openai.com/sdk/oaiq.min.js";
    document.head.appendChild(sdk);
    parent.postMessage({ kind: "pixel-ready" }, location.origin);
  })();
  </script></body></html>`, {
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", "X-Frame-Options": "SAMEORIGIN", "Referrer-Policy": "origin" },
  });
}
