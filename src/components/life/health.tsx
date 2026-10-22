"use client";

import { useState } from "react";
import { Activity, Footprints, Heart, Moon, Pencil, Plus, Sparkles, Upload, Zap } from "lucide-react";
import { lifeToday, type LifeHealthEntry, type LifeState } from "@/lib/life/domain";
import { Empty, Metric, MiniTrend, Panel, dayLabel } from "./ui";
import type { EditorRequest } from "./record-editor";

type HealthMetric = "sleepHours" | "energy" | "hrv" | "restingHr" | "steps" | "trainingMinutes";
const metrics = [
  { key: "sleepHours", label: "Spánok", unit: "h", icon: Moon },
  { key: "energy", label: "Tvoja energia", unit: "/ 10", icon: Zap },
  { key: "hrv", label: "HRV", unit: "ms", icon: Activity },
  { key: "restingHr", label: "Pokojový tep", unit: "bpm", icon: Heart },
  { key: "steps", label: "Kroky", unit: "krokov", icon: Footprints },
  { key: "trainingMinutes", label: "Tréning", unit: "min", icon: Activity },
] as const;
const number = (value: number) => new Intl.NumberFormat("sk-SK", { maximumFractionDigits: 1 }).format(value);

function metricValues(entries: LifeHealthEntry[], metric: HealthMetric) {
  return entries.flatMap(entry => entry[metric] === null ? [] : [{ date: entry.date, value: entry[metric], source: entry.source }]);
}

