# Pripojenie Claude

Stav: **zatiaľ neoverené v skutočnom Claude**.

1. V Claude otvor **Customize → Connectors** a pridaj vlastný konektor cez URL. Názov: `BendaLabs Workspace`; URL presne `https://bendalabs.sk/workspace/mcp`.
2. Použi OAuth s automatickou registráciou. Nevypĺňaj spoločný API kľúč ani client secret. Server poskytuje DCR, S256 PKCE, discovery a rotáciu refresh tokenov.
3. Prihlás sa na BendaLabs ako `marek` existujúcim heslom administrácie. Pripojenie pomenuj `Claude — Marek`, povoľ konkrétne projekty a skontroluj rozsah čítania/zápisu.
4. Skontroluj **Connected** a zoznam nástrojov v **Tool permissions**. V novom chate zapni konektor cez **+ → Connectors**.
5. Dokonči [akceptačný test](workspace-api.md#akceptačný-test-klienta); novú revíziu musí načítať iný skutočný klient.

Claude používa Streamable HTTP. Hosted callback je `https://claude.ai/api/mcp/auth_callback`; registrácia zachová presnú adresu. Claude Code používa lokálny callback s meniacim sa portom; server podporuje presné porovnanie hostiteľa/cesty s výnimkou portu pre loopback. Discovery a token endpointy musia odpovedať do limitov klienta. Vercel Deployment Protection môže blokovať pripojenie k preview; prihlasovanie Workspace musí zostať zapnuté.

Voliteľný Claude Code:

```text
claude mcp add --transport http bendalabs-workspace https://bendalabs.sk/workspace/mcp
```

Potom spusti Claude Code, použi `/mcp` a dokonči OAuth. Pomenuj ho samostatne, napríklad `Claude Code — lokálny počítač`. Ani tento klient zatiaľ nebol reálne overený.

Odvolanie: Workspace → Nastavenia → AI pripojenia. Každé pripojenie má vlastné ID; audit zaznamenáva používateľa aj pripojenie.

Oficiálne zdroje overené 1. 11. 2026: [transport a podporované verzie](https://claude.com/docs/connectors/building), [autorizácia a callbacky](https://claude.com/docs/connectors/building/authentication), [test vlastného konektora](https://claude.com/docs/connectors/building/testing), [Claude Code MCP](https://code.claude.com/docs/en/mcp).
