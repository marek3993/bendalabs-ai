declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

function getGoogleAdsConversionSendTo() {
  return document.body.dataset.googleAdsConversionSendTo?.trim() || "";
}

export function trackGoogleAdsConversion() {
  if (typeof window === "undefined") {
    return false;
  }

  const sendTo = getGoogleAdsConversionSendTo();

  if (!sendTo || typeof window.gtag !== "function") {
    return false;
  }

  window.gtag("event", "conversion", {
    send_to: sendTo,
  });

  return true;
}
