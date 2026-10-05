import type { MetadataRoute } from "next";
import { absoluteUrl, isIndexableDeployment, languageAlternates, publicPaths } from "@/lib/bendalabs/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  if (!isIndexableDeployment) return [];
  return publicPaths.map((path) => {
    const languages = languageAlternates(path);
    return {
      url: absoluteUrl(path),
      ...(languages ? { alternates: { languages } } : {}),
    };
  });
}
