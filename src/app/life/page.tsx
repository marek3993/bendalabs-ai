import type { Metadata } from "next";
import Link from "next/link";
import { LifeApp } from "@/components/life/life-app";
import { getLifeSession, isLifeAuthConfigured } from "@/lib/life/auth";
import { isLifeStorageConfigured } from "@/lib/life/storage";
import { lifeCapabilities, loadValidatedLifeState } from "@/lib/life/api";
import styles from "./login.module.css";
import "./life.css";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const metadata: Metadata = {
  title: "SI For Me · BendaLabs",
  description: "Tvoj súkromný priestor pre život, zdravie, financie a nápady.",
  robots: { index: false, follow: false, nocache: true },
};

function Gate({ error, configured }: { error?: string; configured: boolean }) {
  return <main className={styles.gate}>
    <Link className={styles.brand} href="/"><span className={styles.mark}>si</span><span>BendaLabs<span className={styles.byline}>PERSONAL INTELLIGENCE</span></span></Link>
    <section className={styles.card} aria-labelledby="life-title">
      <span className={styles.eyebrow}><span className={styles.dot} /> IBA PRE TEBA</span>
      <h1 id="life-title">Tvoj život.<br /><em>V súvislostiach.</em></h1>
      <p className={styles.intro}>Financie, zdravie, projekty a myšlienky.<br />Jeden priestor, ktorý si pamätá.</p>
      <div className={styles.divider} />
      <h2>Vitaj v SI For Me</h2>
      <p className={styles.hint}>Odomkni svoj súkromný priestor.</p>
      {error && <p className={styles.error} role="alert">{error}</p>}
      {configured ? <form action="/life/login" method="post" className={styles.form}>
        <input type="text" name="username" value="BendaLabs" autoComplete="username" readOnly hidden />
        <label htmlFor="life-password">Heslo</label>
        <input id="life-password" name="password" type="password" autoComplete="current-password" placeholder="Tvoje heslo" required maxLength={512} autoFocus />
        <label className={styles.remember}><input type="checkbox" name="remember" defaultChecked /><span>Zostať prihlásený na tomto zariadení</span></label>
        <button type="submit">Vstúpiť do môjho priestoru <span aria-hidden="true">↗</span></button>
        <p className={styles.small}>Prihlásenie si toto zariadenie zapamätá na rok a pri používaní sa predĺži. Odhlásiť ho môžeš kedykoľvek.</p>
      </form> : <p className={styles.error}>Súkromný prístup momentálne nie je dostupný. Údaje zostávajú uzamknuté.</p>}
    </section>
    <footer className={styles.footer}><span>SI FOR ME</span><span>Tvoj kontext. Tvoje tempo.</span><span>by BendaLabs</span></footer>
  </main>;
}
export default async function LifePage({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams ?? {};
  const configured = isLifeAuthConfigured() && isLifeStorageConfigured();
  const messages: Record<string, string> = { failed: "Heslo nesedí. Skús ho zadať znova.", limited: "Príliš veľa pokusov. Počkaj 15 minút a skús to znova.", unavailable: "Prihlásenie sa teraz nepodarilo overiť. Skús to o chvíľu." };
  if (!configured) return <Gate configured={false} />;
  let workspace: Awaited<ReturnType<typeof loadValidatedLifeState>> | null = null;
  let unavailable = false;
  try {
    const session = await getLifeSession();
    if (session) workspace = await loadValidatedLifeState();
  } catch { unavailable = true; }
  if (unavailable) return <Gate configured error="Úložisko sa nepodarilo načítať. Tvoje údaje sme nenahradili prázdnymi. Skús obnoviť stránku." />;
  if (!workspace) return <Gate configured error={typeof params.auth === "string" ? messages[params.auth] : undefined} />;
  return <LifeApp initialState={workspace.state} initialVersion={workspace.version} capabilities={lifeCapabilities()} />;
}
