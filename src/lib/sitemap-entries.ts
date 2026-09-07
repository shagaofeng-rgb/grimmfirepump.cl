import { createHash } from "node:crypto";
import { chileSolutions, trustPages } from "@/lib/chile-content";
import { getChileCatalog } from "@/lib/chile-catalog";
import { getPublicBlogPosts } from "@/lib/public-blog";
import { getDefaultNewsSite, getPublicNews } from "@/lib/industry-news";

export const SITE_URL = "https://grimmfirepump.cl";

export type PublicSitemapEntry = {
  url: string;
  lastModified?: Date;
  changeFrequency: "daily" | "weekly" | "monthly";
  priority: number;
};

function isCanonicalPublicUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.origin === SITE_URL;
  } catch {
    return false;
  }
}

function validDate(value: string | undefined) {
  if (!value) return undefined;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

/**
 * Builds the single source of truth used by both the public metadata route and
 * the Search Console submission job. Static routes deliberately omit lastmod:
 * a generated "now" value is inaccurate and causes needless recrawls.
 */
export async function getPublicSitemapEntries(): Promise<PublicSitemapEntry[]> {
  const [blogPosts, products, newsSite] = await Promise.all([
    getPublicBlogPosts(),
    getChileCatalog(),
    getDefaultNewsSite(),
  ]);
  const news = newsSite ? await getPublicNews(newsSite.siteId) : [];

  const entries: PublicSitemapEntry[] = [
    { url: `${SITE_URL}/es`, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/es/productos`, changeFrequency: "weekly", priority: 0.9 },
    ...products.map((product) => ({
      url: `${SITE_URL}/es/productos/${product.slug}`,
      lastModified: validDate(product.lastModified),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    { url: `${SITE_URL}/es/soluciones`, changeFrequency: "weekly", priority: 0.8 },
    ...chileSolutions.map((solution) => ({
      url: `${SITE_URL}/es/soluciones/${solution.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    ...Object.keys(trustPages).map((section) => ({
      url: `${SITE_URL}/es/${section}`,
      changeFrequency: "monthly" as const,
      priority: section === "contacto" ? 0.7 : 0.5,
    })),
    { url: `${SITE_URL}/es/blog`, changeFrequency: "weekly", priority: 0.5 },
    ...blogPosts.map((post) => ({
      url: `${SITE_URL}/es/blog/${post.slug}`,
      lastModified: validDate(post.updatedAt || post.publishedAt),
      changeFrequency: "monthly" as const,
      priority: 0.4,
    })),
    { url: `${SITE_URL}/es/noticias`, changeFrequency: "daily", priority: 0.5 },
    ...news.map((article) => ({
      url: String(article.canonical_url),
      lastModified: validDate(String(article.updated_at)),
      changeFrequency: "monthly" as const,
      priority: 0.4,
    })),
  ];

  return entries.filter((entry) => isCanonicalPublicUrl(entry.url));
}

export function sitemapFingerprint(entries: PublicSitemapEntry[]) {
  const serialised = entries
    .map((entry) => `${entry.url}|${entry.lastModified?.toISOString() || ""}`)
    .sort()
    .join("\n");
  return createHash("sha256").update(serialised).digest("hex");
}
