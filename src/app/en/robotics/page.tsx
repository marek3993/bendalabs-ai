import { RoboticsPage } from "@/components/bendalabs/world-pages";
import { pageMetadata } from "@/lib/bendalabs/seo";
export const metadata = pageMetadata("/en/robotics", "BendaRobotics — custom hardware and robotics", "Explore a robotic arm, Mecanum robot, smart feeder, live crypto ticker and AI hologram. Try interactive simulations of working prototypes.");
export default function Page() { return <RoboticsPage locale="en" />; }
