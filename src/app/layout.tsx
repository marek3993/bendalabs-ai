import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "BendaLabs | AI vrstva, ktorá mení spôsob používania webu",
  description:
    "BendaLabs prináša AI vrstvu, ktorá návštevníka dovedie k správnemu výsledku rýchlejšie a mení spôsob, akým ľudia používajú váš web.",
  icons: {
    icon: [{ url: "/bendalabs-logo.png", type: "image/png" }],
    apple: [{ url: "/bendalabs-logo.png", type: "image/png" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="sk">
      <body data-google-ads-conversion-send-to={process.env.GOOGLE_ADS_CONVERSION_SEND_TO ?? ""}>
        <Script
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
        {children}
      </body>
    </html>
  );
}
