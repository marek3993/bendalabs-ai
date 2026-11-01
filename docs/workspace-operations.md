# Prevádzka, import a obnova

## Existujúca infraštruktúra

Next.js projekt `bendalabs-ai`, Vercel tím `mareks-projects-6d793694`. Produkčná vetva je `main`; pracovná vetva `codex/bendalabs-workspace-20261101` začína na produkčnom commite `fbc1f4db75014704e44cc765f1ef01833e4fb144`. Ostatné pracovné kópie zostávajú nedotknuté.

Workspace používa už využívaný Supabase projekt a samostatnú schému `bendalabs_workspace`, Edge Function `bendalabs-workspace` a súkromný bucket rovnakého mena. RLS je zapnuté na všetkých 14 tabuľkách. Anon/authenticated nemajú schémové, tabuľkové ani RPC granty; všetky politiky pre priamy prístup sú deny-by-default. Členstvo kontroluje RPC po serverovom overení tokenu. Service role je výlučne v Edge prostredí. Supabase advisor preto hlási informačné „RLS Enabled No Policy“ — ide o zámer pri serverovej prístupovej vrstve, nie o verejný prístup. [Význam hlásenia](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy).

Používateľ `marek` je explicitný vlastník prvého projektu. Prihlási sa existujúcim heslom administrácie. Ďalšie účty a členstvo pridáva vlastník v Nastaveniach; žiadny nový účet nebol automaticky oprávnený. Členovia majú vlastné scrypt heslá. Produkčná zmena hesla vlastníka zneplatní jeho webové relácie; AI pripojenia sa odvolávajú samostatne.

## Konfigurácia

Existujúce serverové `BENDALABS_LEADS_URL`, `BENDALABS_LEADS_KEY`, `ADMIN_LEADS_PASSWORD` sa využijú bez novej služby. Cesta bridge sa nahradí na `bendalabs-workspace`. Voliteľné `WORKSPACE_STORAGE_URL`, `WORKSPACE_OWNER_PASSWORD`, `WORKSPACE_ORIGIN` umožňujú samostatné staging nastavenie. Edge môže použiť `BENDALABS_WORKSPACE_KEY_SHA256` pri rotácii bridge kľúča. Tajomstvá nesmú mať prefix NEXT_PUBLIC, byť v URL, logoch ani v Gite.

Na produkcii je issuer `https://bendalabs.sk`; preview používa svoj VERCEL_URL. Nepriraďuj testovaciemu issueru produkčnú doménu. Iné povolené webové MCP originy možno explicitne pridať cez `WORKSPACE_MCP_ALLOWED_ORIGINS` (čiarkou oddelené presné originy). Backend klient bez Origin stále potrebuje platný OAuth token.

Migrácie aplikuj v poradí z `supabase/migrations/*bendalabs_workspace*.sql`. Sú aditívne; neupravujú existujúce leady, Life, LeadPilot ani tabuľky iných projektov. Edge nasadenie má `verify_jwt=false`, pretože používa vlastné overenie bridge kľúča a následné overenie každého používateľského tokenu. Bez správneho bridge kľúča odmietne požiadavku.

## Reprodukovateľné overenie

```powershell
npm ci
npm run test:workspace
npm test
npm run test:life
npm run test:leads
npm run build
npm run test:workspace:e2e
```

E2E používa syntetické identity, skutočný Edge handler a izolovaný PostgreSQL cez PGlite. Nečíta produkčné tajomstvá. Testuje OAuth/PKCE, dva samostatné MCP SDK klienty, zápis a nezávislé načítanie revízie, revokáciu, súbeh, prílohy, export/obnovu a prehliadač. Výsledky a screenshoty sú v systémovom temp priečinku. Test protokolu nie je potvrdená kompatibilita konkrétneho poskytovateľa.

Regresné `test:inbox` a `test:leadpilot` používajú vlastné testovacie úložisko. Na Windows pri Edge vynechaj linuxové single-process parametre. Pri realizácii sa ich výstup presmeroval do systémového temp bez zmeny produkčného kódu.

## Import

```powershell
npm run workspace:import -- C:/Projects/BendaLabsArm C:/Projects/BendaLabs-workspace/private-workspace/import
```

Skript porovná všetky nájdené zdroje. Pri novšej kópii alebo rozdielnom obsahu rovnakej revízie skončí chybou. Po vecnom porovnaní možno štvrtým argumentom potvrdiť SHA-256 kanonickej kópie. Výstup `review.json`, `records.json` a očíslované SQL balíky zostáva súkromný, vylúčený z Gitu aj Vercel uploadu. Spúšťaj iba počet balíkov uvedený v aktuálnom review; staršie súbory po predchádzajúcom behu nemusia patriť do nového importu.

Balíky aplikuj cez autorizované Supabase SQL v číselnom poradí. Každý používa rovnakú RPC transakciu, identifikovaný dočasný importný prístup a stabilný source_key. Rovnaký obsah nevytvorí duplicitný dokument/revíziu. Originál, sekcie, historické kópie a YouTube denník sa zachovajú. Rovnaká historická kópia z viacerých ciest má jeden záznam s viacerými zdrojmi. Súhrnný dokument má zmiešané dôkazy; zostáva NEZNÁME, jednotlivé tvrdenia majú vlastné stavy a pôvodné značky. HW sa importuje ako citovaný report, nie nový fyzický test. Dátum snímky nie je dátum nového merania. Import nemení zdrojový projekt ruky ani historické formulácie.

## Export a zálohovanie

Export v Nastaveniach je ZIP s project.json, aktuálnym Markdownom, všetkými revíziami, auditom, väzbami a binárnymi prílohami overenými SHA-256. Neobsahuje heslá ani tokeny. Samotný Markdown bez ZIP nie je úplná projektová záloha; projektový ZIP nie je záloha celej prístupovej infraštruktúry.

```powershell
npm run workspace:restore -- C:/Projects/BendaLabs-workspace/private-workspace/projekt.zip
```

Príkaz obnoví export do čistej dočasnej PostgreSQL databázy, overí ID, obsah, revízie, audit a bajty príloh; vráti aj nevyriešené odkazy na iné projekty. Neprideľuje oprávnenia ani neprepíše produkciu. Obnova testovacieho ZIP bola vykonaná v E2E.

Pre havarijnú obnovu zachovaj existujúce Supabase databázové zálohy/PITR podľa tarify a samostatné kópie bucketu — databázová záloha sama neobsahuje súbory Storage. Pravidelne ulož projektové ZIP do existujúceho súkromného zálohovacieho úložiska mimo hostingu, s kontrolou hashov a retenciou. Nový platený backup produkt ani plánovač nebol bez potreby zavedený. Obnovuj najprv do izolovaného projektu; aplikuj schému, obnov dáta a súbory, skontroluj hashe, RLS a členstvá, až potom prepoj aplikáciu. OAuth tokeny po havarijnej obnove odvolaj a klientov pripoj nanovo. Produkčná havarijná obnova nebola vykonaná.

## Nasadenie a návrat

Najprv migrácie a Edge, potom build/testy a Vercel staging. Git workflow pokračuje PR do main a kontrolou produkčného deploymentu. Pri návrate vráť web na predchádzajúci deployment; novú privátnu schému ponechaj, nedropuj ju. Pred ďalším pokusom skontroluj migrácie, tokeny a audit. Staging ani obyčajný úspešný build nie sú dôkaz funkčného prihlásenia či MCP klienta.
