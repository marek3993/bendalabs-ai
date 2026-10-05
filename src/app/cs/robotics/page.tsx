import { pageMetadata } from "@/lib/bendalabs/seo";
import type { Metadata } from "next";
import { RoboticsPage } from "@/components/bendalabs/world-pages";
export const metadata: Metadata = pageMetadata("/cs/robotics", "BendaRobotics — roboty a vlastní elektronika", "Robotická ruka, Mecanum robot a inteligentní krmítko. Skutečné prototypy, fotografie z vývoje a interaktivní simulace pohybu.");
export default function Page() { return <RoboticsPage locale="cs" />; }
