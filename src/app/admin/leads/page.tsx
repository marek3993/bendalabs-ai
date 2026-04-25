import { isAdminAuthenticated, isAdminProtectionConfigured } from "@/lib/leads/auth";
import { getLeadRollups, getRecentAudits } from "@/lib/leads/repository";
import { isLeadStorageConfigured } from "@/lib/leads/supabase";
import type { LeadSort, LeadStatusFilter } from "@/lib/leads/types";

export const dynamic = "force-dynamic";

type SearchParamValue = string | string[] | undefined;
type SearchParams = Record<string, SearchParamValue>;

type PageProps = {
  searchParams?: Promise<SearchParams>;
};

function readSearchParam(value: SearchParamValue) {
  return Array.isArray(value) ? value[0] : value ?? "";
}

function normalizeStatusFilter(value: string): LeadStatusFilter {
  if (value === "hot" || value === "high-fit" || value === "returning") {
    return value;
  }

  return "all";
}

function normalizeSort(value: string): LeadSort {
  if (value === "audit-count" || value === "fit-score") {
    return value;
  }

  return "last-seen";
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("sk-SK", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function LeadBadge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "hot" | "good";
}) {
  const palette =
    tone === "hot"
      ? "border-amber-300 bg-amber-50 text-amber-900"
      : tone === "good"
        ? "border-emerald-300 bg-emerald-50 text-emerald-900"
        : "border-black/10 bg-black/[0.03] text-neutral-700";

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.18em] ${palette}`}
    >
      {children}
    </span>
  );
}

function StatusPills({
  isHotLead,
  isHighFit,
  isReturningInterest,
}: {
  isHotLead: boolean;
  isHighFit: boolean;
  isReturningInterest: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {isHotLead ? <LeadBadge tone="hot">hot lead</LeadBadge> : null}
      {isHighFit ? <LeadBadge tone="good">high-fit</LeadBadge> : null}
      {isReturningInterest ? <LeadBadge>returning interest</LeadBadge> : null}
      {!isHotLead && !isHighFit && !isReturningInterest ? <LeadBadge>standard</LeadBadge> : null}
    </div>
  );
}

function LoginCard({ authState }: { authState: string }) {
  return (
    <main className="min-h-screen px-6 py-12">
      <div className="mx-auto max-w-md">
        <div className="glass-panel rounded-[32px] p-8">
          <div className="text-[11px] uppercase tracking-[0.24em] text-neutral-500">
            Internal access
          </div>
          <h1 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-neutral-950">
            Admin leads
          </h1>
          <p className="mt-4 text-sm leading-6 text-neutral-600">
            Dashboard je chraneny jednoduchym heslom z env premennej.
          </p>
          {authState === "failed" ? (
            <div className="mt-5 rounded-[20px] border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              Nespravne heslo.
            </div>
          ) : null}
          {authState === "config-missing" ? (
            <div className="mt-5 rounded-[20px] border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              Chyba `ADMIN_LEADS_PASSWORD`.
            </div>
          ) : null}
          <form action="/admin/leads/login" method="post" className="mt-6 space-y-4">
            <input
              type="password"
              name="password"
              placeholder="Admin heslo"
              className="min-h-13 w-full rounded-[18px] border border-black/10 bg-white px-4 text-neutral-950 outline-none focus:border-black/25 focus:shadow-[0_0_0_4px_rgba(17,17,17,0.05)]"
            />
            <button
              type="submit"
              className="w-full rounded-[18px] border border-black bg-black px-4 py-3 text-sm font-medium text-white hover:bg-neutral-800"
            >
              Prihlasit sa
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}

function SetupCard() {
  return (
    <main className="min-h-screen px-6 py-12">
      <div className="mx-auto max-w-2xl glass-panel rounded-[32px] p-8">
        <div className="text-[11px] uppercase tracking-[0.24em] text-neutral-500">Setup required</div>
        <h1 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-neutral-950">
          Lead dashboard este nie je pripraveny
        </h1>
        <p className="mt-4 text-sm leading-6 text-neutral-600">
          Doplň `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` a SQL migraciu zo suboru
          `supabase/migrations/20260425_audit_leads.sql`.
        </p>
      </div>
    </main>
  );
}

export default async function AdminLeadsPage({ searchParams }: PageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const authState = readSearchParam(resolvedSearchParams.auth);
  const query = readSearchParam(resolvedSearchParams.q);
  const status = normalizeStatusFilter(readSearchParam(resolvedSearchParams.status));
  const sort = normalizeSort(readSearchParam(resolvedSearchParams.sort));

  if (!isAdminProtectionConfigured()) {
    return <LoginCard authState="config-missing" />;
  }

  const authenticated = await isAdminAuthenticated();

  if (!authenticated) {
    return <LoginCard authState={authState} />;
  }

  if (!isLeadStorageConfigured()) {
    return <SetupCard />;
  }

  const [leads, recentAudits] = await Promise.all([
    getLeadRollups({ query, sort, status }),
    getRecentAudits({ query, limit: 25 }),
  ]);

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="glass-panel rounded-[32px] p-6 sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="text-[11px] uppercase tracking-[0.24em] text-neutral-500">
                Internal dashboard
              </div>
              <h1 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-neutral-950 sm:text-4xl">
                Audit leads
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-neutral-600">
                Historie auditov, opakovane domeny a jednoduche signalizovanie hot leadov.
              </p>
            </div>

            <form action="/admin/leads/logout" method="post">
              <button
                type="submit"
                className="rounded-[18px] border border-black/10 bg-white px-4 py-3 text-sm font-medium text-neutral-900 hover:border-black/20"
              >
                Odhlasit sa
              </button>
            </form>
          </div>

          <form className="mt-8 grid gap-3 lg:grid-cols-[minmax(0,1.2fr)_0.7fr_0.7fr_auto]">
            <input
              type="text"
              name="q"
              defaultValue={query}
              placeholder="Filter domeny"
              className="min-h-13 rounded-[18px] border border-black/10 bg-white px-4 text-neutral-950 outline-none focus:border-black/25 focus:shadow-[0_0_0_4px_rgba(17,17,17,0.05)]"
            />
            <select
              name="status"
              defaultValue={status}
              className="min-h-13 rounded-[18px] border border-black/10 bg-white px-4 text-neutral-950 outline-none focus:border-black/25"
            >
              <option value="all">Vsetky statusy</option>
              <option value="hot">Hot lead</option>
              <option value="high-fit">High-fit</option>
              <option value="returning">Returning interest</option>
            </select>
            <select
              name="sort"
              defaultValue={sort}
              className="min-h-13 rounded-[18px] border border-black/10 bg-white px-4 text-neutral-950 outline-none focus:border-black/25"
            >
              <option value="last-seen">Radenie: last seen</option>
              <option value="audit-count">Radenie: audit count</option>
              <option value="fit-score">Radenie: fit score</option>
            </select>
            <button
              type="submit"
              className="rounded-[18px] border border-black bg-black px-5 py-3 text-sm font-medium text-white hover:bg-neutral-800"
            >
              Pouzit
            </button>
          </form>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="glass-panel rounded-[28px] p-6">
            <div className="text-[11px] uppercase tracking-[0.22em] text-neutral-500">Tracked domains</div>
            <div className="mt-3 text-4xl font-semibold tracking-[-0.05em] text-neutral-950">
              {leads.length}
            </div>
          </div>
          <div className="glass-panel rounded-[28px] p-6">
            <div className="text-[11px] uppercase tracking-[0.22em] text-neutral-500">Hot leads</div>
            <div className="mt-3 text-4xl font-semibold tracking-[-0.05em] text-neutral-950">
              {leads.filter((lead) => lead.is_hot_lead).length}
            </div>
          </div>
          <div className="glass-panel rounded-[28px] p-6">
            <div className="text-[11px] uppercase tracking-[0.22em] text-neutral-500">Returning interest</div>
            <div className="mt-3 text-4xl font-semibold tracking-[-0.05em] text-neutral-950">
              {leads.filter((lead) => lead.is_returning_interest).length}
            </div>
          </div>
        </div>

        <section className="glass-panel overflow-hidden rounded-[32px]">
          <div className="border-b border-black/8 px-6 py-5">
            <h2 className="text-xl font-semibold tracking-[-0.03em] text-neutral-950">Lead rollup</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-black/[0.03] text-neutral-500">
                <tr>
                  <th className="px-6 py-4 font-medium">Domena</th>
                  <th className="px-6 py-4 font-medium">Audit count</th>
                  <th className="px-6 py-4 font-medium">Fit score</th>
                  <th className="px-6 py-4 font-medium">Odporucany typ</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium">Last seen</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => (
                  <tr key={lead.normalized_domain} className="border-t border-black/6 align-top">
                    <td className="px-6 py-5">
                      <div className="font-medium text-neutral-950">{lead.normalized_domain}</div>
                      <div className="mt-1 max-w-md text-xs leading-5 text-neutral-500">
                        {lead.last_summary}
                      </div>
                    </td>
                    <td className="px-6 py-5 text-neutral-800">{lead.audit_count}</td>
                    <td className="px-6 py-5 text-neutral-800">{lead.last_fit_score}/10</td>
                    <td className="px-6 py-5">
                      <div className="flex flex-wrap gap-2">
                        {(lead.last_recommended_ai_type ?? []).map((item) => (
                          <LeadBadge key={`${lead.normalized_domain}-${item}`}>{item}</LeadBadge>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <StatusPills
                        isHotLead={lead.is_hot_lead}
                        isHighFit={lead.is_high_fit}
                        isReturningInterest={lead.is_returning_interest}
                      />
                    </td>
                    <td className="px-6 py-5 text-neutral-800">{formatDateTime(lead.last_seen)}</td>
                  </tr>
                ))}
                {leads.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-neutral-500">
                      Zatial ziadne leady pre zvoleny filter.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>

        <section className="glass-panel overflow-hidden rounded-[32px]">
          <div className="border-b border-black/8 px-6 py-5">
            <h2 className="text-xl font-semibold tracking-[-0.03em] text-neutral-950">Posledne audity</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-black/[0.03] text-neutral-500">
                <tr>
                  <th className="px-6 py-4 font-medium">Cas</th>
                  <th className="px-6 py-4 font-medium">Domena</th>
                  <th className="px-6 py-4 font-medium">Web</th>
                  <th className="px-6 py-4 font-medium">Fit</th>
                  <th className="px-6 py-4 font-medium">Typ webu</th>
                  <th className="px-6 py-4 font-medium">Referrer</th>
                </tr>
              </thead>
              <tbody>
                {recentAudits.map((audit) => (
                  <tr key={audit.id} className="border-t border-black/6 align-top">
                    <td className="px-6 py-5 text-neutral-800">{formatDateTime(audit.created_at)}</td>
                    <td className="px-6 py-5">
                      <div className="font-medium text-neutral-950">{audit.normalized_domain}</div>
                      <div className="mt-1">
                        <StatusPills
                          isHotLead={false}
                          isHighFit={audit.fit_score >= 8}
                          isReturningInterest={false}
                        />
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <a
                        href={audit.input_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-neutral-900 underline decoration-black/20 underline-offset-4"
                      >
                        {audit.input_url}
                      </a>
                    </td>
                    <td className="px-6 py-5 text-neutral-800">{audit.fit_score}/10</td>
                    <td className="px-6 py-5 text-neutral-800">{audit.site_type}</td>
                    <td className="px-6 py-5 text-neutral-500">{audit.referrer || "Direct / nezname"}</td>
                  </tr>
                ))}
                {recentAudits.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-neutral-500">
                      Zatial nebol ulozeny ziaden audit.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
