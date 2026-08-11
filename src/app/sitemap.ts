import type { MetadataRoute } from "next";
import { chileSolutions, trustPages } from "@/lib/chile-content";
import { getChileCatalog } from "@/lib/chile-catalog";
import { getPublicBlogPosts } from "@/lib/public-blog";

const site = "https://grimmfirepump.cl";
export const dynamic = "force-dynamic";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [blogPosts, products] = await Promise.all([getPublicBlogPosts(), getChileCatalog()]);
  const now = new Date();
  return [
    { url: `${site}/es`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${site}/es/productos`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    ...products.map((product) => ({ url: `${site}/es/productos/${product.slug}`, lastModified: now, changeFrequency: "monthly" as const, priority: 0.8 })),
    { url: `${site}/es/soluciones`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    ...chileSolutions.map((solution) => ({ url: `${site}/es/soluciones/${solution.slug}`, lastModified: now, changeFrequency: "monthly" as const, priority: 0.7 })),
    ...Object.keys(trustPages).map((section) => ({ url: `${site}/es/${section}`, lastModified: now, changeFrequency: "monthly" as const, priority: section === "contacto" ? 0.7 : 0.5 })),
    { url: `${site}/es/blog`, lastModified: now, changeFrequency: "weekly", priority: 0.5 },
    ...blogPosts.map((post) => ({ url: `${site}/es/blog/${post.slug}`, lastModified: new Date(post.publishedAt), changeFrequency: "monthly" as const, priority: 0.4 })),
  ];
}
