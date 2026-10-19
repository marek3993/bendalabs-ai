# BendaLabs LeadPilot

`/admin/leads` is now a private opportunity workspace for real paid automation requests and recent inbound forms. Old audit rollups and crawler failures are no longer rendered as leads. Their underlying data and existing public audit APIs are preserved.

## Discovery and evidence

- Two discovery slots per Bratislava calendar day: **06:00 and 13:30**. Manual **Vyhľadať dopyty** shares these slots (before 13:30 it uses the morning slot, afterwards the afternoon slot). A unique database key atomically prevents duplicate concurrent paid searches. The cron endpoint remains disabled until production scheduling is explicitly activated.
- The cycle reads recent n8n Jobs topics and uses the existing OpenAI Responses web-search integration to locate original requests on approved demand portals. SK/CZ requests are prioritized; worldwide English remote work is included.
- Search results locate URLs only. Original pages are fetched separately. n8n uses post #1 and its publication date, not seller replies or topic activity. Unknown dates go to review. Inaccessible pages are reported and never become fabricated leads.
- At most six new requests are analyzed per cycle: a daily maximum of two web-search calls and twelve analyses from discovery, not a fixed monetary budget. Duplicates skip AI analysis. OpenAI clients have timeouts and automatic retries disabled. Manual URL imports are user-triggered and incur an additional analysis only for a new eligible URL.
- A demand excerpt must occur in the source text. A quoted buyer budget is retained verbatim; it is separate from our implementation estimate. Location stays unknown without source support.
- The current queue requires a publication date within 14 days, a source fetch within 3 days, verified demand, and an unresolved lifecycle state. Reverification fetches the source again without a paid model call. Closed or unsupported requests leave the active queue.

## Proposals and workflow

AI prepares a limited first stage, requirements, solution, assumptions, exclusions, clarification questions and effort/delivery ranges. The default **working** rate is EUR 35/h; the admin can edit it per proposal. These are draft estimates, not fixed contractual commitments. API/hosting expenses are separate. The response is prepared in the request's language, with price and conditional delivery calculated by the application.

Statuses: new, review, proposal, sent, won, lost, archived. Copying a draft does not mark it sent. There is no message-sending endpoint.

The default `/admin/leads` screen is the independent form inbox. It reads all submissions from the existing contact table without date or identity exclusions, paginates in groups of 50, labels possible test emails, and refreshes once a minute while visible. Form messages retain campaign information when supplied. A contact-storage failure displays an error rather than an empty inbox. The inbox does not query LeadPilot tables, so discovery failures cannot hide incoming submissions.

LeadPilot remains available at `/admin/leads?view=leadpilot`. Its discovery logic, scheduling, opportunity views and recent-contact summary are unchanged. Use the top-level **Odpovede z formulárov** link for the complete inbox.

## Storage and access

Production uses the existing `bendalabs-leads` authenticated Edge Function and dedicated `bendalabs_*` tables in the active Supabase project. `supabase/bendalabs-leadpilot.sql` adds only opportunities and discovery runs. RLS is enabled; anon/authenticated grants are revoked. Only the server can read/write. The bridge permits PATCH only for one UUID in these two new tables and only for explicit editable fields. It still rejects contact/audit updates and all deletes.

The admin API requires the existing admin session and matching Origin/Host/protocol. API keys and full source snapshots are never passed into client props. Empty states contain no synthetic customers.

## Configuration

Existing `ADMIN_LEADS_PASSWORD`, `BENDALABS_LEADS_URL`, `BENDALABS_LEADS_KEY` and `OPENAI_API_KEY` are reused. Direct Supabase mode remains supported with the same logical table names. Optional `LEADPILOT_MODEL` and `LEADPILOT_HOURLY_RATE` override the existing model and working rate.

## Production schedule activation

1. Use the existing Vercel project **bendalabs-ai** (`prj_3oAeFRh0Ux5OGQRURM8Z8a7U3yBz`), team `team_FNkBuQ61bp6D3e10EFyooPuo`. Check the plan first: Vercel **Pro/Enterprise** supplies minute-level delivery; **Hobby does not** and can invoke up to 59 minutes late. Do not buy an upgrade without the owner's instruction.
2. Set a cryptographically random server-only `CRON_SECRET` (at least 32 random bytes) as a production Secret. Preserve an existing secret if another job relies on it; never print credentials. Set `LEADPILOT_SCHEDULE_ENABLED=true` only when a scheduler is installed and verified. These settings require a new production deployment.
3. On Pro/Enterprise, `vercel.json` registers four daily UTC callbacks: 04:00/05:00 and 11:30/12:30. The endpoint converts real time to `Europe/Bratislava` and accepts only 06:00–06:14 or 13:30–13:44. In either season, two callbacks perform discovery and two safely skip without touching storage or AI. This preserves the requested local times across DST; the tolerance is for scheduler delays, not a claim of exactly-on-time delivery.
4. On Hobby, remove **only these four** Vercel cron entries and use the existing OVH VPS as scheduler instead. Install a dedicated `bendalabs-leadpilot` systemd timer with two timezone-aware `OnCalendar` expressions (`*-*-* 06:00:00 Europe/Bratislava` and `*-*-* 13:30:00 Europe/Bratislava`), `AccuracySec=1s`, no randomized delay and no persistent catch-up. Its oneshot service calls the same HTTPS GET endpoint with bearer authentication and a 320-second client timeout. Keep the generated secret in a root-readable file, not command arguments or logs; disable retries and do not modify the boss's LeadPilot, trading research, Docker services or timers. Verify next firings with `systemd-analyze calendar` and `systemctl list-timers`. There must be one scheduler only.
5. Verify missing/wrong bearer => 401, disabled or outside schedule => safe skipped response, and scheduled invocation => a saved run with a `YYYY-MM-DD@06:00` or `YYYY-MM-DD@13:30` key. No database migration is needed; the existing `run_key` accepts the new format. A previous daily run consumes its corresponding slot during rollout. Repeated/parallel calls and failed-slot retries reuse the same run without extra paid discovery.
6. Verify the first real automatically triggered run in function logs and `bendalabs_leadpilot_runs` at the next scheduled time. A deploy marked READY or an out-of-window skipped response does **not** prove the scheduler executed. Do not claim activation before scheduler registration and credentials are verified.

The endpoint `/api/cron/leadpilot` is separate from the admin session/CSRF endpoint. It checks bearer authentication even for the cron user-agent, returns counts only with `Cache-Control: no-store`, and skips preview deployments. The admin shows the planned times only when the activation flag and secret are configured; actual delivery is established by the timestamp/status of the last run. This is data collection, not a notification schedule; no unsolicited reports or responses are sent.

## Validation

Build first, then run `npm run test:inbox`, `npm run test:leadpilot` and `npm run test:leads`. `scripts/check-leadpilot.cjs` starts a production Next server with isolated mock storage; verifies auth, CSRF, persistence, current/old queues, test exclusion, storage errors, and desktop/mobile rendering. It makes no paid AI calls. Set `CHROME_PATH` to an installed Chromium executable, or install the Playwright browser locally.

The existing short automation form remains covered by `node scripts/check-automation.cjs --api-only`.
