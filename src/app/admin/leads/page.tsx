import { isAdminAuthenticated, isAdminProtectionConfigured } from "@/lib/leads/auth";
import {
  getLeadRollups,
  getRecentAuditFailures,
  getRecentAudits,
  getRecentContactRequests,
} from "@/lib/leads/repository";
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

const dateTimeFormatter = new Intl.DateTimeFormat("sk-SK", {
  dateStyle: "medium",
  timeStyle: "short",
});

function safeArray<T>(value: T[] | null | undefined) {
  return Array.isArray(value) ? value.filter((item): item is NonNullable<T> => item != null) : [];
}

function safeText(value: string | null | undefined, fallback = "") {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return dateTimeFormatter.format(date);
}

function getSafeHref(value: string | null | undefined) {
  const href = safeText(value);

  if (!href) {
    return null;
  }

  try {
    return new URL(href).toString();
  } catch {
    return null;
  }
}

function formatScore(value: number | null | undefined) {
  return Number.isFinite(value) ? `${value}/10` : "-";
}

function getReferrerText(value: string | null | undefined) {
  return safeText(value, "Direct / nezname");
}

function getDomainText(value: string | null | undefined) {
  return safeText(value, "-");
}

function getSiteTypeText(value: string | null | undefined) {
  return safeText(value, "-");
}

function getAuditUrlText(value: string | null | undefined) {
  return safeText(value, "-");
}

function getLeadSourceText(value: string | null | undefined) {
  if (value === "audit_result") {
    return "Po audite";
  }

  if (value === "contact_section") {
    return "Kontakt sekcia";
  }

  return safeText(value, "-");
}

function isSyntheticCallEmail(value: string | null | undefined) {
  return safeText(value).endsWith("@bendalabs.invalid");
}

function getAuditFailureReasonText(value: string | null | undefined) {
  if (value === "crawler_blocked") {
    return "crawler_blocked";
  }

  if (value === "load_failed") {
    return "load_failed";
  }

  return safeText(value, "-");
}

function getAuditFailureClassificationText(value: string | null | undefined) {
  if (value === "crawler_blocked" || value === "fetch_blocked" || value === "protected_site") {
    return value;
  }

  return "-";
}

function formatHttpStatus(value: number | null | undefined) {
  return Number.isFinite(value) ? String(value) : "-";
}

function DateTimeValue({ value }: { value: string | null | undefined }) {
  return <>{formatDateTime(value)}</>;
}

function EmptyDash({ value }: { value: string | null | undefined }) {
  return <>{safeText(value, "-")}</>;
}

function formatLeadCount(value: number | null | undefined) {
  return Number.isFinite(value) ? value : 0;
}

function getRecommendedTypes(value: string[] | null | undefined) {
  return safeArray(value);
}

function getHighFit(value: boolean | null | undefined) {
  return value ?? false;
}

function getHotLead(value: boolean | null | undefined) {
  return value ?? false;
}

function getReturningInterest(value: boolean | null | undefined) {
  return value ?? false;
}

function getRecentAuditKey(value: string | null | undefined, fallback: string) {
  return safeText(value, fallback);
}

