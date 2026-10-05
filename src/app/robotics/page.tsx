import { pageMetadata } from "@/lib/bendalabs/seo";
import type { Metadata } from "next";
import { RoboticsPage } from "@/components/bendalabs/world-pages";
export const metadata: Metadata = pageMetadata("/robotics", "BendaRobotics — roboty a vlastná elektronika", "Robotická ruka, Mecanum robot a inteligentná krmička. Skutočné prototypy, fotografie z vývoja a interaktívna simulácia pohybu.");
export default function Page() { return <RoboticsPage />; }
