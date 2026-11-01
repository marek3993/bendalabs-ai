import type { Metadata } from "next";
import "./workspace.css";
export const metadata: Metadata = {
  title: "BendaLabs Workspace",
  robots: { index: false, follow: false, nocache: true },
  referrer: "same-origin",
};
export const dynamic = "force-dynamic";
export default function Layout({ children }: { children: React.ReactNode }) {
  return <div className="bendalabs-workspace">{children}</div>;
}
