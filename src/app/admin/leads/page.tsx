import Link from "next/link";
import { isAdminAuthenticated, isAdminProtectionConfigured } from "@/lib/leads/auth";
import { getContactRequestsPage, getRecentContactRequests } from "@/lib/leads/repository";
import { isLeadStorageConfigured } from "@/lib/leads/supabase";
import { dashboardSnapshotTime, listOpportunities, recentRuns } from "@/lib/leadpilot/repository";
import { scoutConfigured } from "@/lib/leadpilot/scout";
import { scoutScheduleConfigured } from "@/lib/leadpilot/schedule";
import { LeadPilotDashboard } from "@/components/leadpilot/dashboard";
import { privatePageMetadata } from "@/lib/bendalabs/seo";

import { ContactInbox } from "@/components/leads/inbox";
import styles from "@/components/leads/inbox.module.css";

export const dynamic = "force-dynamic";
export const metadata = privatePageMetadata("BendaLabs · Odpovede a LeadPilot");
export default async function AdminLeadsPage({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const params = (await searchParams) ?? {};
  if (!isAdminProtectionConfigured() || !await isAdminAuthenticated()) {
    return <main className="min-h-screen px-6 py-20"><div className="glass-panel mx-auto max-w-md rounded-3xl p-8"><p className="text-xs uppercase tracking-widest text-neutral-500">BendaLabs · súkromný prehľad</p><h1 className="mt-4 text-3xl font-semibold tracking-tight">Odpovede a LeadPilot</h1><p className="mt-4 text-sm leading-6 text-neutral-600">Prihláste sa k odpovediam z formulárov a vyhľadaným zákazkám.</p>{params.auth === "failed" && <p role="alert" className="mt-4 text-sm text-amber-800">Nesprávne heslo.</p>}{!isAdminProtectionConfigured() ? <p className="mt-4 text-sm text-amber-800">Prístup do adminu ešte nie je nakonfigurovaný.</p> : <form action="/admin/leads/login" method="post" className="mt-6 flex flex-col gap-4"><label className="text-sm">Heslo<input autoComplete="current-password" required type="password" name="password" className="mt-2 w-full rounded-xl border border-black/10 bg-white px-4 py-3" /></label><button className="rounded-xl bg-black px-5 py-3 text-sm font-medium text-white">Prihlásiť sa</button></form>}</div></main>;
  }
  const leadpilotView = params.view === "leadpilot";
  const navigation = <nav className={styles.navigation} aria-label="Administrácia dopytov">
    <Link prefetch={false} href="/admin/leads" aria-current={!leadpilotView ? "page" : undefined}>Odpovede z formulárov</Link>
    <Link prefetch={false} href="/admin/leads?view=leadpilot" aria-current={leadpilotView ? "page" : undefined}>LeadPilot</Link>
  </nav>;
  if (!leadpilotView) {
    const rawPage = typeof params.page === "string" ? Number(params.page) : 1;
    const page = Number.isSafeInteger(rawPage) && rawPage > 0 && rawPage <= 100_000 ? rawPage : 1;
    let data: Awaited<ReturnType<typeof getContactRequestsPage>> = { contacts: [], page, hasNext: false, total: null };
    let error: string | null = null;
    if (!isLeadStorageConfigured()) {
      error = "Úložisko odpovedí nie je pripojené. Údaje momentálne nie sú dostupné.";
    } else {
      try { data = await getContactRequestsPage(page); }
      catch { error = "Odpovede z formulárov sa nepodarilo načítať."; }
    }
    return <>{navigation}<ContactInbox {...data} error={error} /></>;
  }
  if (!isLeadStorageConfigured()) return <>{navigation}<main className="mx-auto max-w-xl px-6 py-20"><h1 className="text-3xl font-semibold">LeadPilot</h1><p className="mt-5">Úložisko dopytov nie je pripojené. Údaje momentálne nie sú dostupné.</p></main></>;
  const [leads, contacts, runs] = await Promise.allSettled([listOpportunities(), getRecentContactRequests({ limit: 200 }), recentRuns()]);
  const errors: string[] = [];
  if (leads.status === "rejected") errors.push("Nájdené dopyty sa nepodarilo načítať.");
  if (contacts.status === "rejected") errors.push("Dopyty z webu sa nepodarilo načítať.");
  if (runs.status === "rejected") errors.push("Stav vyhľadávania nie je dostupný.");
  return <>{navigation}<LeadPilotDashboard opportunities={leads.status === "fulfilled" ? leads.value : []} contacts={contacts.status === "fulfilled" ? contacts.value : []} runs={runs.status === "fulfilled" ? runs.value : []} errors={errors} configured={scoutConfigured()} scheduled={scoutScheduleConfigured()} asOf={dashboardSnapshotTime()} /></>;
}
