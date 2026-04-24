import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BendaLabs | AI vrstva, ktorá mení spôsob používania webu",
  description:
    "BendaLabs prináša AI vrstvu, ktorá návštevníka dovedie k správnemu výsledku rýchlejšie a mení spôsob, akým ľudia používajú váš web.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="sk">
      <body>{children}</body>
    </html>
  );
}

