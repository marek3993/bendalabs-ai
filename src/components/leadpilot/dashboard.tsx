"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight, Search, Radar, Inbox, CircleCheck, Clock, Copy, ChevronDown } from "lucide-react";
import { categoryLabels, euro, isActiveOpportunity, isFresh, isTechnicalTest, leadStatuses, quotedReply, statusLabels, type Opportunity, type ScoutRun, type LeadStatus } from "@/lib/leadpilot/model";
import type { ContactRequestRecord } from "@/lib/leads/types";
import "./dashboard.css";

const dateFormat = new Intl.DateTimeFormat("sk-SK", { dateStyle: "medium", timeZone: "Europe/Bratislava" });
function date(value: string | null) { return value && Number.isFinite(Date.parse(value)) ? dateFormat.format(new Date(value)) : "Dátum nezistený"; }
type Tab = "active" | "review" | "inbound" | "history";
type Props = { opportunities: Opportunity[]; contacts: Pick<ContactRequestRecord, "id" | "created_at" | "name" | "email" | "message">[]; runs: ScoutRun[]; errors: string[]; configured: boolean; asOf: number };

async function requestAction(body: object) {
  const response = await fetch("/api/admin/leadpilot", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "Operácia zlyhala.");
  return result;
}
export function LeadPilotDashboard({ opportunities, contacts, runs, errors, configured, asOf }: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("active");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [failed, setFailed] = useState(false);
  const [url, setUrl] = useState("");
  const realContacts = useMemo(() => contacts.filter(contact => !isTechnicalTest(contact.email)), [contacts]);
  const currentContacts = realContacts.filter(contact => isFresh(contact.created_at, asOf, 30));
  const active = opportunities.filter(lead => isActiveOpportunity(lead, asOf));
  const review = opportunities.filter(lead => !isActiveOpportunity(lead, asOf) && !["won", "lost", "archived"].includes(lead.status));
  const won = opportunities.filter(lead => lead.status === "won");
  const selected = tab === "active" ? active : tab === "review" ? review : opportunities;
  const filtered = selected.filter(lead => (category === "all" || lead.category === category) && `${lead.title} ${lead.summary} ${lead.region ?? ""}`.toLowerCase().includes(query.toLowerCase()));
  const inbound = currentContacts.filter(contact => `${contact.name} ${contact.email} ${contact.message}`.toLowerCase().includes(query.toLowerCase()));
  const lastRun = runs[0];
  async function run(action: "scout" | "import") {
    setBusy(true); setNotice(""); setFailed(false);
    try {
      const result = await requestAction(action === "scout" ? { action } : { action, url });
      if (result.run) {
        const r = result.run as ScoutRun;
        setNotice(result.run.reused ? `Dnešné vyhľadávanie už prebehlo. Uložených ${r.saved} dopytov.` : `Vyhľadávanie dokončené: ${r.saved} uložených dopytov z ${r.found} kandidátov.${r.errors.length ? " Niektoré zdroje sa nepodarilo overiť." : ""}`);
        setFailed(r.status === "failed" || r.status === "partial");
      } else { setNotice(result.duplicate ? "Tento dopyt už máte uložený." : "Dopyt je uložený vrátane návrhu riešenia a ponuky."); setUrl(""); }
      router.refresh();
    } catch (error) { setNotice(error instanceof Error ? error.message : "Operácia zlyhala."); setFailed(true); }
    finally { setBusy(false); }
  }
  return <main className="lp-shell">
    <header className="lp-header">
      <div><div className="lp-eyebrow"><span className="lp-dot" /> BendaLabs / obchodný prehľad</div><h1>LeadPilot<span>.</span></h1><p>Konkrétne zadania. Riešenie, cena a odpoveď na jednom mieste.</p></div>
      <div className="lp-header-actions"><a href="/automatizacia" className="lp-button lp-secondary">Web <ArrowUpRight size={16} /></a><form action="/admin/leads/logout" method="post"><button className="lp-button lp-secondary">Odhlásiť</button></form></div>
    </header>
    <section className="lp-stats" aria-label="Prehľad dopytov">
      {[{ label: "Aktuálne zadania", value: active.length, icon: Radar, tab: "active" }, { label: "Na preverenie", value: review.length, icon: Clock, tab: "review" }, { label: "Z webu · 30 dní", value: currentContacts.length, icon: Inbox, tab: "inbound" }, { label: "Získané zákazky", value: won.length, icon: CircleCheck, tab: "history" }].map(stat => <button key={stat.label} className="lp-stat" onClick={() => setTab(stat.tab as Tab)}><stat.icon size={19} /><span>{stat.label}</span><strong>{errors.length ? "—" : stat.value}</strong></button>)}
    </section>
    {errors.length > 0 && <div className="lp-notice lp-error" role="alert">{errors.join(" ")} Nedostupné údaje sa nezapočítavajú ako nula.</div>}
    <section className="lp-scout">
      <div><h2><Radar size={21} /> Nájsť nové zadania</h2><p>Platené dopyty na dokumenty, e-maily, CRM, reporty a prepojenia systémov. Prednosť majú čerstvé zadania zo Slovenska a Česka; zahraničné sú tiež zahrnuté.</p>
      <div className="lp-run">{lastRun ? <>Posledný beh: {date(lastRun.created_at)} · {lastRun.status === "running" ? "Prebieha" : lastRun.status === "completed" ? "Dokončený" : lastRun.status === "partial" ? "Čiastočne dokončený" : "Zlyhal"} · {lastRun.saved} uložených{lastRun.errors.length > 0 && <details><summary>Čo sa nepodarilo</summary>{lastRun.errors.map((error, i) => <p key={i}>{error}</p>)}</details>}</> : "Vyhľadávanie zatiaľ neprebehlo."}</div></div>
      <button className="lp-button lp-primary" onClick={() => run("scout")} disabled={busy || !configured || errors.length > 0}><Search size={17} /> {busy ? "Spracúvam…" : "Vyhľadať dopyty"}</button>
    </section>
    {!configured && <div className="lp-notice">Vyhľadávanie potrebuje dokončiť pripojenie AI. Uložené dopyty a správy z webu zostávajú dostupné.</div>}
    <details className="lp-import"><summary>Máte konkrétny odkaz? Pridať zadanie <ChevronDown size={16} /></summary><form onSubmit={event => { event.preventDefault(); run("import"); }}><input aria-label="Odkaz na zadanie" type="url" placeholder="https://…" required value={url} onChange={event => setUrl(event.target.value)} /><button className="lp-button lp-secondary" disabled={busy || !configured}>Overiť a pridať</button></form><p>Podporované: n8n Jobs, Upwork, Freelancer, PeoplePerHour, Webtrh, ePoptávka, AAAdopyt a Dopyt.sk. Dostupnosť pôvodnej stránky sa overuje pri importe.</p></details>
    {notice && <div className={`lp-notice ${failed ? "lp-error" : ""}`} role="status">{notice}</div>}
    <div className="lp-workbar"><nav aria-label="Zoznamy dopytov">{([{ id: "active", label: "Aktuálne" }, { id: "review", label: "Na preverenie" }, { id: "inbound", label: "Dopyty z webu" }, { id: "history", label: "Všetky uložené" }] as const).map(item => <button key={item.id} aria-pressed={tab === item.id} className={tab === item.id ? "selected" : ""} onClick={() => setTab(item.id)}>{item.label}</button>)}</nav>
      <div className="lp-filters"><label><Search size={16} /><input aria-label="Hľadať v dopytoch" placeholder="Hľadať v dopytoch" value={query} onChange={event => setQuery(event.target.value)} /></label>{tab !== "inbound" && <select aria-label="Typ automatizácie" value={category} onChange={event => setCategory(event.target.value)}><option value="all">Všetky automatizácie</option>{Object.entries(categoryLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>}</div>
    </div>
    {tab === "review" && <p className="lp-context">Tu sú zadania s neznámym dátumom alebo starším overením. Pred odpoveďou skontrolujte, či zadávateľ stále hľadá dodávateľa.</p>}
    {tab === "inbound" ? <section className="lp-list">{inbound.map(contact => <article className="lp-card lp-contact" key={contact.id}><div className="lp-card-meta"><span>Dopyt z webu</span><time>{date(contact.created_at)}</time></div><h2>{contact.name || "Záujemca"}</h2><a href={`mailto:${contact.email}`}>{contact.email}</a><p className="lp-message">{contact.message}</p></article>)}{inbound.length === 0 && <Empty message={query ? "Žiadny dopyt nezodpovedá hľadaniu." : "Za posledných 30 dní tu nie sú reálne dopyty z formulára."} />}</section> : <section className="lp-list">{filtered.map(lead => <OpportunityCard key={lead.id} lead={lead} />)}{filtered.length === 0 && <Empty message={query || category !== "all" ? "Žiadne zadanie nezodpovedá filtru." : tab === "active" ? "Zatiaľ nemáte overené aktuálne zadanie. Spustite vyhľadávanie alebo vložte konkrétny odkaz." : "V tomto zozname zatiaľ nie sú dopyty."} />}</section>}
    <footer className="lp-footer">Aktuálne zadania: zverejnené za posledných 14 dní a overené za posledné 3 dni. Úmysel objednať musí byť doložený pôvodným textom. Dostupnosť zákazky potvrdzuje zadávateľ. Ceny a dodanie sú pracovné odhady.</footer>
  </main>;
}
function Empty({ message }: { message: string }) { return <div className="lp-empty"><Inbox size={30} /><h2>{message}</h2><p>Zobrazujú sa iba uložené údaje. Technické testy formulára sú vyradené.</p></div>; }
function OpportunityCard({ lead }: { lead: Opportunity }) {
  const router = useRouter();
  const [status, setStatus] = useState<LeadStatus>(lead.status);
  const [reply, setReply] = useState(lead.proposal?.reply_body ?? "");
  const [rate, setRate] = useState(lead.proposal?.hourly_rate ?? 35);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const proposal = lead.proposal ? { ...lead.proposal, reply_body: reply, hourly_rate: rate } : null;
  async function verify() {
    setBusy(true); setNotice("");
    try { await requestAction({ action: "verify", id: lead.id }); setNotice("Pôvodné zadanie bolo znovu načítané a overené."); router.refresh(); }
    catch (error) { setNotice(error instanceof Error ? error.message : "Overenie zlyhalo."); }
    finally { setBusy(false); }
  }
  async function save() {
    setBusy(true); setNotice("");
    try { await requestAction({ action: "update", id: lead.id, status, ...(proposal ? { reply_body: reply, hourly_rate: rate } : {}) }); setNotice("Zmeny uložené."); router.refresh(); }
    catch (error) { setNotice(error instanceof Error ? error.message : "Uloženie zlyhalo."); }
    finally { setBusy(false); }
  }
  return <article className="lp-card">
    <div className="lp-card-meta"><span>{categoryLabels[lead.category]}</span><span className={`lp-badge ${lead.verification === "verified" ? "lp-good" : ""}`}>{lead.verification === "verified" ? "Dopyt doložený zdrojom" : "Treba preveriť"}</span><time>{date(lead.published_at)}</time></div>
    <div className="lp-card-heading"><h2>{lead.title}</h2><a className="lp-source" href={lead.source_url} target="_blank" rel="noopener noreferrer">Pôvodné zadanie <ArrowUpRight size={16} /></a></div>
    <p className="lp-summary">{lead.summary}</p>
    <div className="lp-facts"><span>{lead.region || "Lokalita nezistená"}</span><span>Rozpočet zadávateľa: <b>{lead.budget_text || "Neuvedený"}</b></span><span>{statusLabels[lead.status]}</span></div>
    {proposal && <div className="lp-estimate"><div><small>Náš odhad realizácie</small><strong>{euro(proposal.hours_min * rate)} – {euro(proposal.hours_max * rate)}</strong></div><div><small>Odhad práce</small><strong>{proposal.hours_min} – {proposal.hours_max} h</strong></div><div><small>Dodanie po dodaní podkladov</small><strong>{proposal.days_min} – {proposal.days_max} pracovných dní</strong></div></div>}
    <details className="lp-detail"><summary>Riešenie a pripravená odpoveď <ChevronDown size={17} /></summary>
      <div className="lp-detail-body"><button className="lp-button lp-secondary" disabled={busy} onClick={verify}>Znovu overiť zadanie</button><h3>Čo zadávateľ napísal</h3><blockquote>{lead.demand_excerpt}</blockquote><p className="lp-evidence">Zverejnenie: {lead.publication_evidence || "Neoverené"} · Načítané: {date(lead.fetched_at)}</p>
        {proposal && <><h3>Navrhované riešenie</h3><p>{proposal.solution}</p><div className="lp-scope-grid">{[{ title: "Predpoklady", items: proposal.assumptions }, { title: "Mimo rozsahu", items: proposal.exclusions }, { title: "Treba doplniť", items: proposal.questions }].map(group => <div key={group.title}><h3>{group.title}</h3><ul>{group.items.map((item, i) => <li key={i}>{item}</li>)}</ul></div>)}</div><h3>Prevádzkové náklady</h3><p>{proposal.recurring_costs}</p><label className="lp-rate">Pracovná sadzba (€ / h)<input type="number" min="1" max="1000" step="1" value={rate} onChange={event => setRate(Number(event.target.value))} /></label><h3>Text odpovede bez ceny</h3><textarea aria-label="Text odpovede" value={reply} onChange={event => setReply(event.target.value)} rows={5} /><h3>Celá odpoveď s cenou</h3><pre className="lp-reply">{quotedReply(proposal)}</pre><button className="lp-button lp-secondary" onClick={async () => { try { await navigator.clipboard.writeText(quotedReply(proposal)); setNotice("Odpoveď skopírovaná. Odoslanie označte až po skutočnom odoslaní."); } catch { setNotice("Kopírovanie nie je dostupné. Označte text odpovede a skopírujte ho ručne."); } }}><Copy size={16} /> Skopírovať odpoveď</button></>}
        <div className="lp-save-row"><label>Stav dopytu<select value={status} onChange={event => setStatus(event.target.value as LeadStatus)}>{leadStatuses.map(value => <option value={value} key={value}>{statusLabels[value]}</option>)}</select></label><button className="lp-button lp-primary" disabled={busy || (proposal !== null && (!Number.isFinite(rate) || rate <= 0 || reply.trim().length < 10))} onClick={save}>{busy ? "Ukladám…" : "Uložiť zmeny"}</button></div><p className="lp-small">Skopírovanie odpovede nemení stav na „Odpovedané“. Cenu a termín pred odoslaním skontrolujte podľa svojej kapacity.</p>{notice && <p role="status" className="lp-notice">{notice}</p>}
      </div>
    </details>
  </article>;
}
