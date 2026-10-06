import Link from "next/link";
import { privatePageMetadata } from "@/lib/bendalabs/seo";
import { isAdminAuthenticated, isAdminProtectionConfigured } from "@/lib/leads/auth";
import { getFeedbackDashboard } from "@/lib/university-feedback/server";
import curriculum from "@/components/robotics-university/lib/curriculum.json";
import styles from "./university-admin.module.css";

export const dynamic = "force-dynamic";
export const metadata = privatePageMetadata("Spätná väzba · Robotická univerzita | BendaLabs");
type Params = Record<string, string | string[] | undefined>;
const first = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] ?? "" : value ?? "";
const date = new Intl.DateTimeFormat("sk-SK", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Bratislava" });
const titles = new Map(curriculum.map(chapter => [chapter.id, chapter.title.sk]));

export default async function UniversityFeedbackAdmin({ searchParams }: { searchParams: Promise<Params> }) {
  const params = await searchParams;
  // Keep storage entirely behind the existing administrator authentication.
  const authenticated = isAdminProtectionConfigured() && await isAdminAuthenticated();
  if (!authenticated) return <main className={styles.page}><section className={styles.login}>
    <Link href="/" className={styles.brand}>BendaLabs<span>.</span></Link>
    <p className={styles.eyebrow}>Robotická univerzita</p><h1>Spätná väzba k lekciám</h1>
    <p>Prihlás sa do správy hodnotení a návrhov na zlepšenie.</p>
    {first(params.auth) === "failed" && <p role="alert" className={styles.error}>Prihlásenie sa nepodarilo. Skontroluj heslo a skús to znova.</p>}
    {isAdminProtectionConfigured() ? <form action="/admin/university/login" method="post" className={styles.loginForm}>
      <label htmlFor="university-admin-password">Heslo správcu</label>
      <input id="university-admin-password" name="password" type="password" autoComplete="current-password" required maxLength={500}/>
      <button type="submit">Prihlásiť sa</button>
    </form> : <p role="status">Prihlásenie je momentálne nedostupné.</p>}
    <Link href="/roboticka-univerzita">Späť do univerzity →</Link>
  </section></main>;

  const chapter = titles.has(first(params.chapter)) ? first(params.chapter) : "";
  const status = ["new", "reviewed"].includes(first(params.status)) ? first(params.status) : "all";
  const requestedPage = Number(first(params.page)) || 1;
  const page = Number.isInteger(requestedPage) ? Math.max(1, Math.min(10_000, requestedPage)) : 1;
  const dashboard = await getFeedbackDashboard({ chapter, status, page });
  const totals = dashboard?.summaries.reduce((sum, item) => ({ feedback: sum.feedback + Number(item.feedback_count), fresh: sum.fresh + Number(item.new_count), suggestions: sum.suggestions + Number(item.suggestion_count) }), { feedback: 0, fresh: 0, suggestions: 0 });
  const pageHref = (number: number) => `/admin/university?${new URLSearchParams({ chapter, status, page: String(number) })}`;
  return <main className={styles.page}><div className={styles.container}>
    <header className={styles.header}><div><Link href="/" className={styles.brand}>BendaLabs<span>.</span></Link><p className={styles.eyebrow}>Robotická univerzita</p><h1>Hodnotenia a návrhy</h1><p>Podnety od študentov pomáhajú zlepšovať jednotlivé lekcie.</p></div>
      <div className={styles.headerActions}><Link href="/admin/university/questions">Otázky a projekty</Link><Link href="/roboticka-univerzita">Otvoriť univerzitu ↗</Link><form action="/admin/university/logout" method="post"><button className={styles.secondary} type="submit">Odhlásiť sa</button></form></div>
    </header>
    {!dashboard ? <section className={styles.card}><h2>Hodnotenia sa nepodarilo načítať</h2><p>Skús stránku o chvíľu obnoviť. Uložené návrhy tým nie sú ovplyvnené.</p><Link href={pageHref(page)}>Skúsiť znova →</Link></section> : <>
      <section className={styles.metrics} aria-label="Prehľad spätnej väzby"><div><strong>{totals?.feedback}</strong><span>všetkých hodnotení a návrhov</span></div><div><strong>{totals?.fresh}</strong><span>čaká na prečítanie</span></div><div><strong>{totals?.suggestions}</strong><span>textových návrhov</span></div></section>
      <section className={styles.card}><h2>Prehľad kapitol</h2><p>Priemer počítame iba z odoslaných číselných hodnotení.</p><div className={styles.tableWrap}><table><thead><tr><th>Kapitola</th><th>Priemer</th><th>Hodnotenia</th><th>Návrhy</th><th>Nové</th></tr></thead><tbody>
        {curriculum.map(item => { const summary = dashboard.summaries.find(row => row.chapter_id === item.id); return <tr key={item.id}><td><Link href={`/admin/university?chapter=${item.id}`}>{item.title.sk}</Link></td><td>{summary?.average_rating != null ? `${Number(summary.average_rating).toFixed(1)} / 5` : "—"}</td><td>{summary?.rating_count ?? 0}</td><td>{summary?.suggestion_count ?? 0}</td><td>{summary?.new_count ?? 0}</td></tr>; })}
      </tbody></table></div></section>
      <section className={styles.card}><div className={styles.sectionTitle}><div><h2>Prijatá spätná väzba</h2><p>{dashboard.total} {dashboard.total === 1 ? "podnet" : "podnetov"} pre zvolený filter</p></div></div>
        <form className={styles.filters} method="get"><label>Kapitola<select name="chapter" defaultValue={chapter}><option value="">Všetky kapitoly</option>{curriculum.map(item => <option key={item.id} value={item.id}>{item.title.sk}</option>)}</select></label><label>Stav<select name="status" defaultValue={status}><option value="all">Všetky podnety</option><option value="new">Nové</option><option value="reviewed">Prečítané</option></select></label><button type="submit">Zobraziť</button></form>
        {first(params.error) === "save" && <p role="alert" className={styles.error}>Zmenu sa nepodarilo uložiť. Skús to znova.</p>}
        <div className={styles.feedbackList}>{dashboard.rows.map(row => <article key={row.submission_id} className={styles.feedback}>
          <div className={styles.feedbackHeading}><div><Link href={`/roboticka-univerzita#chapter/${row.chapter_id}`} className={styles.chapterTitle}>{titles.get(row.chapter_id) ?? row.chapter_id}</Link><p><time dateTime={row.created_at}>{date.format(new Date(row.created_at))}</time> · {row.lang.toUpperCase()}</p></div><span className={row.status === "new" ? styles.newBadge : styles.badge}>{row.status === "new" ? "Nové" : "Prečítané"}</span></div>
          {row.rating !== null && <p className={styles.rating} aria-label={`Hodnotenie ${row.rating} z 5`}>{"★".repeat(row.rating)}<span>{"☆".repeat(5 - row.rating)}</span> <small>{row.rating} / 5</small></p>}
          {row.suggestion && <p className={styles.suggestion}>{row.suggestion}</p>}
          {row.status === "new" && <form action="/admin/university/review" method="post"><input type="hidden" name="submissionId" value={row.submission_id}/><input type="hidden" name="chapter" value={chapter}/><input type="hidden" name="status" value={status}/><input type="hidden" name="page" value={page}/><button type="submit" className={styles.secondary}>Označiť ako prečítané</button></form>}
        </article>)}</div>
        {dashboard.rows.length === 0 && <p className={styles.empty}>Zatiaľ tu nie sú žiadne podnety pre tento filter.</p>}
        <nav className={styles.pagination} aria-label="Stránkovanie spätnej väzby">{page > 1 ? <Link href={pageHref(page - 1)}>← Predchádzajúca</Link> : <span/>}<span>Strana {page}</span>{page * 25 < dashboard.total ? <Link href={pageHref(page + 1)}>Nasledujúca →</Link> : <span/>}</nav>
      </section>
    </>}
  </div></main>;
}
