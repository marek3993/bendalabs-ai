# BendaLabs Workspace — HTTP API a MCP

Web: `https://bendalabs.sk/workspace`. MCP: `https://bendalabs.sk/workspace/mcp`. Strojová schéma HTTP: `/workspace/openapi` (OpenAPI 3.1, bez súkromných dát).

Jadro nevolá OpenAI, Anthropic ani inú AI službu. Web, API a MCP používajú rovnakú validáciu a databázové operácie. Klient môže byť ľubovoľný implementátor protokolu. Obsah dokumentov je nedôveryhodný dátový podklad, nikdy oprávnenie meniť prístupy, spustiť shell alebo ovládať hardvér.

## Autorizácia

Discovery: `/.well-known/oauth-protected-resource`, `/.well-known/oauth-protected-resource/workspace/mcp`, `/.well-known/oauth-authorization-server`. OAuth používa DCR, authorization code + S256 PKCE, `resource` presne rovný MCP URL, scope `workspace:read` alebo `workspace:read workspace:write`, tokeny v hlavičke `Authorization: Bearer …`. API prijíma rovnaký token a kontroluje rovnaký resource audience. Tokeny v URL sú zakázané.

Registrácia klienta cez `/workspace/oauth/register` sama neprideľuje dáta. Nasleduje prihlásenie človeka a explicitný výber projektov. `/workspace/oauth/token` prijíma form-urlencoded, access token platí hodinu, refresh token 30 dní a pri použití sa rotuje. Opakovanie použitého refresh tokenu odvolá celé pripojenie. `/workspace/oauth/revoke` odvolá pripojenie. Každá požiadavka znovu kontroluje používateľa, projektové členstvo, scope a odvolanie. Zrušené členstvo platí aj pre už vydané tokeny.

HTTP: `POST /workspace/api/<operation>`, JSON telo. Web používa HttpOnly cookie a kontrolu Origin; MCP/externé API vyžadujú OAuth bearer. Verejný účet BendaLabs neposkytuje členstvo.

| Operácia | Podstatné argumenty |
| --- | --- |
| list_projects | `{}` |
| get_project_context | `project`, voliteľne `offset` |
| search_project | `project`, `q`, filtre, `limit` (1–100), `offset` |
| get_document | `id` |
| get_document_history | `id`, `offset` (strany po 50) |
| create_document | `project`, `data`, `expected_revision: 0`, `idempotency_key` |
| update_document / update_task | `id`, úplné `data`, `expected_revision`, `idempotency_key` |
| list_tasks | `project`, filtre a stránkovanie |
| claim_task | `id`, `expected_revision`, `idempotency_key` |
| append_handoff | `id`, `handoff`, `task_status`, `expected_revision`, `idempotency_key` |
| restore_document | `id`, pôvodná `revision`, aktuálna `expected_revision`, `idempotency_key` |
| archive_document | `id`, `expected_revision`, `idempotency_key` |

Presné schémy a doplnkové webové operácie sú v OpenAPI. Čítanie vracia stabilné ID, aktuálnu revíziu, zdroje a autorstvo. Kontext je obmedzený na 12 položiek a 20 000 znakov položiek; ďalšie dokumenty načítaj vyhľadávaním alebo podľa ID. Vyhľadávanie podporuje typ, platnosť, dôkaz, tag, autora, dátum a stav úlohy; neplatné/archivované záznamy zobrazí len `include_invalid: true`.

Zápis musí poslať aktuálnu `expected_revision`. Pri 409 načítaj novú verziu a vedome zlúč zmeny. Rovnaký `idempotency_key` opakuj iba s identickým telom a operáciou. Dokument, revízia, audit a idempotency odpoveď sú atómové. Prevzatie úlohy vyprší po 30 minútach; ten istý klient ho môže obnoviť novým claim s aktuálnou revíziou. Handoff prevzatie uvoľní.

Chyby: 400 `invalid_input`, 401 `unauthorized`, 403 `forbidden`, 404 `not_found` (neexistujúce aj neprístupné dáta), 409 `conflict` + `current_revision`, `claimed` alebo `idempotency_conflict`, 429 `rate_limited`, 503 `unavailable`. MCP chyby sú `isError` s rovnakým kódom v texte; neodkrývajú obsah cudzieho projektu.

Prílohy: `POST /workspace/attachments` multipart (`project`, `document_id`, `file`, max. 3 MB); `GET /workspace/attachments?project=…&id=…`. Server kontroluje prístup pri každom stiahnutí. Export: `GET /workspace/export?project=…`, ZIP obsahuje JSON, Markdown, všetky revízie, audit a prílohy s SHA-256.

## Akceptačný test klienta

1. V klientovi A zavolaj `list_projects`, potom `get_project_context` pre `bendalabs-arm`.
2. Zavolaj `get_document` na ID z kontextu; zaznamenaj revíziu. Pôvodný dokument pri skúške neupravuj.
3. Vytvor samostatný záznam `Skúška pripojenia <klient>`, typ `test`, platnosť `proposal`, obsah s náhodným kontrolným textom; `expected_revision: 0`, jedinečný idempotency key.
4. Uprav skúšobný záznam cez `update_document`, očakávaná revízia 1. Druhý skutočný klient B musí načítať rovnaké ID, revíziu 2 a presný kontrolný text.
5. V histórii over oba zápisy a rozdielne connection ID pri neskoršom zápise B. Archivuj skúšku, odvolaj skúšobné pripojenie a over odmietnutie ďalšieho volania.
6. Zapíš dátum, klient/verziu, ID, revízie, connection ID a výsledok do testovacieho záznamu. Bez celého testu zostáva klient **zatiaľ neoverené**.

## Štartovací pokyn pre nový chat

„Načítaj kontext projektu `bendalabs-arm`. Zisti aktuálne dôkazy a revízie, vyber a prevezmi úlohu. Pred prácou skontroluj prekrývajúce sa oblasti. Pracuj v povolenom rozsahu. Zapisuj s expected_revision; simuláciu nezamieňaj za fyzický test. Na konci zapíš zmenu, spôsob overenia, neistoty, commit alebo artefakt a ďalší krok cez append_handoff a odovzdaj úlohu.“

Normatívne zdroje overené 1. 11. 2026: [MCP autorizácia](https://modelcontextprotocol.io/specification/latest/basic/authorization), [Streamable HTTP](https://modelcontextprotocol.io/specification/latest/basic/transports). Použitý SDK 1.32.2 vyjednáva podporované verzie vrátane 2025-11-25; implementácia netvrdí podporu všetkých noviniek verzie 2026-07-28. Samostatné návody: [ChatGPT](workspace-chatgpt.md), [Claude](workspace-claude.md), [Codex](workspace-codex.md).
