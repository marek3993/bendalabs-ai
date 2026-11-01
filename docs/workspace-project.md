# Tento repozitár vo Workspace

Projekt **BendaLabs AI** otvor na https://bendalabs.sk/workspace?project=bendalabs-ai. Slug je `bendalabs-ai`. Existujúci projekt `bendalabs-arm` zostáva samostatnou dokumentáciou robotickej ruky.

Workspace obsahuje prehľad produkcie, konfiguráciu bez tajomstiev, pravidlá spolupráce, pôvodné technické dokumenty s odkazmi na commity, otvorené úlohy a záznam overenia pripojenia. Dokumenty sú súkromné; tento verejný repozitár obsahuje iba pokyny na používanie.

## Nový chat

```text
Načítaj get_project_context pre bendalabs-ai, dočítaj relevantné dokumenty a skontroluj otvorené úlohy. Over stav aktuálnej pracovnej kópie oproti produkcii. Prevezmi úlohu, pracuj v rozsahu zadania, zapisuj s expected_revision a na konci ulož handoff s dôkazmi a ďalším krokom.
```

MCP klient potrebuje vlastné OAuth pripojenie a prístup k projektu `bendalabs-ai`. Ak vidí iba robotickú ruku, jeho projektový rozsah ešte nezahŕňa tento repozitár. Vlastník musí povoliť nový projekt; verejný BendaLabs účet oprávnenie neposkytuje. Pri novom pripojení je predvolené iba čítanie; pre zápis musí používateľ výslovne vybrať čítanie a zápis.

Samostatné návody: [ChatGPT](workspace-chatgpt.md), [Claude](workspace-claude.md), [lokálny Codex](workspace-codex.md). Pri ich príkladoch pracuj s projektom `bendalabs-ai`. Už nastavený lokálny server `bendalabs-workspace` nepridávaj druhýkrát. Nový chat môže byť potrebný na načítanie nástrojov; zoznam projektov sa kontroluje na serveri pri každom volaní.

Otestuj zoznam projektov → kontext → dokument → skúšobný zápis → načítanie novej revízie. Plnú kompatibilitu medzi klientmi potvrdzuje až čítanie tej istej revízie druhým skutočným klientom. Zapíš presný výsledok; samotná konfigurácia alebo existencia pripojenia test nenahrádza.

## Stav pripojenia projektu

K 1. 11. 2026 je projekt vytvorený v produkčnom Workspace. Je prístupný vlastníkovi a jeho trom existujúcim samostatným pripojeniam ChatGPT, Claude a lokálneho Codexu. Prístup ku konkrétnemu projektu a oprávnenie zápisu sa stále kontrolujú na serveri.

Aktuálny MCP konektor, v audite označený ako ChatGPT, naživo načítal kontext a dokument, zapísal druhú revíziu a načítal históriu. Overená je aj idempotencia, odmietnutie zastaranej revízie a vyhľadávanie slovenského výrazu bez diakritiky aj technických názvov. Podrobný výsledok a identifikátory sú uložené v súkromnom projekte.

Krížový test novej revízie cez skutočný Claude a samostatného lokálneho Codexu je **zatiaľ neoverený**; eviduje ho úloha BL-AI-002. Všeobecné návody vyššie zachytávajú stav pri pôvodnom vydaní; tento záznam spresňuje dnešný test pre projekt `bendalabs-ai`.
