declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

const GOOGLE_ADS_SEND_TO = "AW-18119067266/HIg_CI-dsaIcEIKN7L9D";
const GOOGLE_ADS_CONVERSION_VALUE = 1.0;
const GOOGLE_ADS_CONVERSION_CURRENCY = "EUR";

export function trackGoogleAdsConversion() {
  if (typeof window === "undefined") {
    return false;
  }

  if (typeof window.gtag !== "function") {
    return false;
  }

  window.gtag("event", "conversion", {
    send_to: GOOGLE_ADS_SEND_TO,
    value: GOOGLE_ADS_CONVERSION_VALUE,
    currency: GOOGLE_ADS_CONVERSION_CURRENCY,
  });

  return true;
}
