import { headers } from "next/headers";
import SiteStructuredData from "@/components/bendalabs/site-structured-data";
import { siteOrigin } from "@/lib/bendalabs/seo";
import type { Metadata } from "next";
import Script from "next/script";
import appleTouchIcon from "./apple-touch-icon.png";
import appIcon from "./icon.png";
import "./globals.css";
import "./brand.css";
import "./arm-task.css";

export const metadata: Metadata = {
  metadataBase: siteOrigin,
  title: "BendaLabs — aplikácie, AI a robotika",
  description:
    "Projekty Mareka Bendu: Fakturomat, TrendAtlas, robotická ruka a ďalšie digitálne produkty a fyzické prototypy. Spoznajte BendaLabs a BendaRobotics.",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: appIcon.src, type: "image/png", sizes: "512x512" },
    ],
    apple: [{ url: appleTouchIcon.src, type: "image/png", sizes: "180x180" }],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const requestHeaders = await headers();
  const language = requestHeaders.get("x-site-locale");
  const isLife = requestHeaders.get("x-bendalabs-private-life") === "1";
  const locale = language === "en" || language === "cs" ? language : "sk";
  return (
    <html lang={locale}>
      <body data-google-ads-conversion-send-to={isLife ? undefined : process.env.GOOGLE_ADS_CONVERSION_SEND_TO ?? ""}>
        {!isLife && <><Script
          async
          src="https://www.googletagmanager.com/gtag/js?id=AW-18119067266"
        />
        <Script
          id="google-ads-tag"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'AW-18119067266');
            `,
          }}
        />
        <SiteStructuredData locale={locale} /></>}
        {children}
      </body>
    </html>
  );
}

