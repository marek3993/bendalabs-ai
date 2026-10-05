import Link from "next/link";
import { Arrow, PageShell } from "./brand-shell";
import ProjectContact from "./project-contact";
import UniversitySection from "./university-section";
import { LabsProjects, RoboticsProjects } from "./project-showcase";
import type { SiteLocale } from "@/lib/bendalabs/site-content";

export default function WorldHome({ locale = "sk" }: { locale?: SiteLocale }) {
  const cs = locale === "cs";
  const en = locale === "en";
  return <PageShell locale={locale}><main id="main">
    <section className="bl-intro bl-wrap">
      <div className="bl-intro-copy">
        <div><p className="bl-eyebrow">Marek Benda / BendaLabs</p><h1>{en ? "Apps, AI, custom hardware and robotics" : cs ? "Aplikace, AI\na vlastní roboty." : "Aplikácie, AI, vlastný hardware a robotika"}</h1></div>
        <div><p>{en ? "I develop digital products and build physical prototypes. Explore the projects I am working on — from invoices to a robotic arm." : cs ? "Vyvíjím digitální produkty a stavím fyzické prototypy. Tady najdete projekty, na kterých pracuji — od faktur až po robotickou ruku." : "Vyvíjam digitálne produkty a staviam fyzické prototypy. Tu nájdete projekty, na ktorých pracujem — od faktúr až po robotickú ruku."}</p><Link href="#kontakt" className="bl-text-link">{en ? "Start a project" : cs ? "Začít projekt" : "Začať projekt"}<Arrow diagonal /></Link></div>
      </div>
      <div className="bl-entrances" id="projekty">
        <a className="bl-entrance" href="#labs"><div><span className="bl-eyebrow">{en ? "Digital products" : cs ? "Digitální produkty" : "Digitálne produkty"}</span><h2>BendaLabs</h2><p>{en ? "Apps, AI and automation for everyday work." : cs ? "Aplikace, AI a automatizace každodenní práce." : "Aplikácie, AI a automatizácia každodennej práce."}</p></div><Arrow diagonal /></a>
        <a className="bl-entrance bl-entrance-dark" href="#robotics"><div><span className="bl-eyebrow">{en ? "Robotics and hardware" : cs ? "Robotika a hardware" : "Robotika a hardvér"}</span><h2>BendaRobotics</h2><p>{en ? "Custom machines, electronics and working prototypes." : cs ? "Vlastní stroje, elektronika a funkční prototypy." : "Vlastné stroje, elektronika a funkčné prototypy."}</p></div><Arrow diagonal /></a>
      </div>
    </section>
    <LabsProjects locale={locale} />
    <RoboticsProjects locale={locale} />
    <UniversitySection locale={locale} />
    <ProjectContact locale={locale} />
  </main></PageShell>;
}
