import Link from "next/link";
import { Arrow, PageShell } from "./brand-shell";
type ContactRequestSuccessStateProps = { backHref: string; backLabel: string; title: string; description: string; };
export default function ContactRequestSuccessState({ backHref, backLabel, title, description }: ContactRequestSuccessStateProps) {
  const locale = backHref.startsWith("/cs") ? "cs" : "sk";
  return <PageShell locale={locale}><main id="main" className="bl-status-page bl-wrap"><p className="bl-eyebrow">{locale === "cs" ? "Zpráva dorazila" : "Správa dorazila"}</p><h1>{title}</h1><p>{description}</p><Link href={backHref} className="bl-button">{backLabel}<Arrow /></Link></main></PageShell>;
}
