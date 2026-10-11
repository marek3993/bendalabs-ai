# BendaLabs LeadPilot

`/admin/leads` is now a private opportunity workspace for real paid automation requests and recent inbound forms. Old audit rollups and crawler failures are no longer rendered as leads. Their underlying data and existing public audit APIs are preserved.

## Discovery and evidence

- Manual **Vyhľadať dopyty** runs one discovery cycle per Bratislava calendar day. A unique database run key prevents duplicate concurrent paid searches. No recurring job is enabled by this change.
- The cycle reads recent n8n Jobs topics and uses the existing OpenAI Responses web-search integration to locate original requests on approved demand portals. SK/CZ requests are prioritized; worldwide English remote work is included.
- Search results locate URLs only. Original pages are fetched separately. n8n uses post #1 and its publication date, not seller replies or topic activity. Unknown dates go to review. Inaccessible pages are reported and never become fabricated leads.
- At most six new requests are analyzed per cycle. Duplicates skip AI analysis. OpenAI clients have timeouts and automatic retries disabled. Manual URL imports are user-triggered and incur an additional analysis only for a new eligible URL.
- A demand excerpt must occur in the source text. A quoted buyer budget is retained verbatim; it is separate from our implementation estimate. Location stays unknown without source support.
- The current queue requires a publication date within 14 days, a source fetch within 3 days, verified demand, and an unresolved lifecycle state. Reverification fetches the source again without a paid model call. Closed or unsupported requests leave the active queue.

## Proposals and workflow

AI prepares a limited first stage, requirements, solution, assumptions, exclusions, clarification questions and effort/delivery ranges. The default **working** rate is EUR 35/h; the admin can edit it per proposal. These are draft estimates, not fixed contractual commitments. API/hosting expenses are separate. The response is prepared in the request's language, with price and conditional delivery calculated by the application.

Statuses: new, review, proposal, sent, won, lost, archived. Copying a draft does not mark it sent. There is no message-sending endpoint.

Recent inbound contacts use the existing contact table. Technical test identities, including the two October 6 checks, are excluded from business counts. Storage failures display errors and unknown counts rather than zero leads.

## Storage and access

Production uses the existing `bendalabs-leads` authenticated Edge Function and dedicated `bendalabs_*` tables in the active Supabase project. `supabase/bendalabs-leadpilot.sql` adds only opportunities and discovery runs. RLS is enabled; anon/authenticated grants are revoked. Only the server can read/write. The bridge permits PATCH only for one UUID in these two new tables and only for explicit editable fields. It still rejects contact/audit updates and all deletes.

The admin API requires the existing admin session and matching Origin/Host/protocol. API keys and full source snapshots are never passed into client props. Empty states contain no synthetic customers.

## Configuration

Existing `ADMIN_LEADS_PASSWORD`, `BENDALABS_LEADS_URL`, `BENDALABS_LEADS_KEY` and `OPENAI_API_KEY` are reused. Direct Supabase mode remains supported with the same logical table names. Optional `LEADPILOT_MODEL` and `LEADPILOT_HOURLY_RATE` override the existing model and working rate.

## Validation

Build first, then run `npm run test:leadpilot` and `npm run test:leads`. `scripts/check-leadpilot.cjs` starts a production Next server with isolated mock storage; verifies auth, CSRF, persistence, current/old queues, test exclusion, storage errors, and desktop/mobile rendering. It makes no paid AI calls. Set `CHROME_PATH` to an installed Chromium executable, or install the Playwright browser locally.

The existing short automation form remains covered by `node scripts/check-automation.cjs --api-only`.
