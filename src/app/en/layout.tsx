import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "BendaLabs — apps, AI and robotics",
  description: "Digital products, intelligent layers over existing websites, custom hardware and working robotics prototypes by Marek Benda.",
};

export default function EnglishLayout({ children }: { children: React.ReactNode }) { return <div lang="en">{children}</div>; }
