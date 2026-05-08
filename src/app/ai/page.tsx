import type { Metadata } from "next";
import AuditBot from "@/components/bendalabs/audit-bot";
import DivisionPageShell from "@/components/bendalabs/division-page-shell";

function AiPreviewPanel() {
  return (
    <div className="command-panel rounded-[36px] p-6 sm:p-7">
      <div className="pointer-events-none absolute inset-0">
        <div className="signal-grid absolute inset-0 opacity-50" />
        <div className="absolute -right-10 top-8 h-32 w-32 rounded-full bg-[#a7dcc3]/20 blur-3xl" />
        <div className="signal-trace-strong left-[16%] top-[26%] w-[54%] rotate-[10deg]" />
        <div className="signal-trace-strong left-[46%] top-[29%] w-[18%] rotate-[86deg]" />
        <div className="signal-node left-[14%] top-[24%] h-3 w-3" />
        <div className="signal-node left-[68%] top-[28%] h-2.5 w-2.5" style={{ animationDelay: "700ms" }} />
        <div className="signal-node left-[76%] top-[70%] h-3 w-3" style={{ animationDelay: "1300ms" }} />
      </div>

      <div className="relative z-10">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-[11px] uppercase tracking-[0.24em] text-neutral-500">AI idea triage</div>
            <div className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-neutral-950">
              Input → extraction → action
            </div>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[#96cdb4]/60 bg-[#eef8f3] px-3 py-1.5 text-[11px] font-semibold tracking-[0.2em] text-[#335c4c]">
            <span className="status-dot" />
            <span>AI READY</span>
          </div>
        </div>

        <div className="mt-6 grid gap-4">
          {[
            {
              label: "Input",
              title: "Nápad / proces",
              text: "Problém, opakovaná robota, web, formulár alebo interný systém, ktorý dnes berie čas.",
            },
            {
              label: "Extraction",
              title: "AI vyhodnotenie",
              text: "Zámer, kontext, ďalší krok, relevantné dáta a miesto, kde má automatizácia skutočný zmysel.",
            },
            {
              label: "Action",
              title: "Funkčné riešenie",
              text: "Návrh prvej fázy, prototyp a nasadenie do použiteľného pracovného toku bez zbytočného balastu.",
            },
          ].map((item, index) => (
            <div key={item.label} className="rounded-[26px] border border-[#b4ddcb]/55 bg-[linear-gradient(180deg,rgba(255,255,255,0.9),rgba(240,248,244,0.84))] p-5 shadow-[0_14px_34px_rgba(83,120,104,0.06)]">
              <div className="flex items-center gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-full border border-[#8fc7ab]/45 bg-[#edf8f2] text-[11px] font-semibold uppercase tracking-[0.18em] text-[#335c4c]">
                  {item.label}
                </div>
                {index < 2 ? <div className="pipeline-link" /> : null}
              </div>
              <div className="mt-4 text-xl font-semibold tracking-[-0.03em] text-neutral-950">{item.title}</div>
              <p className="mt-3 text-sm leading-7 text-neutral-600">{item.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ExtractionDashboard() {
  return (
    <section className="section-divider section-surface-white">
      <div className="mx-auto max-w-7xl px-6 py-16 sm:py-20">
        <div className="max-w-3xl">
          <div className="inline-flex rounded-full border border-black/10 bg-white/78 px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-neutral-600">
            Extraction dashboard
          </div>
          <h2
            className="mt-5 text-3xl font-semibold tracking-[-0.05em] text-neutral-950 sm:text-5xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Čo AI vie získať, čo klasický formulár často nezíska.
          </h2>
          <p className="mt-5 text-lg leading-8 text-neutral-600">
            Namiesto prázdnych políčok môže človek opísať potrebu vlastnými slovami. AI z toho vie vytiahnuť zámer, kontext, rozpočet, urgentnosť, kategóriu, ďalší krok alebo kvalitu leadu.
          </p>
        </div>

        <div className="mt-10 grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="extraction-card rounded-[32px] p-6 sm:p-7">
            <div className="relative z-10">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-[11px] uppercase tracking-[0.22em] text-[#456e5c]">Lead extraction</div>
                  <div className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-neutral-950">
                    AI vie čítať potrebu, nie iba polia.
                  </div>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full border border-[#97cdb5]/60 bg-[#eef8f3] px-3 py-1.5 text-[11px] font-semibold tracking-[0.2em] text-[#335c4c]">
                  <span className="status-dot" />
                  <span>EXTRACTING</span>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-2.5">
                {[
                  "intent: refinancovanie",
                  "budget: 20k-40k",
                  "priority: vysoká",
                  "context: interný systém",
                  "next step: kontakt / audit",
                  "lead quality: kvalifikovaný",
                ].map((item) => (
                  <div key={item} className="intent-chip">
                    <span className="priority-indicator" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {[
                  {
                    title: "Zámer používateľa",
                    text: "Čo sa človek naozaj snaží vyriešiť, aj keď nepoužije názov produktu alebo internú terminológiu.",
                  },
                  {
                    title: "Kontext a detaily",
                    text: "Okolnosti, ktoré krátky formulár často nezachytí, ale zásadne menia ďalší krok.",
                  },
                  {
                    title: "Urgentnosť a priorita",
                    text: "AI vie odlíšiť orientačný dopyt od časovo citlivej potreby alebo hot leadu.",
                  },
                  {
                    title: "Kvalifikovaný lead",
                    text: "Z textu sa dá odhadnúť pripravenosť, kvalita a pravdepodobnosť ďalšieho postupu.",
                  },
                  {
                    title: "Odporúčaný ďalší krok",
                    text: "Nie každý človek má ísť do rovnakého formulára. AI vie odporučiť správnu vetvu alebo kontakt.",
                  },
                  {
                    title: "Dáta pre firmu",
                    text: "Vznikajú použiteľné signály o tom, čo ľudia reálne riešia a kde sa dnes strácajú.",
                  },
                ].map((item) => (
                  <div key={item.title} className="rounded-[24px] border border-[#bbdece]/52 bg-white/76 p-5 shadow-[0_10px_24px_rgba(82,120,104,0.05)]">
                    <div className="text-lg font-semibold tracking-[-0.03em] text-neutral-950">{item.title}</div>
                    <p className="mt-3 text-sm leading-7 text-neutral-600">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="extraction-card rounded-[30px] p-6">
              <div className="text-[11px] uppercase tracking-[0.22em] text-[#456e5c]">Entity view</div>
              <div className="mt-3 text-xl font-semibold tracking-[-0.03em] text-neutral-950">Intent tags a priority signal</div>
              <p className="mt-3 text-sm leading-7 text-neutral-600">
                Vizuálny extraction layer ukazuje, že AI vie z voľného textu získať viac než klasický formulár s pár políčkami.
              </p>
              <div className="mt-5 space-y-3">
                {[
                  ["intent cluster", "hypotéka / automatizácia / interný tool"],
                  ["context capture", "web + formulár + e-mail"],
                  ["priority index", "urgent / medium / discovery"],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-[20px] border border-[#bbdece]/52 bg-white/76 px-4 py-3 text-sm text-neutral-700">
                    <div className="text-[11px] uppercase tracking-[0.18em] text-[#648575]">{label}</div>
                    <div className="mt-1 font-medium text-neutral-950">{value}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="extraction-card rounded-[30px] p-6">
              <div className="text-[11px] uppercase tracking-[0.22em] text-[#456e5c]">Action hint</div>
              <div className="mt-3 text-xl font-semibold tracking-[-0.03em] text-neutral-950">Najlepší ďalší krok nie je vždy rovnaký.</div>
              <p className="mt-3 text-sm leading-7 text-neutral-600">
                AI vie odporučiť audit, kontakt, ďalšie otázky alebo konkrétnu vetvu riešenia podľa kvality a kontextu leadu.
              </p>
              <div className="mt-5 flex flex-wrap gap-2.5">
                {["kontakt", "audit", "kvalifikácia", "návrh riešenia"].map((item) => (
                  <div key={item} className="intent-chip">
                    <span className="status-dot" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export const metadata: Metadata = {
  title: "BendaLabs AI | Praktická AI vetva BendaLabs",
  description:
    "BendaLabs AI navrhuje a stavia praktické AI riešenia pre procesy, dáta, weby, formuláre, e-maily a interné systémy.",
};

export default function AiPage() {
  return (
    <DivisionPageShell
      eyebrow="BendaLabs AI"
      title="Máte nápad, čo by AI mohla robiť za vás?"
      description="Pozrieme sa na proces, dáta, web, formuláre, e-maily alebo interný systém. Navrhneme, čo má zmysel automatizovať, čo nie, a ak to dáva biznis logiku, postavíme funkčné riešenie."
      supportingLine="Nepotrebujete technické zadanie. Stačí problém, opakovaná robota alebo tušenie, že by to mohlo ísť lepšie."
      heroChips={["Procesy", "Dáta", "Web a formuláre", "Interné systémy"]}
      primaryCtaLabel="Preveriť AI nápad"
      primaryCtaHref="#kontakt"
      secondaryCtaLabel="Spustiť AI audit webu"
      secondaryCtaHref="#audit"
      heroAside={<AiPreviewPanel />}
      sections={[]}
      middleSection={
        <>
          <ExtractionDashboard />

          <section id="audit" className="section-divider section-surface-soft">
            <div className="mx-auto max-w-7xl px-6 py-16 sm:py-20">
              <div className="mb-8 max-w-3xl">
                <div className="inline-flex rounded-full border border-black/10 bg-white/78 px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-neutral-600">
                  Najrýchlejší prvý krok
                </div>
                <h2
                  className="mt-5 text-3xl font-semibold tracking-[-0.05em] text-neutral-950 sm:text-5xl"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  AI audit webu
                </h2>
                <p className="mt-5 text-lg leading-8 text-neutral-600">
                  Audit prejde web a ukáže, kde by AI vrstva mohla pomôcť s navigáciou, lead flow, zberom dát alebo odporúčaním ďalšieho kroku.
                </p>
              </div>

              <div className="command-panel rounded-[38px] p-3 sm:p-4">
                <AuditBot
                  locale="sk"
                  variant="featured"
                  badge="● AI AUDIT WEBU"
                  title="Najrýchlejší prvý krok: AI audit webu"
                  subtext="Prejde vašu stránku a ukáže, kde by AI vrstva vedela pomôcť s navigáciou, lead flow, zberom dát alebo ďalším krokom zákazníka."
                  description="Audit ostáva živou súčasťou AI vetvy a naďalej používa existujúci lead flow, tracking aj success/error správanie."
                  trustItems={["≈ 5 sekúnd", "bez e-mailu", "bez registrácie"]}
                  explainerLine="Načíta homepage | prejde relevantné podstránky | navrhne miesta pre AI vrstvu"
                  previewIdleTitle="Zadajte URL a spustite audit"
                  previewIdleSteps={[
                    "Načíta homepage",
                    "Prejde relevantné podstránky",
                    "Vyhodnotí lead flow a navigáciu",
                    "Pripraví odporúčanie",
                  ]}
                  submitLabel="Spustiť AI audit webu →"
                  loadingSteps={[
                    "Načítavam web...",
                    "Vyhodnocujem, kde by AI vrstva vedela urýchliť výber služby...",
                    "Vyhodnocujem potenciál AI vrstvy...",
                    "Pripravujem odporúčanie...",
                  ]}
                />
              </div>
            </div>
          </section>
        </>
      }
      contactTitle="Pošlite problém, nápad alebo opakovanú robotu."
      contactDescription="Nemusíte vedieť, či ide presne o AI. Stačí opísať situáciu a pozrieme sa, či dáva zmysel audit, automatizácia alebo širšie riešenie."
      contactCardLabel="AI kontakt"
      contactMailSubject="BendaLabs AI - preveriť nápad"
    />
  );
}
