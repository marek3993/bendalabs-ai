import { PageShell } from "./brand-shell";
import ProjectContact from "./project-contact";
import { LabsProjects, RoboticsProjects } from "./project-showcase";
import type { SiteLocale } from "@/lib/bendalabs/site-content";

export function LabsPage({ locale = "sk" }: { locale?: SiteLocale }) {
  return <PageShell locale={locale} contactHref="#kontakt"><main id="main"><LabsProjects locale={locale} standalone /><ProjectContact locale={locale} /></main></PageShell>;
}

export function RoboticsPage({ locale = "sk" }: { locale?: SiteLocale }) {
  return <PageShell locale={locale} contactHref="#kontakt"><main id="main"><RoboticsProjects locale={locale} standalone /><ProjectContact locale={locale} robotics /></main></PageShell>;
}
