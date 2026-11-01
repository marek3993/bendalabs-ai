# Záznam vydania — 1. 11. 2026

Workspace bol nasadený cez [PR #10](https://github.com/marek3993/bendalabs-ai/pull/10), produkčný commit `73baf575ec344b97a756b79d0ecb513ca0a3b2c7`. Adresa: https://bendalabs.sk/workspace. Vlastník sa prihlási používateľom `marek` a existujúcim heslom administrácie BendaLabs.

Na Vercel stagingu aj na produkčnej doméne prešiel skutočný tok Next → Edge → Supabase: dva samostatné MCP SDK klienty načítali projekt a dokument, zapísali zmenu a nezávisle overili revíziu. Overené boli projektové rozsahy, odmietnutie zápisu čítacieho pripojenia, idempotencia, súbežný konflikt, slovenský/technický fulltext, súkromná skutočná Storage príloha, jej export a obnova v izolovanom PostgreSQL, archivácia a revokácia. Testy používali samostatné skúšobné projekty pod existujúcim vlastníkom; žiadny nový používateľ nedostal prístup. Skúšobné pripojenia boli odvolané a skúšobné členstvá odstránené.

Naživo sa overila dostupnosť hlavnej stránky, administrácií, Life, automatizácie, robotics a anglickej verzie. Bez prihlásenia Workspace zobrazí iba prihlásenie; súkromné dáta nie sú v sitemap ani vo verejnom cache. Zápisy produkčných leadov/kampaní sa netestovali odosielaním skutočných formulárov.

V izolovaných testoch prešli používateľské role, RLS hranica, história/obnova, OAuth/PKCE a súhlas v prehliadači, editor, bezpečný Markdown, obľúbené/uložené filtre, desktop/mobile, existujúce frontendové kontrakty, Life, leads, inbox a LeadPilot. Build, lint a audit produkčných závislostí prešli; `npm audit --omit=dev` hlásil 0 zraniteľností. Prihlásenie skutočného vlastníka jeho heslom nebolo vykonané; identický prihlasovací tok bol overený syntetickým heslom v izolovanom prehliadači.

Prvý import porovnal dostupné kópie a zachoval originál, zdroje, historické verzie, tvrdenia s dôkazmi a samostatný YouTube denník. Opakovaný živý import nezmenil počet dokumentov ani revízií. Súkromný prehľad snímky a hashe sú iba v `private-workspace/import/review.json`, mimo Gitu a Vercel uploadu. Súbory ruky sa nemenili.

Skutočné klienty **ChatGPT, Claude a lokálny Codex: zatiaľ neoverené**. Zostáva ich jednorazové pripojenie používateľom a krížový test podľa [API návodu](workspace-api.md#akceptačný-test-klienta). Inštalačné postupy: [ChatGPT](workspace-chatgpt.md), [Claude](workspace-claude.md), [Codex](workspace-codex.md). Jadro je nezávislé od poskytovateľa AI.

Export je projektový ZIP vrátane histórie a príloh. Obnova testovacích dát bola vykonaná; havarijná obnova celej produkcie a nastavenie pravidelnej externej retencie zostávajú prevádzkovými krokmi podľa [návodu](workspace-operations.md#export-a-zálohovanie).
