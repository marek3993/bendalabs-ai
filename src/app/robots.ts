import type { MetadataRoute } from "next";
import { absoluteUrl, isIndexableDeployment } from "@/lib/bendalabs/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: isIndexableDeployment
      ? [
          { userAgent: "*", allow: "/", disallow: ["/api/", "/admin/"] },
          // Search discovery, separate from OpenAI model-training crawlers.
          { userAgent: "OAI-SearchBot", allow: "/", disallow: ["/api/", "/admin/"] },
        ]
      : { userAgent: "*", disallow: "/" },
    ...(isIndexableDeployment ? { sitemap: absoluteUrl("/sitemap.xml") } : {}),
  };
}
