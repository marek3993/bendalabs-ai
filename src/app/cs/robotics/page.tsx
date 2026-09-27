import type { Metadata } from "next";
import { RoboticsPage } from "@/components/bendalabs/world-pages";
export const metadata: Metadata = { title: "BendaRobotics — roboty a vlastní elektronika", description: "Robotická ruka, Mecanum robot a inteligentní krmítko. Skutečné prototypy, fotografie z vývoje a interaktivní simulace pohybu." };
export default function Page() { return <RoboticsPage locale="cs" />; }
