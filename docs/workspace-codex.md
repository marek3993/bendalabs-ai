# Pripojenie lokálneho Codexu

Stav: **zatiaľ neoverené skutočným klientom Codex**. Dostupnosť uvedených prepínačov bola skontrolovaná v nainštalovanom `codex mcp --help`; prihlasovanie používateľa a zápis z Codexu ešte neprebehli.

V termináli svojho počítača vykonaj:

```powershell
codex mcp add bendalabs-workspace --url https://bendalabs.sk/workspace/mcp
codex mcp login bendalabs-workspace --scopes workspace:read,workspace:write --oauth-client-registration dcr
codex mcp list
```

Otvor prihlasovaciu adresu z terminálu v prehliadači. Prihlás sa ako `marek` existujúcim heslom administrácie BendaLabs. Pripojenie pomenuj `Codex — lokálny počítač`, vyber projekt `Robotická ruka — Benda Robotics` a potvrď rozsah. Tokeny spravuje klient; nekopíruj ich do promptu ani do repozitára. Pre čítací klient použij iba `--scopes workspace:read`.

Otvor nový chat Codexu alebo obnov zoznam MCP. V terminálovom Codexe použi `/mcp`. Dokonči [akceptačný test](workspace-api.md#akceptačný-test-klienta); revíziu musí nezávisle overiť ChatGPT alebo Claude. Prítomnosť servera v zozname nie je dôkazom fungujúceho zápisu.

Odvolanie na serveri: Workspace → Nastavenia → AI pripojenia. Lokálne odhlásenie: `codex mcp logout bendalabs-workspace`. Odstránenie konfigurácie: `codex mcp remove bendalabs-workspace`.

Server poskytuje Streamable HTTP a OAuth authorization code + PKCE. Podporuje meniaci sa port `http://127.0.0.1/callback` pri zachovaní registrovaného hostiteľa, cesty a query. Inzeruje issuer-bound odpoveď `iss`. DCR je zvolená podporovaná registračná cesta; CIMD server neinzeruje.

Oficiálny zdroj overený 1. 11. 2026: [Codex MCP, OAuth a lokálne callbacky](https://learn.chatgpt.com/docs/extend/mcp?surface=cli).
