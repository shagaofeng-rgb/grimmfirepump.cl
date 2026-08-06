import { getDatabase } from "@/lib/database";
import type { Product } from "@/lib/products";

export async function getPublicProducts(): Promise<Product[]> {
  const db = await getDatabase();
  const result = await db.execute("SELECT t.slug,t.name,t.short_description,c.name AS category,p.technical_specs FROM products p JOIN product_translations t ON t.product_id=p.id AND t.locale='es' LEFT JOIN product_categories c ON c.id=p.category_id WHERE p.deleted_at IS NULL AND p.status='published' ORDER BY p.sort_order,p.created_at");
  return result.rows.map((row) => {
    let values: Record<string, string> = {};
    try { values = row.technical_specs ? JSON.parse(String(row.technical_specs)) as Record<string, string> : {}; } catch { values = {}; }
    return { slug: String(row.slug), name: String(row.name), category: String(row.category || "Sistemas contra incendio"), description: String(row.short_description || ""), specs: Object.entries(values) };
  });
}
