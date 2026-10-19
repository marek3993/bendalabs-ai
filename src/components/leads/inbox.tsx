"use client";

import { useEffect, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ContactRequestRecord } from "@/lib/leads/types";
import styles from "./inbox.module.css";

type Contact = Pick<ContactRequestRecord, "id" | "created_at" | "name" | "email" | "website" | "message" | "source" | "referrer">;
type Props = { contacts: Contact[]; page: number; hasNext: boolean; total: number | null; error: string | null };
const dateFormat = new Intl.DateTimeFormat("sk-SK", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Bratislava" });

function sourceLabel(contact: Contact) {
  if (contact.message.includes("/automatizacia")) return "Formulár · Automatizácia";
  if (contact.source === "audit_result") return "Formulár · Audit webu";
  if (contact.source === "ai_navrh_na_mieru") return "Formulár · AI návrh na mieru";
  return "Kontaktný formulár";
}
function websiteLink(value: string) {
  if (!value) return null;
  try {
    const url = new URL(value.includes(":") ? value : `https://${value}`);
    return ["https:", "http:"].includes(url.protocol) ? url.href : null;
  } catch { return null; }
}

export function ContactInbox({ contacts, page, hasNext, total, error }: Props) {
  const router = useRouter();
  const [refreshing, startTransition] = useTransition();
  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState === "visible") startTransition(() => router.refresh());
    };
    const interval = window.setInterval(refresh, 60_000);
    document.addEventListener("visibilitychange", refresh);
    return () => { window.clearInterval(interval); document.removeEventListener("visibilitychange", refresh); };
  }, [router]);

  return <main className={styles.inbox}>
    <header className={styles.header}>
      <div><p className={styles.eyebrow}>BendaLabs / prijaté správy</p><h1>Odpovede z formulárov</h1><p>Dopyty z /automatizacia a ostatných formulárov na webe, od najnovších.</p></div>
      <div className={styles.actions}>
        <button type="button" onClick={() => startTransition(() => router.refresh())} disabled={refreshing}>{refreshing ? "Obnovujem…" : "Obnoviť"}</button>
        <form action="/admin/leads/logout" method="post"><button type="submit">Odhlásiť</button></form>
      </div>
    </header>
    <div className={styles.summary}><span>{error ? "Počet odpovedí nie je dostupný" : total !== null ? `Uložené odpovede: ${total}` : `Strana ${page}`}</span><span>Bez časového obmedzenia · automatická obnova každú minútu</span></div>
    {error ? <div className={styles.error} role="alert">{error} Skúste obnoviť prehľad.</div> : <>
      <section className={styles.list} aria-label="Prijaté odpovede">
        {contacts.map(contact => {
          const email = contact.email.trim();
          const callWithoutEmail = email.toLowerCase() === "no-email-call@bendalabs.invalid";
          const likelyTest = /@example\.(com|org|net)$/i.test(email) || /^(form-check-|intake-check-|test[-+]|automation-check-)/i.test(email);
          const website = websiteLink(contact.website);
          const timestamp = Date.parse(contact.created_at);
          return <article key={contact.id} className={styles.card}>
            <div className={styles.meta}><span>{sourceLabel(contact)}</span>{likelyTest && <span className={styles.test}>Pravdepodobne testovací záznam</span>}<time dateTime={Number.isFinite(timestamp) ? contact.created_at : undefined}>{Number.isFinite(timestamp) ? dateFormat.format(new Date(timestamp)) : "Dátum neuvedený"}</time></div>
            <h2>{contact.name || "Záujemca"}</h2>
            {callWithoutEmail ? <p>Žiadosť o telefonát · kontakt v správe</p> : email ? <a href={`mailto:${email}`}>{email}</a> : <p>E-mail neuvedený</p>}
            {website && <p><a href={website} target="_blank" rel="noopener noreferrer">{contact.website}</a></p>}
            <p className={styles.message}>{contact.message || "Správa bez textu."}</p>
            {contact.referrer && <details className={styles.origin}><summary>Stránka odoslania</summary><p>{contact.referrer}</p></details>}
          </article>;
        })}
        {contacts.length === 0 && <div className={styles.empty}><h2>{page === 1 ? "Zatiaľ nie sú uložené žiadne odpovede." : "Na tejto strane nie sú ďalšie odpovede."}</h2><p>Po odoslaní formulára na webe sa jeho odpoveď zobrazí tu.</p></div>}
      </section>
      {(page > 1 || hasNext) && <nav className={styles.pagination} aria-label="Stránky odpovedí">
        {page > 1 && <Link prefetch={false} href={`/admin/leads?page=${page - 1}`}>← Novšie odpovede</Link>}<span>Strana {page}</span>{hasNext && <Link prefetch={false} href={`/admin/leads?page=${page + 1}`}>Staršie odpovede →</Link>}
      </nav>}
      <p className={styles.note}>Zobrazené sú všetky uložené správy vrátane označených možných testov. Údaje o kampani sú v texte správy, ak ich formulár zachytil.</p>
    </>}
  </main>;
}
