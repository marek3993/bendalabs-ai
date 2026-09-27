import assert from "node:assert/strict";
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";

function loadModule(path, env, seo) {
  const source = ts.transpileModule(readFileSync(path, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const exports = {};
  vm.runInNewContext(source, { exports, process: { env }, URL, require: () => seo });
  return exports;
}
const production = { NODE_ENV: "production" };
const seo = loadModule("src/lib/bendalabs/seo.ts", production);
assert.equal(seo.siteOrigin.href, "https://bendalabs.sk/");
assert.equal(seo.resolveSiteOrigin("https://canonical.example/").href, "https://canonical.example/");
for (const bad of ["", "not-a-url", "http://example.com", "https://user:pass@example.com", "https://example.com/path", "https://example.com/?q=1", "https://example.com/#hash"]) {
  assert.throws(() => seo.resolveSiteOrigin(bad), undefined, bad);
}
for (const VERCEL_ENV of ["preview", "development"]) {
  const env = { ...production, VERCEL_ENV, SITE_URL: "https://canonical.example" };
  const preview = loadModule("src/lib/bendalabs/seo.ts", env);
  assert.equal(preview.pageMetadata("/labs", "Labs", "Description").robots.index, false);
  assert.equal(preview.pageMetadata("/labs", "Labs", "Description").alternates.canonical, "https://canonical.example/labs");
  assert.equal(loadModule("src/app/sitemap.ts", env, preview).default().length, 0);
  assert.equal(loadModule("src/app/robots.ts", env, preview).default().rules.disallow, "/");
}
const privatePaths = ["/admin/leads", "/dakujem", "/odoslanie-zlyhalo", "/cs/dekujeme", "/cs/odeslani-selhalo"];
const pagePaths = readdirSync("src/app", { recursive: true }).filter(p => p.endsWith("page.tsx")).map(p => "/" + p.replace(/\/?page\.tsx$/, ""));
assert.deepEqual([...seo.publicPaths, ...privatePaths].sort(), pagePaths.sort(), "Every page must be classified");
const sitemap = loadModule("src/app/sitemap.ts", production, seo).default();
assert.equal(sitemap.length, 13);
assert.equal(new Set(sitemap.map(p => p.url)).size, 13);
assert.equal(seo.languageAlternates("/ai-navrh-na-mieru"), undefined);
console.log("PASS: origin validation, route coverage, preview protection, sitemap and language pairs");

const base = process.argv[2];
if (!base) process.exit(0);
const decode = s => s.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
function tags(html, tag) {
  return [...html.matchAll(new RegExp(`<${tag}\\b[^>]*>`, "g"))].map(([s]) => Object.fromEntries([...s.matchAll(/([\w:-]+)="([^"]*)"/g)].map(([,k,v]) => [k, decode(v)])));
}
for (const path of seo.publicPaths) {
  const res = await fetch(new URL(path + "?utm_source=chatgpt.com", base), { headers: { "user-agent": "OAI-SearchBot" } });
  assert.equal(res.status, 200, path);
  const html = await res.text();
  const head = html.split("</head>")[0];
  const meta = tags(head, "meta");
  const value = key => meta.find(m => m.name === key || m.property === key)?.content;
  const links = tags(head, "link");
  assert.equal(links.filter(l => l.rel === "canonical").length, 1, path);
  assert.equal(new URL(links.find(l => l.rel === "canonical").href).href, seo.absoluteUrl(path), path);
  const title = decode(head.match(/<title>(.*?)<\/title>/s)[1]);
  assert.equal(value("og:title"), title, path);
  assert.equal(value("twitter:title"), title, path);
  assert.equal(value("og:description"), value("description"), path);
  assert.equal(value("twitter:description"), value("description"), path);
  assert.equal(new URL(value("og:url")).href, seo.absoluteUrl(path), path);
  assert.equal(value("og:image"), seo.absoluteUrl("/share-image"), path);
  assert.equal(value("twitter:image"), seo.absoluteUrl("/share-image"), path);
  assert.equal(value("twitter:card"), "summary_large_image", path);
  assert.equal(value("og:locale"), path.startsWith("/cs") ? "cs_CZ" : "sk_SK", path);
  assert.equal(value("robots"), "index, follow", path);
  const expected = seo.languageAlternates(path) ?? {};
  assert.deepEqual(Object.fromEntries(links.filter(l => l.rel === "alternate" && l.hrefLang).map(l => [l.hrefLang, new URL(l.href).href])), { ...expected }, path);
  assert.ok(html.includes("AW-18119067266"), "Google Ads tag: " + path);
  if (path === "/" || path === "/cs") {
    const graph = JSON.parse(html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1]);
    assert.equal(graph["@graph"][1].name, "Marek Benda");
  }
}
for (const path of privatePaths) {
  const res = await fetch(new URL(path, base));
  assert.equal(res.status, 200, path);
  const html = await res.text();
  const robots = tags(html, "meta").find(m => m.name === "robots")?.content;
  assert.ok(robots?.includes("noindex"), path);
  assert.ok(!tags(html, "link").some(l => l.rel === "canonical"), path);
}
for (const path of ["/api/audit", "/admin/leads", "/admin/leads/login"]) {
  assert.equal((await fetch(new URL(path, base))).headers.get("x-robots-tag"), "noindex, nofollow", path);
}
for (const [path, target] of [["/ai", "/labs"], ["/studio", "/labs"], ["/cs/ai", "/cs/labs"], ["/cs/studio", "/cs/labs"]]) {
  const res = await fetch(new URL(path, base), { redirect: "manual" });
  assert.equal(res.status, 308, path);
  assert.equal(new URL(res.headers.get("location"), base).pathname, target);
}
const missing = await fetch(new URL("/nonexistent-seo-check", base));
assert.equal(missing.status, 404);
assert.ok((await missing.text()).includes('content="noindex"'));
const xml = await (await fetch(new URL("/sitemap.xml", base))).text();
assert.equal([...xml.matchAll(/<loc>/g)].length, 13);
for (const path of seo.publicPaths) assert.ok(xml.includes(`<loc>${seo.absoluteUrl(path)}</loc>`), path);
const robots = await (await fetch(new URL("/robots.txt", base))).text();
assert.ok(robots.includes("User-Agent: OAI-SearchBot"));
assert.ok(robots.includes("Sitemap: https://bendalabs.sk/sitemap.xml"));
const image = await fetch(new URL("/share-image", base));
assert.equal(image.status, 200);
assert.ok(image.headers.get("content-type").startsWith("image/png"));
const png = Buffer.from(await image.arrayBuffer());
assert.equal(png.readUInt32BE(16), 1200);
assert.equal(png.readUInt32BE(20), 630);
if (process.env.SEO_IMAGE_OUTPUT) writeFileSync(process.env.SEO_IMAGE_OUTPUT, png);
console.log("PASS: rendered metadata on 13 public + 5 private pages, JSON-LD, Ads tag, redirects, 404, XML, robots and 1200x630 PNG");
