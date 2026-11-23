import type { MetadataRoute } from "next";
import { canonicalUrl, publicIndexing, publicPages } from "@/content/seo";
export const dynamic = "force-static";
/** Publish only canonical public pages from the live production build. */
export default function sitemap(): MetadataRoute.Sitemap {
  return publicIndexing
    ? Object.keys(publicPages).map((path) => ({ url: canonicalUrl(path) }))
    : [];
}
