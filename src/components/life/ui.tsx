"use client";

import { useEffect, useRef, type FormEvent, type ReactNode } from "react";
import { ArrowUpRight, Inbox, X } from "lucide-react";

export function eur(cents: number) {
  return new Intl.NumberFormat("sk-SK", { style: "currency", currency: "EUR" }).format(cents / 100);
}

export function dayLabel(date: string) {
  if (!date) return "Bez termínu";
  const parsed = new Date(date.length === 10 ? `${date}T12:00:00` : date);
  return Number.isNaN(parsed.getTime()) ? date : parsed.toLocaleDateString("sk-SK", { day: "numeric", month: "short", year: "numeric" });
}

export function localDay(timezone = "Europe/Paris") {
  return new Intl.DateTimeFormat("en-CA", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return <label className="life-field"><span>{label}</span>{children}{hint ? <small>{hint}</small> : null}</label>;
}

export function Panel({ title, eyebrow, action, children, className = "" }: { title?: string; eyebrow?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return <section className={`life-panel ${className}`}>
    {title || action ? <header className="life-panel-heading"><div>{eyebrow ? <p className="life-eyebrow">{eyebrow}</p> : null}{title ? <h2>{title}</h2> : null}</div>{action}</header> : null}
    {children}
  </section>;
}

export function Empty({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return <div className="life-empty"><div className="life-empty-icon"><Inbox size={23} strokeWidth={1.5} /></div><h3>{title}</h3><p>{description}</p>{action}</div>;
}

export function Metric({ label, value, note, icon, accent = false }: { label: string; value: ReactNode; note?: string; icon?: ReactNode; accent?: boolean }) {
  return <div className={`life-metric ${accent ? "life-metric-accent" : ""}`}><div className="life-metric-label">{label}{icon}</div><strong>{value}</strong>{note ? <small>{note}</small> : null}</div>;
}

export function TextButton({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return <button type="button" className="life-text-button" onClick={onClick}>{children}<ArrowUpRight size={15} /></button>;
}

export function Modal({ title, subtitle, onClose, children, busy = false, onSubmit, submitLabel = "Uložiť" }: {
  title: string; subtitle?: string; onClose: () => void; children: ReactNode; busy?: boolean;
  onSubmit?: (event: FormEvent<HTMLFormElement>) => void; submitLabel?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => { dialog?.close(); };
  }, []);
  return <dialog ref={ref} className="life-dialog" onCancel={(event) => { event.preventDefault(); if (!busy) onClose(); }} onClick={(event) => { if (event.target === event.currentTarget && !busy) onClose(); }}>
    <div className="life-dialog-content">
      <header><div><p className="life-eyebrow">SI FOR ME</p><h2>{title}</h2>{subtitle ? <p>{subtitle}</p> : null}</div><button type="button" className="life-icon-button" aria-label="Zavrieť" onClick={onClose} disabled={busy}><X size={20} /></button></header>
      {onSubmit ? <form onSubmit={onSubmit}><div className="life-form-body"><fieldset disabled={busy}>{children}</fieldset></div><footer><button type="button" className="life-button life-button-quiet" onClick={onClose} disabled={busy}>Zrušiť</button><button className="life-button life-button-primary" type="submit" disabled={busy}>{busy ? "Ukladám…" : submitLabel}</button></footer></form> : children}
    </div>
  </dialog>;
}

export function MiniTrend({ values, labels, dates, unit, color = "var(--life-purple)" }: { values: number[]; labels: string[]; dates?: string[]; unit: string; color?: string }) {
  if (values.length < 2) return <p className="life-subtle life-chart-empty">Trend sa zobrazí po druhom zázname.</p>;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(max - min, 1);
  const times = dates?.map(date => Date.parse(`${date}T12:00:00Z`));
  const firstTime = times?.[0] ?? 0;
  const timeRange = times ? times[times.length - 1] - firstTime : 0;
  const x = (index: number) => 12 + (times && timeRange > 0 ? (times[index] - firstTime) / timeRange : index / (values.length - 1)) * 536;
  const points = values.map((value, index) => `${x(index)},${100 - (value - min) / range * 76}`).join(" ");
  return <div className="life-trend"><svg viewBox="0 0 560 125" role="img" aria-label={values.map((value, index) => `${labels[index]}: ${value} ${unit}`).join(", ")}><path d="M12 100H548M12 62H548M12 24H548" className="life-chart-grid" /><polyline points={points} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />{values.map((value, index) => <circle key={`${labels[index]}-${index}`} cx={x(index)} cy={100 - (value - min) / range * 76} r="3.5" fill={color}><title>{labels[index]}: {value} {unit}</title></circle>)}</svg><div className="life-chart-axis"><span>{labels[0]}</span><span>{min}–{max} {unit}</span><span>{labels[labels.length - 1]}</span></div></div>;
}

export function Progress({ value, max, label }: { value: number; max: number; label: string }) {
  return <div className="life-progress" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={Math.max(max, 1)} aria-valuenow={Math.min(Math.max(value, 0), Math.max(max, 1))}><span style={{ width: `${Math.min(Math.max(value / Math.max(max, 1) * 100, 0), 100)}%` }} /></div>;
}

export function formString(data: FormData, key: string) { return String(data.get(key) || "").trim(); }
export function formNumber(data: FormData, key: string) { const raw = formString(data, key); return raw ? Number(raw.replace(",", ".")) : undefined; }
export function formCents(data: FormData, key: string) { return Math.round((formNumber(data, key) || 0) * 100); }
