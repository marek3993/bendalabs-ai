export function getNormalizedDomainFromUrl(inputUrl: string) {
  try {
    return new URL(inputUrl).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return null;
  }
}
