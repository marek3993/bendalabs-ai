import type { Metadata } from "next";
import { LabsPage } from "@/components/bendalabs/world-pages";
export const metadata: Metadata = { title: "BendaLabs — vlastné aplikácie a AI", description: "Fakturomat, TrendAtlas, Rentulo a ďalšie softvérové projekty Mareka Bendu. Čo riešia, ako fungujú a kam smeruje ich vývoj." };
export default function Page() { return <LabsPage />; }
