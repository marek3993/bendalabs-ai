# SI For Me · private BendaLabs workspace

`/life` is a single-owner personal workspace. It includes dated financial summaries and invoices, transaction records and budget scenarios, manual health tracking with 14/30-day trends, projects/tasks, explicit memory with revisions, conversation history, import previews, in-app reminders and a user-triggered cited web radar.

## Deployment

The Next.js route uses the existing BendaLabs deployment and server environment. No personal data or raw credential belongs in this public repository.

- `ADMIN_LEADS_PASSWORD`: existing owner password, reused only to establish an independent Life session. Optional `LIFE_PASSWORD` overrides it.
- `BENDALABS_LEADS_URL` and `BENDALABS_LEADS_KEY`: existing private bridge configuration. Life derives a separate `/bendalabs-life` endpoint. Optional `LIFE_STORAGE_URL` overrides the endpoint.
- `OPENAI_API_KEY`: existing server-side API key. Model selection: `LIFE_AI_MODEL`, then `OPENAI_MODEL`, then `gpt-5.4-mini`.
- `LIFE_ALLOWED_ORIGIN`: optional additional exact origin for a deliberately configured deployment. Canonical BendaLabs and the current Vercel deployment hostname are allowed by default.

Apply `supabase/bendalabs-life.sql` on the active project already hosting the BendaLabs bridge. Deploy `supabase/functions/bendalabs-life/index.ts` as `bendalabs-life`, with JWT verification disabled because the function authenticates the existing server bridge key itself. All tables have RLS; browser roles have no grants or RPC execution rights. The service-role credential remains inside the Edge runtime. This does not modify the leads bridge or admin authentication.

## Privacy and sessions

All page data and API routes require a database-backed opaque session. Only a hash of each random token is stored. Cookies are HttpOnly, SameSite=Lax, Secure in production and scoped to `/life`. Remembered sessions last 365 days and renew when fewer than 30 days remain on an authenticated API call. Unremembered sessions are session cookies with a 12-hour server expiry. Clearing cookies, logout, session revocation or password rotation requires login again. Login attempts are throttled persistently. Every write requires a verified same-origin request. Public marketing scripts do not render on Life; its routes are no-store/noindex and disallow framing.

Writes use database compare-and-swap with one canonical version per atomic commit. The last 50 previous states are retained privately for recovery. Browser changes never claim success before durable persistence. Exports include the user's private state. Recovery snapshots are operational backups, not a substitute for an off-site backup strategy.

## Financial rules

Amounts are integer EUR cents. Card top-ups are internal transfers, not income. Debt principal and unclassified cash withdrawals remain separate from consumption. Invoice issuance never creates received income. Unknown invoice payment stays unknown, not overdue by assumption. Historical snapshots replace partial raw-month totals; the two are never summed together. A month marked complete uses its raw records. Every transaction edit invalidates reconciliation. Because transfer account direction is not modeled yet, any internal transfers in the balance interval prevent a verified calculated account balance. Cash purchases and withdrawal movements need deliberate accounting to avoid double counting.

## AI and import

The assistant receives a bounded selection of canonical data and active memory. Clear direct requests to remember something can persist memory together with the conversation; other actions are proposals requiring confirmation. Memory edits retain revisions and can be restored. Conversation retention is the most recent 500 messages within 200,000 characters; explicit memory is independent. OpenAI calls use `store:false`; this is not a promise of zero provider retention under every account policy.

Imports accept PDF, UTF-8 CSV/TSV/TXT/Markdown up to 4 MB and present a maximum of 160 extracted records for review. Original files are not archived. Content hashes and overlapping invoice/month/transaction checks reduce duplicates; ambiguous matches are flagged and skipped. The user must check extraction against the original. Radar performs a user-triggered web search and only offers sources actually present in citation annotations; it excludes financial, health and memory context.

Paid AI calls use a durable shared in-flight lease, per-session cooldown/hour limits and a shared 150-call daily ceiling. A failed request can still consume an admission. This is a request limit, not a currency spending cap. Actual provider billing is managed in the provider account.

## Current integration boundaries

Health data is manual or imported; Ultrahuman is not connected. Reminders compute local recurring dates and appear while the workspace is open; closed-app push delivery is not configured. Financial documents are imported rather than bank-synchronized. No community/plugin marketplace, voice or Meta integration is enabled. Those are separate future extensions.

## Validation

Run `npm run test:life`, targeted ESLint, `npx tsc --noEmit --incremental false` and `npm run build`. Test the private RPC in a rollback transaction for CAS conflicts, canonical versions, session revocation, login/AI throttling and lease ownership. Verify anon/authenticated have no private table or function grants. Check logged-out page and API responses after deployment. Live model and signed-in browser checks require a configured deployment and the owner's login; mocked tests must not be represented as live provider validation.
