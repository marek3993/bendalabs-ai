import type { Metadata } from "next";
import { LabsPage } from "@/components/bendalabs/world-pages";
export const metadata: Metadata = { title: "BendaLabs — vlastní aplikace a AI", description: "Fakturomat, TrendAtlas, Rentulo a další softwarové projekty Marka Bendy. Co řeší, jak fungují a kam směřuje jejich vývoj." };
export default function Page() { return <LabsPage locale="cs" />; }