export function Health({ state, edit, openImport }: {
  state: LifeState;
  edit: (request: EditorRequest) => void;
  openImport: () => void;
}) {
  const [tab, setTab] = useState<"overview" | "diary" | "habits">("overview");
  const [period, setPeriod] = useState<14 | 30>(14);
  const [diaryCount, setDiaryCount] = useState(30);
  const today = lifeToday(state.settings.timezone);
  const sorted = [...state.healthEntries].sort((a, b) => a.date.localeCompare(b.date));
  const pastEntries = sorted.filter(entry => entry.date <= today);
  const since = new Date(`${today}T00:00:00Z`);
  since.setUTCDate(since.getUTCDate() - period + 1);
  const startDate = since.toISOString().slice(0, 10);
  const periodEntries = pastEntries.filter(entry => entry.date >= startDate);
  const diary = [...sorted].reverse();
  const healthMemories = state.memories.filter(memory => memory.scope === "health");
  const addEntry = () => edit({ collection: "healthEntries" });
  const addHabit = () => edit({ collection: "memories", record: { scope: "health", active: true, source: "Moje zdravotné pravidlo" } });

  return <>
    <div className="life-heading"><div><p className="life-eyebrow">ENERGIA PRE TVOJ ŽIVOT</p><h1>Zdravie a regenerácia</h1><p>Spánok, pohyb a to, ako sa cítiš. Tvoje merania a poznámky v súvislostiach.</p></div><div className="life-actions"><button type="button" className="life-button" onClick={openImport}><Upload size={14} />Importovať</button><button type="button" className="life-button life-button-primary" onClick={addEntry}><Plus size={15} />Pridať záznam</button></div></div>
    <div className="life-tabs" role="tablist" aria-label="Zdravotné prehľady">
      {([{ id: "overview", label: "Prehľad a trendy" }, { id: "diary", label: "Denník" }, { id: "habits", label: "Návyky a kontext" }] as const).map(item => <button type="button" key={item.id} role="tab" aria-selected={tab === item.id} onClick={() => setTab(item.id)}>{item.label}</button>)}
    </div>

    {tab === "overview" ? <div className="life-stack">
      <div className="life-notice life-notice-neutral"><Heart size={15} /><span>Záznamy môžeš pridávať ručne alebo importovať. Automatické prepojenie s Ultrahuman zatiaľ nie je pripojené.</span></div>
      {pastEntries.length ? <>
        <div><div className="life-toolbar"><h2>Posledné dostupné hodnoty</h2><span className="life-subtle">Dátum a zdroj pri každej metrike</span></div><div className="life-metrics" style={{ marginBottom: 0 }}>{metrics.map(metric => {
          const latest = metricValues(pastEntries, metric.key).at(-1);
          return <Metric key={metric.key} label={metric.label} value={latest ? `${number(latest.value)} ${metric.unit}` : "—"} icon={<metric.icon size={16} />} note={latest ? `${dayLabel(latest.date)} · ${latest.source}` : "Zatiaľ bez merania"} accent={metric.key === "sleepHours"} />;
        })}</div></div>
        <div><div className="life-toolbar"><div><h2>Ako sa to vyvíja</h2><p className="life-subtle">{dayLabel(startDate)} – {dayLabel(today)}</p></div><div className="life-actions" aria-label="Obdobie trendov">{([14, 30] as const).map(days => <button type="button" key={days} className={`life-button ${period === days ? "life-button-primary" : ""}`} aria-pressed={period === days} onClick={() => setPeriod(days)}>{days} dní</button>)}</div></div>
          <div className="life-grid">{metrics.map(metric => {
            const values = metricValues(periodEntries, metric.key);
            const average = values.length ? values.reduce((sum, point) => sum + point.value, 0) / values.length : null;
            return <Panel key={metric.key} title={metric.label} action={<metric.icon size={17} color="var(--life-purple)" />}>
              <div className="life-toolbar"><span className="life-subtle">{values.length} meraní</span><span className="life-subtle">{average === null ? "Priemer nie je dostupný" : `Priemer meraní ${number(average)} ${metric.unit}`}</span></div>
              {values.length ? <MiniTrend values={values.map(point => point.value)} dates={values.map(point => point.date)} labels={values.map(point => dayLabel(point.date))} unit={metric.unit} /> : <p className="life-subtle life-chart-empty">V tomto období nemáš túto metriku zaznamenanú.</p>}
            </Panel>;
          })}</div><p className="life-subtle" style={{ marginTop: 12 }}>Každý bod je vlastné zaznamenané meranie. Chýbajúce dni sa nedopĺňajú nulou; priemer počíta merania, nie všetky dni obdobia.</p>
        </div>
      </> : <Panel><Empty title="Začni tým, ako sa dnes cítiš" description="Stačí doplniť spánok, energiu alebo krátku poznámku. Ostatné hodnoty môžeš nechať prázdne." action={<button type="button" className="life-button life-button-primary" onClick={addEntry}><Plus size={14} />Prvý zdravotný záznam</button>} /></Panel>}
    </div> : null}

    {tab === "diary" ? <Panel title="Tvoj zdravotný denník" action={<span className="life-badge">{state.healthEntries.length} záznamov</span>}>
      {diary.length ? <><div className="life-list">{diary.slice(0, diaryCount).map(entry => <div className="life-row" key={entry.id}><span className="life-row-icon"><Heart size={16} /></span><div className="life-row-main"><p>{dayLabel(entry.date)} {entry.date > today ? <span className="life-badge life-badge-amber">Budúci dátum</span> : null}</p><small>{metrics.filter(metric => entry[metric.key] !== null).map(metric => `${metric.label}: ${number(entry[metric.key]!)} ${metric.unit}`).join(" · ") || "Poznámka bez meraní"}</small>{entry.note ? <p className="life-note-body" style={{ marginTop: 9 }}>{entry.note}</p> : null}<small>Zdroj: {entry.source}</small></div><button type="button" className="life-icon-button" aria-label={`Upraviť zdravotný záznam ${dayLabel(entry.date)}`} onClick={() => edit({ collection: "healthEntries", record: entry })}><Pencil size={14} /></button></div>)}</div>{diary.length > diaryCount ? <button type="button" className="life-button" style={{ marginTop: 18 }} onClick={() => setDiaryCount(count => count + 30)}>Zobraziť ďalšie záznamy</button> : null}</> : <Empty title="Miesto pre tvoje pozorovania" description="Zapíš si tréning, energiu alebo okolnosti spánku. Všetko zostane pri príslušnom dátume." action={<button type="button" className="life-button" onClick={addEntry}><Plus size={14} />Pridať do denníka</button>} />}
    </Panel> : null}

    {tab === "habits" ? <div className="life-stack"><div className="life-toolbar"><p className="life-subtle">Tvoje ciele, preferencie a zdravotné súvislosti pre asistenta.</p><button type="button" className="life-button life-button-primary" onClick={addHabit}><Plus size={14} />Pridať pravidlo</button></div>{healthMemories.length ? <div className="life-grid">{healthMemories.map(memory => <Panel key={memory.id} title={memory.title} action={<span className={`life-badge ${memory.active ? "life-badge-purple" : ""}`}>{memory.active ? "Používa sa" : "Pozastavené"}</span>}><p className="life-memory-content">{memory.content}</p><div className="life-memory-footer"><span className="life-subtle">Verzia {memory.revision} · {dayLabel(memory.updatedAt)}</span><button type="button" className="life-icon-button" aria-label={`Upraviť ${memory.title}`} onClick={() => edit({ collection: "memories", record: memory })}><Pencil size={14} /></button></div><p className="life-subtle" style={{ marginTop: 10 }}>Zdroj: {memory.source}</p></Panel>)}</div> : <Panel><Empty title="Čo chceš postupne zlepšiť?" description="Ulož si cieľ, napríklad pravidelný spánok alebo tréning. Asistent tento kontext použije pri ďalších rozhovoroch." action={<button type="button" className="life-button" onClick={addHabit}><Sparkles size={14} />Pridať zdravotný cieľ</button>} /></Panel>}<p className="life-subtle">Plnenie cieľov sa posudzuje podľa tvojich záznamov. História zmien a návrat k predchádzajúcej verzii sú v Pamäti a pravidlách.</p></div> : null}
  </>;
}
