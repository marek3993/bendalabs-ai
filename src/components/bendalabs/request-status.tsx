import Link from "next/link";
import { Arrow, PageShell } from "./brand-shell";
import { getLeadFormCopy } from "@/lib/bendalabs/lead-form-content";
import type { SiteLocale } from "@/lib/bendalabs/site-content";

export function RequestFailure({ locale, back, details }: { locale: SiteLocale; back?: string; details?: string }) {
  const cs = locale === "cs";
  const en = locale === "en";
  const fallback = en ? "/en#kontakt" : cs ? "/cs#kontakt" : "/#kontakt";
  const backHref = back?.startsWith("/") && !back.startsWith("//") && !back.includes("\\") ? back : fallback;
  const validationMessages = Object.values(getLeadFormCopy(locale).validation).filter(value => details?.includes(value));
  return <PageShell locale={locale}><main id="main" className="bl-status-page bl-wrap"><p className="bl-eyebrow">{en ? "Message not sent" : cs ? "Zpráva nebyla odeslána" : "Správa nebola odoslaná"}</p><h1>{en ? "Your message\ncould not be sent." : cs ? "Odeslání se\nnepodařilo." : "Odoslanie sa\nnepodarilo."}</h1><p>{validationMessages.length ? validationMessages.join(" ") : (en ? "Please try again. If the problem persists, email me directly." : cs ? "Zkuste to prosím znovu. Pokud problém přetrvává, napište mi přímo e-mailem." : "Skúste to prosím znova. Ak problém pretrváva, napíšte mi priamo e-mailom.")}</p><div className="bl-inline-links"><Link className="bl-button" href={backHref}>{en ? "Back to the form" : cs ? "Zpět na formulář" : "Späť na formulár"}<Arrow /></Link><a href="mailto:info@bendalabs.sk">info@bendalabs.sk</a></div></main></PageShell>;
}
