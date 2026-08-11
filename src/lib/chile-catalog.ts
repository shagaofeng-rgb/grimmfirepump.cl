import { getDatabase } from "@/lib/database";
import { chileProducts, type ChileProduct } from "@/lib/chile-content";

type CatalogRow = {
  slug: string;
  name: string;
  short_description: string | null;
  seo_title: string | null;
  technical_specs: string | null;
};

function readSpecifications(value: string | null, fallback: ChileProduct["verifiedSpecifications"]) {
  if (!value) return fallback;
  try {
    const parsed = JSON.parse(value) as Record<string, unknown>;
    const entries = Object.entries(parsed).filter((entry): entry is [string, string] => typeof entry[1] === "string" && entry[1].trim().length > 0);
    return entries.length ? entries : fallback;
  } catch {
    return fallback;
  }
}

/**
 * The published Chile catalogue is managed in PostgreSQL. The static catalogue
 * remains only as a presentation/selection template for fields that the current
 * admin model does not yet expose (FAQ, application checklist and relations).
 */
export async function getChileCatalog(): Promise<ChileProduct[]> {
  const db = await getDatabase();
  const result = await db.execute({
    sql: "SELECT t.slug,t.name,t.short_description,t.seo_title,p.technical_specs FROM products p JOIN product_translations t ON t.product_id=p.id AND t.locale='es' WHERE p.deleted_at IS NULL AND p.status='published' AND p.sku LIKE ? ORDER BY p.sort_order,p.created_at",
    args: ["chile:%"],
  });
  const rows = new Map(result.rows.map((row) => [String(row.slug), row as unknown as CatalogRow]));

  return chileProducts.map((fallback) => {
    const row = rows.get(fallback.slug);
    if (!row) return fallback;
    return {
      ...fallback,
      name: row.name || fallback.name,
      title: row.seo_title || fallback.title,
      description: row.short_description || fallback.description,
      verifiedSpecifications: readSpecifications(row.technical_specs, fallback.verifiedSpecifications),
    };
  });
}
