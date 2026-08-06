import { getDatabase } from "@/lib/database";

export type PublicBlogPost = {
  id: string; slug: string; title: string; excerpt: string | null; content: string | null;
  publishedAt: string; coverImageUrl: string | null; authorId: string | null; category: string | null;
};

function rowToPost(row: Record<string, unknown>): PublicBlogPost {
  return { id: String(row.id), slug: String(row.slug), title: String(row.title), excerpt: row.excerpt ? String(row.excerpt) : null, content: row.content ? String(row.content) : null, publishedAt: String(row.published_at), coverImageUrl: row.cover_image_url ? String(row.cover_image_url) : null, authorId: row.external_author_id ? String(row.external_author_id) : null, category: row.category_name ? String(row.category_name) : null };
}

const publishedSql = "SELECT n.id,n.published_at,n.cover_image_url,n.external_author_id,t.slug,t.title,t.excerpt,t.content,c.name AS category_name FROM news_articles n INNER JOIN news_translations t ON t.article_id=n.id AND t.locale='es' LEFT JOIN news_categories c ON c.id=n.category_id WHERE n.deleted_at IS NULL AND n.status='published' AND n.published_at IS NOT NULL";

export async function getPublicBlogPosts() {
  const db = await getDatabase();
  const result = await db.execute(`${publishedSql} ORDER BY n.published_at DESC`);
  return result.rows.map(rowToPost);
}

export async function getPublicBlogPost(slug: string) {
  const db = await getDatabase();
  const result = await db.execute({ sql: `${publishedSql} AND t.slug=?`, args: [slug] });
  return result.rows[0] ? rowToPost(result.rows[0]) : null;
}