function formatTrackedDomainsCount(value: number | null | undefined) {
  return Number.isFinite(value) ? value : 0;
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
          Doplň `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` a spusti SQL migracie v priecinku
          `supabase/migrations`.
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

  const [leads, recentAudits, recentAuditFailures, recentContactRequests] = await Promise.all([
    getLeadRollups({ query, sort, status }),
    getRecentAudits({ query, limit: 25 }),
    getRecentAuditFailures({ query, limit: 25 }),
    getRecentContactRequests({ query, limit: 25 }),
  ]);
  const leadItems = safeArray(leads);
  const recentAuditItems = safeArray(recentAudits);
  const recentAuditFailureItems = safeArray(recentAuditFailures);
  const recentContactRequestItems = safeArray(recentContactRequests);
  const leadRows = leadItems.filter((lead): lead is NonNullable<(typeof leadItems)[number]> => lead != null);
  const recentAuditRows = recentAuditItems.filter(
    (audit): audit is NonNullable<(typeof recentAuditItems)[number]> => audit != null,
  );
  const recentAuditFailureRows = recentAuditFailureItems.filter(
    (failure): failure is NonNullable<(typeof recentAuditFailureItems)[number]> => failure != null,
  );
  const recentContactRequestRows = recentContactRequestItems.filter(
    (contactRequest): contactRequest is NonNullable<(typeof recentContactRequestItems)[number]> =>
      contactRequest != null,
  );
  const trackedDomainsCount = formatTrackedDomainsCount(leadRows.length);
  const hotLeadCount = leadRows.filter((lead) => getHotLead(lead?.is_hot_lead)).length;
  const returningInterestCount = leadRows.filter((lead) =>
    getReturningInterest(lead?.is_returning_interest),
  ).length;

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
              {trackedDomainsCount}
            </div>
          </div>
          <div className="glass-panel rounded-[28px] p-6">
            <div className="text-[11px] uppercase tracking-[0.22em] text-neutral-500">Hot leads</div>
            <div className="mt-3 text-4xl font-semibold tracking-[-0.05em] text-neutral-950">
              {hotLeadCount}
            </div>
          </div>
          <div className="glass-panel rounded-[28px] p-6">
            <div className="text-[11px] uppercase tracking-[0.22em] text-neutral-500">Returning interest</div>
            <div className="mt-3 text-4xl font-semibold tracking-[-0.05em] text-neutral-950">
              {returningInterestCount}
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
                {leadRows.map((lead, index) => (
                  <tr
                    key={getRecentAuditKey(lead?.normalized_domain, `lead-${index}`)}
                    className="border-t border-black/6 align-top"
                  >
                    <td className="px-6 py-5">
                      <div className="font-medium text-neutral-950">
                        <EmptyDash value={lead?.normalized_domain} />
                      </div>
                      <div className="mt-1 max-w-md text-xs leading-5 text-neutral-500">
                        <EmptyDash value={lead?.last_summary} />
                      </div>
                    </td>
                    <td className="px-6 py-5 text-neutral-800">{formatLeadCount(lead?.audit_count)}</td>
                    <td className="px-6 py-5 text-neutral-800">{formatScore(lead?.last_fit_score)}</td>
                    <td className="px-6 py-5">
                      <div className="flex flex-wrap gap-2">
                        {getRecommendedTypes(lead?.last_recommended_ai_type).map((item, itemIndex) => (
                          <LeadBadge
                            key={`${getDomainText(lead?.normalized_domain)}-${item || `type-${itemIndex}`}`}
                          >
                            {safeText(item, "-")}
                          </LeadBadge>
                        ))}
                        {getRecommendedTypes(lead?.last_recommended_ai_type).length === 0 ? (
                          <span className="text-neutral-500">-</span>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <StatusPills
                        isHotLead={getHotLead(lead?.is_hot_lead)}
                        isHighFit={getHighFit(lead?.is_high_fit)}
                        isReturningInterest={getReturningInterest(lead?.is_returning_interest)}
                      />
                    </td>
                    <td className="px-6 py-5 text-neutral-800">
                      <DateTimeValue value={lead?.last_seen} />
                    </td>
                  </tr>
                ))}
                {leadRows.length === 0 ? (
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
                {recentAuditRows.map((audit, index) => {
                  const auditHref = getSafeHref(audit.input_url);
                  const currentAuditFitScore = audit.fit_score ?? 0;
                  const isHighFit = currentAuditFitScore >= 8;

                  return (
                    <tr
                      key={getRecentAuditKey(audit.id, `audit-${index}`)}
                      className="border-t border-black/6 align-top"
                    >
                      <td className="px-6 py-5 text-neutral-800">
                        <DateTimeValue value={audit.created_at} />
                      </td>
                      <td className="px-6 py-5">
                        <div className="font-medium text-neutral-950">
                          <EmptyDash value={audit.normalized_domain} />
                        </div>
                        <div className="mt-1">
                          <StatusPills
                            isHotLead={false}
                            isHighFit={isHighFit}
                            isReturningInterest={false}
                          />
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        {auditHref ? (
                          <a
                            href={auditHref}
                            target="_blank"
                            rel="noreferrer"
                            className="text-neutral-900 underline decoration-black/20 underline-offset-4"
                          >
                            {getAuditUrlText(audit.input_url)}
                          </a>
                        ) : (
                          <span className="text-neutral-500">{getAuditUrlText(audit.input_url)}</span>
                        )}
                      </td>
                      <td className="px-6 py-5 text-neutral-800">
                        {formatScore(currentAuditFitScore)}
                      </td>
                      <td className="px-6 py-5 text-neutral-800">
                        {getSiteTypeText(audit.site_type)}
                      </td>
                      <td className="px-6 py-5 text-neutral-500">
                        {getReferrerText(audit.referrer)}
                      </td>
                    </tr>
                  );
                })}
                {recentAuditRows.length === 0 ? (
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

        <section className="glass-panel overflow-hidden rounded-[32px]">
          <div className="border-b border-black/8 px-6 py-5">
            <h2 className="text-xl font-semibold tracking-[-0.03em] text-neutral-950">
              Posledne blokovane audity
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-black/[0.03] text-neutral-500">
                <tr>
                  <th className="px-6 py-4 font-medium">Cas</th>
                  <th className="px-6 py-4 font-medium">Domena</th>
                  <th className="px-6 py-4 font-medium">Web</th>
                  <th className="px-6 py-4 font-medium">Reason</th>
                  <th className="px-6 py-4 font-medium">Classification</th>
                  <th className="px-6 py-4 font-medium">HTTP</th>
                  <th className="px-6 py-4 font-medium">Referrer</th>
                </tr>
              </thead>
              <tbody>
                {recentAuditFailureRows.map((failure, index) => {
                  const auditFailureHref = getSafeHref(failure.input_url);

                  return (
                    <tr
                      key={getRecentAuditKey(failure.id, `audit-failure-${index}`)}
                      className="border-t border-black/6 align-top"
                    >
                      <td className="px-6 py-5 text-neutral-800">
                        <DateTimeValue value={failure.created_at} />
                      </td>
                      <td className="px-6 py-5 text-neutral-950">
                        <EmptyDash value={failure.normalized_domain} />
                      </td>
                      <td className="px-6 py-5">
                        {auditFailureHref ? (
                          <a
                            href={auditFailureHref}
                            target="_blank"
                            rel="noreferrer"
                            className="text-neutral-900 underline decoration-black/20 underline-offset-4"
                          >
                            {getAuditUrlText(failure.input_url)}
                          </a>
                        ) : (
                          <span className="text-neutral-500">{getAuditUrlText(failure.input_url)}</span>
                        )}
                      </td>
                      <td className="px-6 py-5 text-neutral-800">
                        {getAuditFailureReasonText(failure.reason)}
                      </td>
                      <td className="px-6 py-5 text-neutral-800">
                        {getAuditFailureClassificationText(failure.classification)}
                      </td>
                      <td className="px-6 py-5 text-neutral-800">
                        {formatHttpStatus(failure.http_status)}
                      </td>
                      <td className="px-6 py-5 text-neutral-500">
                        {getReferrerText(failure.referrer)}
                      </td>
                    </tr>
                  );
                })}
                {recentAuditFailureRows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-10 text-center text-neutral-500">
                      Zatial nebol ulozeny ziaden blokovany audit.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>

        <section className="glass-panel overflow-hidden rounded-[32px]">
          <div className="border-b border-black/8 px-6 py-5">
            <h2 className="text-xl font-semibold tracking-[-0.03em] text-neutral-950">
              Posledne formularove leady
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-black/[0.03] text-neutral-500">
                <tr>
                  <th className="px-6 py-4 font-medium">Cas</th>
                  <th className="px-6 py-4 font-medium">Meno</th>
                  <th className="px-6 py-4 font-medium">Email</th>
                  <th className="px-6 py-4 font-medium">Web</th>
                  <th className="px-6 py-4 font-medium">Message</th>
                  <th className="px-6 py-4 font-medium">Source</th>
                </tr>
              </thead>
              <tbody>
                {recentContactRequestRows.map((contactRequest, index) => {
                  const contactRequestHref = getSafeHref(contactRequest.website);

                  return (
                    <tr
                      key={getRecentAuditKey(contactRequest.id, `contact-request-${index}`)}
                      className="border-t border-black/6 align-top"
                    >
                      <td className="px-6 py-5 text-neutral-800">
                        <DateTimeValue value={contactRequest.created_at} />
                      </td>
                      <td className="px-6 py-5 text-neutral-950">
                        <EmptyDash value={contactRequest.name} />
                      </td>
                      <td className="px-6 py-5 text-neutral-800">
                        {isSyntheticCallEmail(contactRequest.email) ? (
                          <span className="text-neutral-500">Nezadany email (call request)</span>
                        ) : (
                          <a
                            href={`mailto:${contactRequest.email}`}
                            className="underline decoration-black/20 underline-offset-4"
                          >
                            <EmptyDash value={contactRequest.email} />
                          </a>
                        )}
                      </td>
                      <td className="px-6 py-5">
                        {contactRequestHref ? (
                          <a
                            href={contactRequestHref}
                            target="_blank"
                            rel="noreferrer"
                            className="text-neutral-900 underline decoration-black/20 underline-offset-4"
                          >
                            {getAuditUrlText(contactRequest.website)}
                          </a>
                        ) : (
                          <span className="text-neutral-500">
                            {getAuditUrlText(contactRequest.website)}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-5 text-neutral-800">
                        <div className="max-w-xl whitespace-pre-line leading-6">
                          <EmptyDash value={contactRequest.message} />
                        </div>
                      </td>
                      <td className="px-6 py-5 text-neutral-500">
                        <div>{getLeadSourceText(contactRequest.source)}</div>
                        {contactRequest.linked_audit_domain ? (
                          <div className="mt-1 text-xs text-neutral-400">
                            Audit domain: {contactRequest.linked_audit_domain}
                          </div>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
                {recentContactRequestRows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-neutral-500">
                      Zatial nebol odoslany ziaden formularovy lead.
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
