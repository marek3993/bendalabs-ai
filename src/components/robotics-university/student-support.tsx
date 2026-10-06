"use client";

import { useRef, useState, type FormEvent } from "react";
import { MAX_SUPPORT_MESSAGE, validateStudentSupport } from "@/lib/university-support/validation";
import styles from "./student-support.module.css";

type Props = { lang: "sk" | "en" };
type Status = "idle" | "sending" | "sent" | "invalid" | "rate_limited" | "unavailable";

export function SupportForm({ lang }: Props) {
  const t = (sk: string, en: string) => lang === "sk" ? sk : en;
  const id = "university-student-support";
  const [kind, setKind] = useState<"question" | "project">("question");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [projectUrl, setProjectUrl] = useState("");
  const [message, setMessage] = useState("");
  const [consent, setConsent] = useState(false);
  const [website, setWebsite] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const sending = useRef(false);
  const attempt = useRef<{ fingerprint: string; id: string } | null>(null);
  const changed = () => { if (!sending.current) setStatus("idle"); };

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending.current) return;
    const fields = { kind, lang, name, email, projectUrl, message, consent, website };
    const fingerprint = JSON.stringify(fields);
    if (!attempt.current || attempt.current.fingerprint !== fingerprint) attempt.current = { fingerprint, id: crypto.randomUUID() };
    const payload = { ...fields, submissionId: attempt.current.id };
    if (!validateStudentSupport(payload)) { setStatus("invalid"); return; }
    sending.current = true;
    setStatus("sending");
    try {
      const response = await fetch("/api/university-support", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload), signal: AbortSignal.timeout(20_000) });
      const result: unknown = await response.json();
      if (response.ok && result && typeof result === "object" && "ok" in result && result.ok === true) {
        setStatus("sent"); setName(""); setEmail(""); setProjectUrl(""); setMessage(""); setConsent(false); setWebsite(""); attempt.current = null;
      } else { setStatus(response.status === 429 ? "rate_limited" : response.status === 400 ? "invalid" : "unavailable"); }
    } catch { setStatus("unavailable"); }
    finally { sending.current = false; }
  }

  const error = status === "invalid" ? t("Skontroluj e-mail, odkaz začínajúci https://, správu s aspoň 20 znakmi a súhlas s kontaktovaním.", "Check your email, the link starting with https://, a message of at least 20 characters, and your consent to be contacted.")
    : status === "rate_limited" ? t("Z tejto siete prišlo v krátkom čase viac správ. Skús odoslanie neskôr; vyplnený text zostal vo formulári.", "Several messages were sent from this network recently. Try again later; your text is still in the form.")
    : status === "unavailable" ? t("Odoslanie sa nepodarilo potvrdiť. Text zostal vo formulári; skús to znova.", "We could not confirm delivery. Your text is still in the form; please try again.") : "";

  return <section className={styles.support} aria-labelledby={`${id}-title`}>
    <div className={styles.heading}><span className={styles.eyebrow}>{t("OTÁZKY A PROJEKTY", "QUESTIONS AND PROJECTS")}</span><h2 id={`${id}-title`}>{t("Máš otázku alebo vlastný projekt?", "Have a question or a project?")}</h2><p>{t("Napíš, kde si sa zasekol, čo si už vyskúšal alebo čo staviaš. Pomôže aj odkaz na zapojenie, kód či krátku ukážku.", "Tell us where you got stuck, what you have tried, or what you are building. A link to a circuit, code or a short demo can help.")}</p></div>
    {status === "sent" ? <div className={styles.success} role="status"><h3>{t("Správa je u nás. Ďakujeme!", "We received your message. Thank you!")}</h3><p>{t("Prečíta si ju tím BendaLabs. Ak sa ti ozveme, použijeme uvedený e-mail. Tvoja správa ani projekt sa verejne nezobrazia.", "The BendaLabs team will read it. If we get in touch, we will use the email you provided. Your message and project will not be published.")}</p><button type="button" onClick={() => setStatus("idle")}>{t("Napísať ďalšiu správu", "Write another message")}</button></div>
    : <form onSubmit={submit} className={styles.form}>
      <fieldset disabled={status === "sending"}>
        <legend className={styles.srOnly}>{t("Súkromná správa tímu BendaLabs", "Private message to the BendaLabs team")}</legend>
        <div className={styles.grid}>
          <label htmlFor={`${id}-kind`}>{t("S čím sa ozývaš?", "What would you like to share?")}<select id={`${id}-kind`} value={kind} onChange={event => { setKind(event.target.value as typeof kind); changed(); }}><option value="question">{t("Otázka k učeniu alebo stavbe", "A learning or building question")}</option><option value="project">{t("Môj robotický projekt", "My robotics project")}</option></select></label>
          <label htmlFor={`${id}-name`}>{t("Meno (voliteľné)", "Name (optional)")}<input id={`${id}-name`} value={name} maxLength={100} autoComplete="name" onChange={event => { setName(event.target.value); changed(); }}/></label>
          <label htmlFor={`${id}-email`}>{t("E-mail na odpoveď", "Email for a reply")}<input id={`${id}-email`} type="email" value={email} required maxLength={254} autoComplete="email" onChange={event => { setEmail(event.target.value); changed(); }}/></label>
          <label htmlFor={`${id}-url`}>{t("Odkaz na projekt (voliteľné, https://)", "Project link (optional, https://)")}<input id={`${id}-url`} type="url" value={projectUrl} maxLength={2000} autoComplete="off" placeholder="https://" onChange={event => { setProjectUrl(event.target.value); changed(); }}/></label>
        </div>
        <label htmlFor={`${id}-message`}>{t("Tvoja otázka alebo opis projektu", "Your question or project description")}<textarea id={`${id}-message`} value={message} required minLength={20} maxLength={MAX_SUPPORT_MESSAGE} rows={6} aria-describedby={`${id}-message-help`} onChange={event => { setMessage(event.target.value); changed(); }}/></label>
        <p id={`${id}-message-help`} className={styles.hint}>{t("Aspoň 20 znakov. Neposielaj heslá, prístupové kľúče ani osobné údaje iných ľudí.", "At least 20 characters. Do not include passwords, access keys or other people’s personal details.")} <span>{message.length} / {MAX_SUPPORT_MESSAGE}</span></p>
        <div className={styles.trap} aria-hidden="true"><label htmlFor={`${id}-website`}>Website<input id={`${id}-website`} tabIndex={-1} autoComplete="off" value={website} onChange={event => setWebsite(event.target.value)}/></label></div>
        <label className={styles.consent} htmlFor={`${id}-consent`}><input id={`${id}-consent`} type="checkbox" required checked={consent} onChange={event => { setConsent(event.target.checked); changed(); }}/><span>{t("Súhlasím, aby tím BendaLabs použil môj e-mail a správu na vybavenie tejto otázky alebo projektu.", "I agree that the BendaLabs team may use my email and message to handle this question or project enquiry.")}</span></label>
        <p className={styles.privacy}>{t("Správa je súkromná a uvidí ju iba tím BendaLabs. E-mail slúži na prípadnú odpoveď.", "Your message is private and visible only to the BendaLabs team. Your email is for a possible reply.")}</p>
        {error && <p className={styles.error} role="alert">{error}</p>}
        <button type="submit" aria-busy={status === "sending"}>{status === "sending" ? t("Odosielam…", "Sending…") : t("Poslať tímu BendaLabs", "Send to BendaLabs")}</button>
      </fieldset>
    </form>}
  </section>;
}
