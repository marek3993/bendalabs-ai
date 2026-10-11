import { isFresh } from "./model";

// Only public demand portals are fetched; no private-network or arbitrary URLs.
export const SOURCE_HOSTS = ["community.n8n.io", "www.upwork.com", "www.freelancer.com", "www.peopleperhour.com", "www.webtrh.cz", "webtrh.cz", "www.epoptavka.cz", "www.aaadopyt.sk", "www.dopyt.sk"];
export function canonicalSourceUrl(value: string) {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password || url.port
      || !SOURCE_HOSTS.includes(url.hostname)) return null;
    if (url.hostname === "community.n8n.io" && !/^\/t\/[^/]+\/\d+\/?$/.test(url.pathname)) return null;
    if (url.hostname === "www.upwork.com" && !url.pathname.startsWith("/freelance-jobs/apply/")) return null;
    url.hash = ""; url.search = "";
    url.pathname = url.pathname.replace(/\/$/, "");
    return url.toString();
  } catch { return null; }
}
export function visibleText(html: string) {
  return html.replace(/<(script|style|noscript|svg)[^>]*>[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]+>/g, " ").replace(/&nbsp;|&#160;/g, " ")
    .replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/\u0000/g, "")
    .replace(/\s+/g, " ").trim();
}
async function fetchPublic(url: string): Promise<string> {
  let current = new URL(url);
  const timeout = AbortSignal.timeout(10_000);
  for (let i = 0; i < 4; i++) {
    if (current.protocol !== "https:" || current.port || current.username || current.password || !SOURCE_HOSTS.includes(current.hostname)) throw new Error("Nepovolený zdroj.");
    const response = await fetch(current, { cache: "no-store", redirect: "manual", signal: timeout, headers: { "user-agent": "BendaLabsLeadPilot/1.0 (+https://bendalabs.sk)" } });
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get("location");
      if (!location) throw new Error("Neplatné presmerovanie.");
      await response.body?.cancel();
      current = new URL(location, current); continue;
    }
    if (!response.ok) { await response.body?.cancel(); throw new Error(`Zdroj nedostupný (${response.status}).`); }
    const reader = response.body?.getReader();
    if (!reader) throw new Error("Prázdny zdroj.");
    let size = 0; let text = "";
    const decoder = new TextDecoder();
    try {
      while (true) {
        const part = await reader.read(); if (part.done) break;
        size += part.value.byteLength;
        if (size > 600_000) throw new Error("Zdroj je príliš veľký.");
        text += decoder.decode(part.value, { stream: true });
      }
      return text + decoder.decode();
    } finally { await reader.cancel(); }
  }
  throw new Error("Príliš veľa presmerovaní.");
}
export type SourcePage = { url: string; text: string; publishedAt: string | null; publicationEvidence: string | null; closed: boolean };
export async function fetchDemandPage(rawUrl: string): Promise<SourcePage> {
  const url = canonicalSourceUrl(rawUrl);
  if (!url) throw new Error("Nepovolená adresa zadania.");
  if (new URL(url).hostname === "community.n8n.io") {
    const topic = JSON.parse(await fetchPublic(`${url}.json`));
    const first = topic.post_stream?.posts?.find((post: { post_number: number }) => post.post_number === 1);
    if (!first?.cooked || !first.created_at || topic.category_id !== 13) throw new Error("Chýba pôvodné zadanie v sekcii Jobs.");
    return { url, text: `${topic.title}\n${visibleText(first.cooked)}`.slice(0, 18_000), publishedAt: first.created_at, publicationEvidence: `Pôvodný príspevok #1 · ${first.created_at}`, closed: Boolean(topic.closed || topic.archived) };
  }
  const html = await fetchPublic(url);
  const text = visibleText(html);
  if (text.length < 150 || /verify you are human|attention required|captcha|access denied/i.test(text.slice(0, 1000))) throw new Error("Zdroj blokuje načítanie zadania.");
  const date = html.match(/"datePosted"\s*:\s*"([^"<]+)"/)?.[1]
    ?? html.match(/"datePublished"\s*:\s*"([^"<]+)"/)?.[1];
  const posted = new URL(url).hostname === "www.upwork.com" ? text.match(/Posted\s+(today|yesterday|\d+\s+(?:hours?|days?|weeks?)\s+ago)/i)?.[0] : undefined;
  let publishedAt: string | null = date && Number.isFinite(Date.parse(date)) ? new Date(date).toISOString() : null;
  if (!publishedAt && posted) {
    const amount = Number(posted.match(/\d+/)?.[0] ?? 0);
    const days = /yesterday/i.test(posted) ? 1 : /weeks?/i.test(posted) ? amount * 7 : /days?/i.test(posted) ? amount : 0;
    const hours = /hours?/i.test(posted) ? amount : days * 24;
    publishedAt = new Date(Date.now() - hours * 3_600_000).toISOString();
  }
  return { url, text: text.slice(0, 18_000), publishedAt, publicationEvidence: date ?? posted ?? null, closed: /job is no longer available|job has been closed|project has been awarded/i.test(text) };
}
export async function communityCandidates(): Promise<string[]> {
  const body = JSON.parse(await fetchPublic("https://community.n8n.io/c/jobs/13.json?order=created"));
  return (body.topic_list?.topics ?? [])
    .filter((topic: { title: string; created_at: string; closed: boolean; archived: boolean }) => isFresh(topic.created_at) && !topic.closed && !topic.archived && !/for hire|available for|offering|my services/i.test(topic.title))
    .slice(0, 12).map((topic: { slug: string; id: number }) => `https://community.n8n.io/t/${topic.slug}/${topic.id}`);
}
