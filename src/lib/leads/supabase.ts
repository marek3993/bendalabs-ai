const SUPABASE_REST_PREFIX = "/rest/v1/";

function getSupabaseConfig() {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    return null;
  }

  return {
    url,
    serviceRoleKey,
  };
}

export function isLeadStorageConfigured() {
  return getSupabaseConfig() !== null;
}

function buildRestUrl(path: string, searchParams?: URLSearchParams) {
  const config = getSupabaseConfig();

  if (!config) {
    throw new Error(
      "Lead tracking nie je nakonfigurovany. Doplň SUPABASE_URL a SUPABASE_SERVICE_ROLE_KEY.",
    );
  }

  const normalizedBase = config.url.endsWith("/") ? config.url : `${config.url}/`;
  const url = new URL(path, `${normalizedBase}${SUPABASE_REST_PREFIX}`);

  if (searchParams) {
    url.search = searchParams.toString();
  }

  return {
    url: url.toString(),
    serviceRoleKey: config.serviceRoleKey,
  };
}

export async function supabaseRestFetch(
  path: string,
  init: RequestInit & { searchParams?: URLSearchParams } = {},
) {
  const { searchParams, headers, ...requestInit } = init;
  const { url, serviceRoleKey } = buildRestUrl(path, searchParams);

  const response = await fetch(url, {
    ...requestInit,
    cache: "no-store",
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
      ...headers,
    },
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Supabase request zlyhal (${response.status}): ${details}`);
  }

  return response;
}

export function parseCountHeader(contentRange: string | null) {
  if (!contentRange) {
    return 0;
  }

  const total = contentRange.split("/")[1];
  const parsed = Number(total);
  return Number.isFinite(parsed) ? parsed : 0;
}
