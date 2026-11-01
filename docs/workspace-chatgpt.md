# Pripojenie ChatGPT

Stav: **zatiaľ neoverené v skutočnom ChatGPT**. Integračný test dvoch nezávislých MCP SDK klientov prešiel; nenahrádza test ChatGPT.

1. Otvor [ChatGPT Plugins](https://chatgpt.com/plugins). Stlač plus → **Add custom MCP server**. Dostupnosť riadia oprávnenia tvojho účtu alebo organizácie.
2. Názov: `BendaLabs Workspace`. URL: `https://bendalabs.sk/workspace/mcp`. Transport je Streamable HTTP.
3. Vyber OAuth. Klient používa dynamickú registráciu (DCR), verejného klienta bez spoločného client secret a S256 PKCE. Heslo BendaLabs ani administrátorský kľúč nevkladaj do nastavení konektora či chatu.
4. Dokonči **Create as a plugin** a prihlásenie na BendaLabs. Používateľ je `marek`, heslo je existujúce heslo administrácie BendaLabs. V súhlase pomenuj pripojenie `ChatGPT — Marek`, vyber iba požadované projekty a skontroluj čítanie/zápis.
5. Nainštaluj výsledný súkromný plugin, v novom chate ho vyber cez `@`. Nezverejňuj ho do verejného katalógu. Zmena nástrojov vyžaduje **Refresh** a nový chat.
6. Vykonaj [akceptačný test](workspace-api.md#akceptačný-test-klienta). Až po kontrole novej revízie z Claude alebo Codexu zmeň stav kompatibility na overený.

Prístup odvoláš v BendaLabs Workspace → Nastavenia → AI pripojenia → Odvolať. Samotné odstránenie pluginu z chatu nenahrádza serverové odvolanie.

Aktuálny postup overený v oficiálnej dokumentácii 1. 11. 2026: [pripojenie a testovanie](https://developers.openai.com/plugins/deploy/connect-chatgpt), [OAuth autorizácia](https://developers.openai.com/plugins/build/auth). Staršie návody s prepínačom Developer mode nemusia zodpovedať dnešnému rozhraniu.
