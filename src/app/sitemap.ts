import type { MetadataRoute } from "next";
import { products } from "@/lib/products";
import { getPublicBlogPosts } from "@/lib/public-blog";

const site = "https://grimmfirepump.cl";

export const dynamic = "force-dynamic";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const locales = ["es", "pt", "en"];
  const blogPosts = await getPublicBlogPosts();
  return locales.flatMap((locale) => [
    { url: `${site}/${locale}`, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${site}/${locale}/products`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${site}/${locale}/blog`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
    ...products.map((product) => ({ url: `${site}/${locale}/products/${product.slug}`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.7 })),
    ...blogPosts.map((post) => ({ url: `${site}/${locale}/blog/${post.slug}`, lastModified: new Date(post.publishedAt), changeFrequency: "monthly" as const, priority: 0.6 })),
  ]);
}
