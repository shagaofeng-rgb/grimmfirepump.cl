import type { MetadataRoute } from "next";
import { products } from "@/lib/products";

const site = "https://grimmfirepump.cl";

export default function sitemap(): MetadataRoute.Sitemap {
  const locales = ["es", "pt", "en"];
  return locales.flatMap((locale) => [
    { url: `${site}/${locale}`, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${site}/${locale}/products`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    ...products.map((product) => ({ url: `${site}/${locale}/products/${product.slug}`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.7 })),
  ]);
}
