# BendaLabs Workspace — implementácia

Základ: produkčný commit `fbc1f4db75014704e44cc765f1ef01833e4fb144`, vetva `codex/bendalabs-workspace-20261101`.

## Rozhodnutia

- Existujúci Next.js a Supabase projekt `figgfdxmlaawoqsgidyx`; izolovaná schéma a samostatná Edge Function. Existujúce tabuľky, funkcie, cron a verejný dizajn sa nemenia.
- Identita vlastníka explicitne založená v databáze; prihlasovanie vlastníka používa existujúce serverové heslo správcu. Ďalšie identity vznikajú len po pozvaní vlastníkom, s vlastným heslom a projektovým členstvom. Verejná registrácia chýba.
- Náhodné odvolateľné relácie; v databáze iba hashe tokenov. Autorizácia pri každom volaní databázovej operácie. RLS a odobraté priame granty chránia pred obídením aplikačnej vrstvy cez Data API.
- Web, dokumentované HTTP API a vzdialené MCP používajú rovnaké operácie. Jadro nevolá žiadneho poskytovateľa AI.
- OAuth authorization code + S256 PKCE, resource binding, explicitný súhlas, projektové rozsahy, samostatné odvolateľné pripojenia. Registrácia klienta sama neudeľuje prístup.
- Dokument, revízia, audit a idempotency záznam sa zapisujú v jednej transakcii. Zápis vyžaduje expected_revision.
- Importované súkromné dokumenty a exporty nepatria do Gitu ani public/. Import zachová pôvodný obsah a hash; dôkazy sa nepovýšia na fyzické overenie.

## Overenie a dodanie

- [x] Schéma, transakcie, role, súkromné prílohy
- [x] Web, editor, história, filtre, úlohy, odovzdanie
- [x] OAuth, API, MCP, revokácia
- [x] Porovnanie zdrojov a opakovateľný import
- [x] Export/obnova testovacích dát
- [x] Bezpečnostné a súbežné testy databázy a HTTP
- [x] Regresie existujúcich aplikácií a build
- [ ] Vercel staging a produkčný deployment
- [x] Samostatné návody ChatGPT, Claude, Codex

Lokálne prešli: PostgreSQL/PGlite autorizácia a transakcie, skutočný Next → Edge handler → databáza, dva MCP SDK klienty, OAuth súhlas v prehliadači vrátane loopback callbacku, revízie/súbeh/idempotencia, súkromné prílohy, ZIP a obnova, editácia a tagy, obľúbené a uložené filtre, desktop/mobile, všetky `npm test`, Life (53), leads (7), LeadPilot jednotkové testy (14), integračný inbox a LeadPilot. Externé AI volania pri regresiách sú izolované testovacie náhrady. Žiadny fyzický robotický test neprebehol.

| Klient | Stav |
| --- | --- |
| Dva nezávislé MCP SDK klienty | Overené v izolovanom E2E |
| ChatGPT | zatiaľ neoverené |
| Claude | zatiaľ neoverené |
| Lokálny Codex | zatiaľ neoverené |

Dokumentácia: [HTTP/MCP a štartovací pokyn](workspace-api.md), [ChatGPT](workspace-chatgpt.md), [Claude](workspace-claude.md), [Codex](workspace-codex.md), [prevádzka a obnova](workspace-operations.md).

Žiadny úspešný build nenahrádza integračný test. Kompatibilita klienta vyžaduje projekt → dokument → zápis → načítanie novej revízie druhým klientom. Bez tohto testu je „zatiaľ neoverené“.
