const HOSTNAME_LABEL_PATTERN = /^(?!-)[a-z0-9-]{1,63}(?<!-)$/i;
const IPV4_SEGMENT_PATTERN = /^(25[0-5]|2[0-4]\d|1?\d?\d)$/;

function isIpv4Address(hostname: string) {
  const parts = hostname.split(".");

  return parts.length === 4 && parts.every((part) => IPV4_SEGMENT_PATTERN.test(part));
}

function isDomainHostname(hostname: string) {
  if (!hostname.includes(".")) {
    return false;
  }

  return hostname.split(".").every((label) => HOSTNAME_LABEL_PATTERN.test(label));
}

function hasValidHostname(hostname: string) {
  return hostname === "localhost" || isIpv4Address(hostname) || isDomainHostname(hostname);
}

export function normalizeWebsiteUrl(rawValue: string) {
  const value = rawValue.trim();

  if (!value || /\s/.test(value)) {
    return null;
  }

  const candidate = value.startsWith("//")
    ? `https:${value}`
    : /^[a-z][a-z\d+.-]*:\/\//i.test(value)
      ? value
      : `https://${value}`;

  try {
    const parsed = new URL(candidate);

    if (!/^https?:$/.test(parsed.protocol)) {
      return null;
    }

    if (parsed.username || parsed.password || !hasValidHostname(parsed.hostname)) {
      return null;
    }

    parsed.hash = "";
    return parsed.toString();
  } catch {
    return null;
  }
}
