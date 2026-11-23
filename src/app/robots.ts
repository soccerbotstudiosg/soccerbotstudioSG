import type { MetadataRoute } from "next";
import { canonicalUrl, publicIndexing } from "@/content/seo";
export const dynamic = "force-static";
/** Allow production crawlers to read page-level noindex; exclude other environments. */
export default function robots(): MetadataRoute.Robots {
  return publicIndexing
    ? {
        rules: { userAgent: "*", allow: "/", disallow: "/api/" },
        sitemap: canonicalUrl("/sitemap.xml"),
      }
    : { rules: { userAgent: "*", disallow: "/" } };
}
