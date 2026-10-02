import { pageMetadata } from "@/lib/bendalabs/seo";
import { RoboticsPage } from "@/components/bendalabs/world-pages";
export const metadata = pageMetadata("/cs/robotics", "BendaRobotics — roboty a vlastní elektronika", "Robotická ruka, Mecanum robot a inteligentní krmítko. Skutečné prototypy, fotografie z vývoje a interaktivní simulace pohybu.");
export default function Page() { return <RoboticsPage locale="cs" />; }
