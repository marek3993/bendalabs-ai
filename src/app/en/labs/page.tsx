import { LabsPage } from "@/components/bendalabs/world-pages";
import { pageMetadata } from "@/lib/bendalabs/seo";
export const metadata = pageMetadata("/en/labs", "BendaLabs — digital products and AI", "Explore Fakturomat, TrendAtlas, Zmluvomat and Opportunities, Rentulo and imLayer: working projects, prototypes and their next steps.");
export default function Page() { return <LabsPage locale="en" />; }
