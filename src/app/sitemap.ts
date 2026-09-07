import type { MetadataRoute } from "next";
import { getPublicSitemapEntries } from "@/lib/sitemap-entries";

export const dynamic = "force-dynamic";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return getPublicSitemapEntries();
}
