import WorldHome from "@/components/bendalabs/world-home";
import { pageMetadata } from "@/lib/bendalabs/seo";
export const metadata = pageMetadata("/en", "BendaLabs — apps, AI, hardware and robotics", "Original digital products, AI tools and working robotics prototypes by Marek Benda. Explore BendaLabs and BendaRobotics.");
export default function Page() { return <WorldHome locale="en" />; }
