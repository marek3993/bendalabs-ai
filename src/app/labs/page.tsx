import { pageMetadata } from "@/lib/bendalabs/seo";
import { LabsPage } from "@/components/bendalabs/world-pages";
export const metadata = pageMetadata("/labs", "BendaLabs — vlastné aplikácie a AI", "Fakturomat, TrendAtlas, Rentulo a ďalšie softvérové projekty Mareka Bendu. Čo riešia, ako fungujú a kam smeruje ich vývoj.");
export default function Page() { return <LabsPage />; }
