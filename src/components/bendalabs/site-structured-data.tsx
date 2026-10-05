import { absoluteUrl } from "@/lib/bendalabs/seo";
import type { SiteLocale } from "@/lib/bendalabs/site-content";

// Facts already visible on the site; no invented ratings, profiles, or business details.
export default function SiteStructuredData({ locale = "sk" }: { locale?: SiteLocale }) {
  const personId = absoluteUrl("/#marek-benda");
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": absoluteUrl("/#website"),
        url: absoluteUrl("/"),
        name: "BendaLabs",
        inLanguage: ["sk", "cs", "en"],
        description: locale === "en" ? "Projects by Marek Benda: apps, AI, custom hardware and robotics." : "Projekty Mareka Bendu: aplikácie, AI, vlastný hardvér a robotika.",
        creator: { "@id": personId },
        about: [
          { "@type": "Brand", name: "BendaLabs", url: absoluteUrl("/labs") },
          { "@type": "Brand", name: "BendaRobotics", url: absoluteUrl("/robotics") },
        ],
      },
      {
        "@type": "Person",
        "@id": personId,
        name: "Marek Benda",
        url: absoluteUrl("/#kontakt"),
      },
    ],
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}
