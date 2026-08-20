import type { MetadataRoute } from "next";
import { resolvePage, staticPageParams } from "./publication-data";
import { localizedPath } from "./publication-types";

const siteOrigin = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export default function sitemap(): MetadataRoute.Sitemap {
  return staticPageParams().map(({ lang, path }) => {
    const model = resolvePage(lang, path)!;
    return {
      url: new URL(localizedPath(model, lang), siteOrigin).toString(),
      changeFrequency: model.content ? "monthly" : "weekly",
      priority: model.content ? 0.7 : model.detail ? 0.8 : 1,
    };
  });
}
