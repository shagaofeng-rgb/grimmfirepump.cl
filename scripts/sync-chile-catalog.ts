import { randomUUID } from "node:crypto";
import { chileProducts } from "../src/lib/chile-content";
import { getDatabase } from "../src/lib/database";

function categorySlug(name: string) {
  return `chile-${name.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}`;
}

async function main() {
  const db = await getDatabase();
  const now = new Date().toISOString();
  let inserted = 0;
  let preserved = 0;

  for (const [index, product] of chileProducts.entries()) {
    const existing = await db.execute({ sql: "SELECT p.id FROM products p JOIN product_translations t ON t.product_id=p.id AND t.locale='es' WHERE t.slug=? AND p.deleted_at IS NULL", args: [product.slug] });
    if (existing.rows.length) { preserved += 1; continue; }

    const name = product.category || "Otros productos";
    const slug = categorySlug(name);
    const categoryResult = await db.execute({ sql: "SELECT id FROM product_categories WHERE slug=? AND deleted_at IS NULL", args: [slug] });
    const categoryId = categoryResult.rows[0]?.id ? String(categoryResult.rows[0].id) : randomUUID();
    if (!categoryResult.rows[0]) {
      await db.execute({ sql: "INSERT INTO product_categories (id,name,slug,sort_order,is_enabled,show_in_nav,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?)", args: [categoryId, name, slug, index + 1, 1, 1, now, now] });
    }

    const productId = randomUUID();
    await db.execute({ sql: "INSERT INTO products (id,sku,category_id,status,is_featured,sort_order,technical_specs,created_at,updated_at,published_at) VALUES (?,?,?,?,?,?,?,?,?,?)", args: [productId, `chile:${product.slug}`, categoryId, "published", 1, index + 1, JSON.stringify(Object.fromEntries(product.verifiedSpecifications)), now, now, now] });
    await db.execute({ sql: "INSERT INTO product_translations (id,product_id,locale,name,slug,short_description,content,seo_title,seo_description,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)", args: [randomUUID(), productId, "es", product.name, product.slug, product.description, product.processRole, product.title, product.description, now, now] });
    inserted += 1;
  }

  console.log(JSON.stringify({ catalogProducts: chileProducts.length, inserted, preserved }));
}

main().catch((error) => { console.error(error); process.exit(1); });
