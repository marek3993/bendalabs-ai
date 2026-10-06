import Link from "next/link";
import { privatePageMetadata } from "@/lib/bendalabs/seo";
import { isAdminAuthenticated, isAdminProtectionConfigured } from "@/lib/leads/auth";
import { getSupportDashboard } from "@/lib/university-support/server";
import { validProjectUrl } from "@/lib/university-support/validation";
import styles from "../university-admin.module.css";

export const dynamic = "force-dynamic";
export const metadata = privatePageMetadata("Otázky a projekty · Robotická univerzita | BendaLabs");
type Params = Record<string, string | string[] | undefined>;
const first = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] ?? "" : value ?? "";
const date = new Intl.DateTimeFormat("sk-SK", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Bratislava" });

export default async function UniversityQuestions({ searchParams }: { searchParams: Promise<Params> }) {
  const params = await searchParams;
  const authenticated = isAdminProtectionConfigured() && await isAdminAuthenticated();
  if (!authenticated) return <main className={styles.page}><section className={styles.login}>
    <Link href="/" className={styles.brand}>BendaLabs<span>.</span></Link><p className={styles.eyebrow}>Robotická univerzita</p><h1>Otázky a projekty</h1><p>Prihlás sa do súkromného prehľadu správ od študentov.</p>
    {first(params.auth) === "failed" && <p className={styles.error} role="alert">Prihlásenie sa nepodarilo. Skontroluj heslo a skús to znova.</p>}
    {isAdminProtectionConfigured() ? <form action="/admin/university/login" method="post" className={styles.loginForm}><input type="hidden" name="returnTo" value="/admin/university/questions"/><label htmlFor="questions-password">Heslo správcu</label><input id="questions-password" name="password" type="password" required maxLength={500} autoComplete="current-password"/><button type="submit">Prihlásiť sa</button></form> : <p>Prihlásenie je momentálne nedostupné.</p>}
    <Link href="/roboticka-univerzita">Späť do univerzity →</Link>
  </section></main>;
  const kind = ["question", "project"].includes(first(params.kind)) ? first(params.kind) : "all";
  const status = ["new", "reviewed"].includes(first(params.status)) ? first(params.status) : "all";
  const requestedPage = Number(first(params.page)) || 1;
  const page = Number.isInteger(requestedPage) ? Math.max(1, Math.min(10_000, requestedPage)) : 1;
  const dashboard = await getSupportDashboard({ kind, status, page });
  const pageHref = (value: number) => `/admin/university/questions?${new URLSearchParams({ kind, status, page: String(value) })}`;
  return <main className={styles.page}><div className={styles.container}>
    <header className={styles.header}><div><Link href="/" className={styles.brand}>BendaLabs<span>.</span></Link><p className={styles.eyebrow}>Robotická univerzita</p><h1>Otázky a projekty</h1><p>Súkromné správy od študentov. Odpoveď priprav cez uvedený e-mail.</p></div><div className={styles.headerActions}><Link href="/admin/university">Hodnotenia lekcií</Link><form action="/admin/university/logout" method="post"><button className={styles.secondary} type="submit">Odhlásiť sa</button></form></div></header>
    <section className={styles.card}><form className={styles.filters} method="get"><label>Typ správy<select name="kind" defaultValue={kind}><option value="all">Všetky správy</option><option value="question">Otázky</option><option value="project">Projekty</option></select></label><label>Stav<select name="status" defaultValue={status}><option value="all">Všetky</option><option value="new">Nové</option><option value="reviewed">Prečítané</option></select></label><button type="submit">Zobraziť</button></form>
      {first(params.error) === "save" && <p className={styles.error} role="alert">Zmenu sa nepodarilo uložiť. Skús to znova.</p>}
      {!dashboard ? <><h2>Správy sa nepodarilo načítať</h2><p>Skús stránku o chvíľu obnoviť.</p><Link href={pageHref(page)}>Skúsiť znova →</Link></> : <>
        <p>{dashboard.total} správ pre zvolený filter</p>
        {dashboard.rows.map(row => <article className={styles.feedback} key={row.submission_id}>
          <div className={styles.feedbackHeading}><div><h2>{row.kind === "project" ? "Projekt" : "Otázka"}{row.name ? ` · ${row.name}` : ""}</h2><p><time dateTime={row.created_at}>{date.format(new Date(row.created_at))}</time> · {row.lang.toUpperCase()}</p></div><span className={row.status === "new" ? styles.newBadge : styles.badge}>{row.status === "new" ? "Nové" : "Prečítané"}</span></div>
          <p className={styles.suggestion}>{row.message}</p>
          <p className={styles.suggestion}>Kontakt: <a href={`mailto:${encodeURIComponent(row.email)}?subject=${encodeURIComponent("BendaLabs · Robotická univerzita")}`}>{row.email}</a></p>
          {row.project_url && validProjectUrl(row.project_url) && <p className={styles.suggestion}><a href={row.project_url} target="_blank" rel="noopener noreferrer">Otvoriť odkaz na projekt ↗</a></p>}
          {row.status === "new" && <form action="/admin/university/questions/review" method="post"><input type="hidden" name="submissionId" value={row.submission_id}/><input type="hidden" name="kind" value={kind}/><input type="hidden" name="status" value={status}/><input type="hidden" name="page" value={page}/><button className={styles.secondary} type="submit">Označiť ako prečítané</button></form>}
        </article>)}
        {dashboard.rows.length === 0 && <p className={styles.empty}>Zatiaľ tu nie sú žiadne správy pre tento filter.</p>}
        <nav className={styles.pagination} aria-label="Stránkovanie správ">{page > 1 ? <Link href={pageHref(page - 1)}>← Predchádzajúca</Link> : <span/>}<span>Strana {page}</span>{page * 25 < dashboard.total ? <Link href={pageHref(page + 1)}>Nasledujúca →</Link> : <span/>}</nav>
      </>}
    </section>
  </div></main>;
}
