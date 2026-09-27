"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import type { SiteLocale } from "@/lib/bendalabs/site-content";

export function Arrow({ diagonal = false }: { diagonal?: boolean }) {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true" className={diagonal ? "bl-arrow diagonal" : "bl-arrow"}><path d="M4 12h15M12 5l7 7-7 7" stroke="currentColor" strokeWidth="1.7" /></svg>;
}

export function Brand({ locale = "sk" }: { locale?: SiteLocale }) {
  return <Link className="bl-brand" href={locale === "cs" ? "/cs" : "/"} aria-label={locale === "cs" ? "BendaLabs — domů" : "BendaLabs — domov"}><Image src="/brand/bendalabs-logo-hq.png" alt="" width={44} height={44} priority /><span>benda<span className="bl-brand-light">labs</span></span></Link>;
}

export function Header({ locale = "sk", contactHref }: { locale?: SiteLocale; contactHref?: string }) {
  const [open, setOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 901px)");
    const onChange = () => { if (desktop.matches) setOpen(false); };
    desktop.addEventListener("change", onChange);
    return () => desktop.removeEventListener("change", onChange);
  }, []);
  const pathname = usePathname();
  const root = locale === "cs" ? "/cs" : "";
  const home = root || "/";
  const cs = locale === "cs";
  const localizedRoutes: Record<string, string> = {
    "/ai-vrstva-pre-financne-a-poistne-weby": "/cs/ai-vrstva-pro-financni-a-pojistne-weby",
    "/ai-vrstva-pre-marketplace-a-rental-weby": "/cs/ai-vrstva-pro-marketplace-a-rental-weby",
    "/dakujem": "/cs/dekujeme",
    "/odoslanie-zlyhalo": "/cs/odeslani-selhalo",
  };
  const sibling = cs ? (Object.entries(localizedRoutes).find(([, value]) => value === pathname)?.[0] || pathname.replace(/^\/cs/, "") || "/") : (localizedRoutes[pathname] || `/cs${pathname === "/" ? "" : pathname}`);
  const localeHref = pathname.includes("ai-navrh") ? (cs ? "/ai-navrh-na-mieru" : "/cs") : sibling;
  const contact = contactHref ?? `${home}#kontakt`;
  const links = [[`${home}#labs`, "BendaLabs"], [`${home}#robotics`, "BendaRobotics"], [contact, "Kontakt"]];
  return <header className="bl-header">
    <div className="bl-header-inner">
      <Brand locale={locale} />
      <nav className="bl-desktop-nav" aria-label={cs ? "Hlavní navigace" : "Hlavná navigácia"}>{links.map(([href, label]) => <Link key={href} href={href}>{label}</Link>)}</nav>
      <div className="bl-header-actions"><Link className="bl-language" href={localeHref} hrefLang={cs ? "sk" : "cs"} aria-label={cs ? "Slovenčina" : "Čeština"}>{cs ? "SK" : "CZ"}</Link><Link href={contact} className="bl-button bl-button-small">{cs ? "Začít projekt" : "Začať projekt"}<Arrow /></Link><button ref={menuButton} className="bl-menu-toggle" aria-expanded={open} aria-controls="mobile-navigation" aria-label={open ? (cs ? "Zavřít menu" : "Zavrieť menu") : (cs ? "Otevřít menu" : "Otvoriť menu")} onClick={() => setOpen(!open)}>{open ? "×" : <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 8h16M4 16h16" stroke="currentColor" strokeWidth="1.5" /></svg>}</button></div>
    </div>
    {open && <nav id="mobile-navigation" className="bl-mobile-nav" aria-label={cs ? "Mobilní navigace" : "Mobilná navigácia"} onKeyDown={event => { if (event.key === "Escape") { setOpen(false); menuButton.current?.focus(); } }}>{links.map(([href, label]) => <Link key={href} href={href} onClick={() => setOpen(false)}>{label}<Arrow /></Link>)}</nav>}
  </header>;
}

export function Footer({ locale = "sk" }: { locale?: SiteLocale }) {
  const root = locale === "cs" ? "/cs" : "";
  return <footer className="bl-footer"><div className="bl-wrap bl-footer-inner"><span>© {new Date().getFullYear()} BendaLabs · Marek Benda</span><nav aria-label={locale === "cs" ? "Odkazy v zápatí" : "Odkazy v pätičke"}><Link href={`${root}/labs`}>BendaLabs</Link><Link href={`${root}/robotics`}>BendaRobotics</Link><a href="mailto:info@bendalabs.sk">info@bendalabs.sk</a></nav></div></footer>;
}

export function PageShell({ locale = "sk", children, contactHref }: { locale?: SiteLocale; dark?: boolean; children: ReactNode; contactHref?: string }) {
  return <div className="bl-site" lang={locale}><a href="#main" className="bl-skip">{locale === "cs" ? "Přejít na obsah" : "Prejsť na obsah"}</a><Header locale={locale} contactHref={contactHref} />{children}<Footer locale={locale} /></div>;
}
