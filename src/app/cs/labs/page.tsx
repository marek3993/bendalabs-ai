import { pageMetadata } from "@/lib/bendalabs/seo";
import { LabsPage } from "@/components/bendalabs/world-pages";
export const metadata = pageMetadata("/cs/labs", "BendaLabs — vlastní aplikace a AI", "Fakturomat, TrendAtlas, Rentulo a další softwarové projekty Marka Bendy. Co řeší, jak fungují a kam směřuje jejich vývoj.");
export default function Page() { return <LabsPage locale="cs" />; }
