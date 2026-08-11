import { getDatabase } from "@/lib/database";
import { chileProducts, type ChileProduct } from "@/lib/chile-content";
import { connection } from "next/server";

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
  // The catalogue must reflect administrative changes on the next request.
  // In Next.js 16, `connection()` explicitly prevents this database read from
  // being captured in a prerendered shell or a route-level cache.
  await connection();
  const db = await getDatabase();
  const result = await db.execute({
    sql: "SELECT t.slug,t.name,t.short_description,t.seo_title,p.technical_specs FROM products p JOIN product_translations t ON t.product_id=p.id AND t.locale='es' WHERE p.deleted_at IS NULL AND p.status='published' AND p.sku LIKE ? ORDER BY p.sort_order,p.created_at",
    args: ["chile:%"],
  });
  const templates = new Map(chileProducts.map((product) => [product.slug, product]));

  // The database determines which products are public and supplies all fields
  // that administrators can edit. A static template adds only non-editable
  // selection guidance for the established 26 product families.
  return result.rows.map((value) => {
    const row = value as unknown as CatalogRow;
    const fallback = templates.get(row.slug);
    if (fallback) {
      return {
        ...fallback,
        name: row.name || fallback.name,
        title: row.seo_title || fallback.title,
        description: row.short_description || fallback.description,
        verifiedSpecifications: readSpecifications(row.technical_specs, fallback.verifiedSpecifications),
      };
    }
    return {
      slug: row.slug,
      name: row.name,
      title: row.seo_title || `${row.name} | GRIMM PUMP Chile`,
      description: row.short_description || "Información de producto disponible según los requisitos del proyecto.",
      category: "Productos",
      processRole: "La configuración se revisa con los datos técnicos y las condiciones de instalación del proyecto.",
      driveType: "Se confirma para el proyecto",
      contexts: ["Proyectos de bombeo"],
      selectionInputs: ["Caudal y presión requeridos", "Condiciones de instalación", "Documentación del proyecto"],
      verifiedSpecifications: readSpecifications(row.technical_specs, [["Configuración", "Se confirma para el proyecto"]]),
      faq: [],
      relatedSolutions: [],
    };
  });
}
