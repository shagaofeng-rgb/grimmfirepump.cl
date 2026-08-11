import { randomUUID } from "node:crypto";
import { createClient, type InStatement } from "@libsql/client";
import { Pool } from "@neondatabase/serverless";
import { products as legacyProducts } from "@/lib/products";

type DatabaseResult = { rows: Record<string, unknown>[] };
type DatabaseClient = {
  execute(statement: string | InStatement): Promise<DatabaseResult>;
  executeMultiple(sql: string): Promise<void>;
};

class NeonDatabaseClient implements DatabaseClient {
  private readonly pool: Pool;

  constructor(connectionString: string) {
    this.pool = new Pool({ connectionString, max: 1 });
  }

  async execute(statement: string | InStatement) {
    const sql = typeof statement === "string" ? statement : statement.sql;
    const args = typeof statement === "string" ? [] : Object.values(statement.args || {});
    let parameter = 0;
    const postgresSql = sql.replace(/\?/g, () => `$${++parameter}`);
    const result = await this.pool.query(postgresSql, args as unknown[]);
    return { rows: result.rows as Record<string, unknown>[] };
  }

  async executeMultiple(sql: string) {
    await this.pool.query(sql);
  }
}

let client: DatabaseClient | undefined;
let initialized = false;

function getClient() {
  if (!client) {
    const url = process.env.DATABASE_URL;
    if (url?.startsWith("postgres")) client = new NeonDatabaseClient(url);
    else {
      if (process.env.VERCEL) throw new Error("DATABASE_URL is required for the production admin database");
      client = createClient({ url: url || "file:./data/grimm-latam.db", authToken: process.env.DATABASE_AUTH_TOKEN }) as unknown as DatabaseClient;
    }
  }
  return client;
}

async function ensureColumn(db: DatabaseClient, statement: string) {
  try { await db.execute(statement); } catch { /* The local database may already contain this additive column. */ }
}

async function seedRolesAndAdmin(db: DatabaseClient) {
  const now = new Date().toISOString();
  const roles = ["super_admin", "admin", "editor", "marketing", "sales", "analyst", "viewer"];
  for (const role of roles) {
    await db.execute({ sql: "INSERT INTO roles (id, name, label, created_at) VALUES (?, ?, ?, ?) ON CONFLICT (id) DO NOTHING", args: [role, role, role, now] });
  }

  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) return;
  const existing = await db.execute({ sql: "SELECT id FROM users WHERE email = ?", args: [email] });
  if (existing.rows.length) return;
  const { hash } = await import("bcryptjs");
  await db.execute({
    sql: "INSERT INTO users (id, email, name, password_hash, role, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    args: [randomUUID(), email, "初始超级管理员", await hash(password, 12), "super_admin", "active", now, now],
  });
}

async function migrateLegacyCatalog(db: DatabaseClient) {
  const existing = await db.execute("SELECT COUNT(*) AS total FROM products WHERE deleted_at IS NULL");
  if (Number(existing.rows[0]?.total || 0) > 0) return;
  const now = new Date().toISOString(); const categories = new Map<string, string>();
  for (const product of legacyProducts) {
    let categoryId = categories.get(product.category);
    if (!categoryId) {
      categoryId = randomUUID(); categories.set(product.category, categoryId);
      await db.execute({ sql: "INSERT INTO product_categories (id,name,slug,sort_order,is_enabled,show_in_nav,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?)", args: [categoryId, product.category, product.category.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || `category-${categories.size}`, categories.size, 1, 1, now, now] });
    }
    const id = randomUUID(); const specs = Object.fromEntries(product.specs);
    await db.execute({ sql: "INSERT INTO products (id,category_id,status,is_featured,sort_order,technical_specs,created_at,updated_at,published_at) VALUES (?,?,?,?,?,?,?,?,?)", args: [id, categoryId, "published", 1, categories.size, JSON.stringify(specs), now, now, now] });
    await db.execute({ sql: "INSERT INTO product_translations (id,product_id,locale,name,slug,short_description,content,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?)", args: [randomUUID(), id, "es", product.name, product.slug, product.description, null, now, now] });
  }
}

export async function getDatabase() {
  const db = getClient();
  if (!initialized) {
    await db.executeMultiple(`
      CREATE TABLE IF NOT EXISTS roles (id TEXT PRIMARY KEY, name TEXT NOT NULL UNIQUE, label TEXT NOT NULL, created_at TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE, name TEXT NOT NULL, password_hash TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'viewer', status TEXT NOT NULL DEFAULT 'active', failed_login_count INTEGER NOT NULL DEFAULT 0,
        locked_until TEXT, last_login_at TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
        FOREIGN KEY(role) REFERENCES roles(id)
      );
      CREATE INDEX IF NOT EXISTS users_role_idx ON users(role);
      CREATE TABLE IF NOT EXISTS login_attempts (
        id TEXT PRIMARY KEY, email TEXT NOT NULL, ip_hash TEXT, success INTEGER NOT NULL, created_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS login_attempts_email_idx ON login_attempts(email, created_at);
      CREATE TABLE IF NOT EXISTS product_categories (
        id TEXT PRIMARY KEY, name TEXT NOT NULL, slug TEXT NOT NULL UNIQUE, parent_id TEXT, description TEXT,
        sort_order INTEGER NOT NULL DEFAULT 0, is_enabled INTEGER NOT NULL DEFAULT 1, show_in_nav INTEGER NOT NULL DEFAULT 0,
        seo_title TEXT, seo_description TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, deleted_at TEXT,
        FOREIGN KEY(parent_id) REFERENCES product_categories(id)
      );
      CREATE INDEX IF NOT EXISTS product_categories_parent_idx ON product_categories(parent_id, sort_order);
      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY, sku TEXT UNIQUE, category_id TEXT, status TEXT NOT NULL DEFAULT 'draft', is_featured INTEGER NOT NULL DEFAULT 0,
        sort_order INTEGER NOT NULL DEFAULT 0, published_at TEXT, scheduled_at TEXT, technical_specs TEXT,
        created_by TEXT, updated_by TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, deleted_at TEXT,
        FOREIGN KEY(category_id) REFERENCES product_categories(id), FOREIGN KEY(created_by) REFERENCES users(id), FOREIGN KEY(updated_by) REFERENCES users(id)
      );
      CREATE INDEX IF NOT EXISTS products_status_idx ON products(status, published_at);
      CREATE INDEX IF NOT EXISTS products_category_idx ON products(category_id, sort_order);
      CREATE TABLE IF NOT EXISTS product_translations (
        id TEXT PRIMARY KEY, product_id TEXT NOT NULL, locale TEXT NOT NULL, name TEXT NOT NULL, slug TEXT NOT NULL,
        short_description TEXT, content TEXT, seo_title TEXT, seo_description TEXT, canonical_url TEXT, robots TEXT NOT NULL DEFAULT 'index,follow',
        translation_status TEXT NOT NULL DEFAULT 'complete', created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
        UNIQUE(product_id, locale), UNIQUE(locale, slug), FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE CASCADE
      );
      CREATE INDEX IF NOT EXISTS product_translations_slug_idx ON product_translations(locale, slug);
      CREATE TABLE IF NOT EXISTS media_assets (
        id TEXT PRIMARY KEY, storage_key TEXT NOT NULL UNIQUE, url TEXT NOT NULL, filename TEXT NOT NULL, mime_type TEXT NOT NULL,
        byte_size INTEGER NOT NULL, alt_text TEXT, caption TEXT, created_by TEXT, created_at TEXT NOT NULL, deleted_at TEXT,
        FOREIGN KEY(created_by) REFERENCES users(id)
      );
      CREATE TABLE IF NOT EXISTS site_pages (
        id TEXT PRIMARY KEY, title TEXT NOT NULL, slug TEXT NOT NULL UNIQUE, content TEXT, status TEXT NOT NULL DEFAULT 'draft',
        created_by TEXT, updated_by TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, deleted_at TEXT,
        FOREIGN KEY(created_by) REFERENCES users(id), FOREIGN KEY(updated_by) REFERENCES users(id)
      );
      CREATE TABLE IF NOT EXISTS download_assets (
        id TEXT PRIMARY KEY, name TEXT NOT NULL, file_url TEXT NOT NULL, category TEXT, status TEXT NOT NULL DEFAULT 'published',
        created_by TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, deleted_at TEXT,
        FOREIGN KEY(created_by) REFERENCES users(id)
      );
      CREATE TABLE IF NOT EXISTS form_configurations (
        id TEXT PRIMARY KEY, name TEXT NOT NULL, form_type TEXT NOT NULL DEFAULT 'contact', status TEXT NOT NULL DEFAULT 'active',
        notification_email TEXT, fields_json TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, deleted_at TEXT
      );
      CREATE TABLE IF NOT EXISTS news_categories (
        id TEXT PRIMARY KEY, name TEXT NOT NULL, slug TEXT NOT NULL UNIQUE, sort_order INTEGER NOT NULL DEFAULT 0,
        is_enabled INTEGER NOT NULL DEFAULT 1, seo_title TEXT, seo_description TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, deleted_at TEXT
      );
      CREATE TABLE IF NOT EXISTS news_articles (
        id TEXT PRIMARY KEY, category_id TEXT, status TEXT NOT NULL DEFAULT 'draft', is_featured INTEGER NOT NULL DEFAULT 0,
        sort_order INTEGER NOT NULL DEFAULT 0, published_at TEXT, scheduled_at TEXT, author_id TEXT,
        external_fingerprint TEXT, external_author_id TEXT, cover_image_url TEXT,
        created_at TEXT NOT NULL, updated_at TEXT NOT NULL, deleted_at TEXT,
        FOREIGN KEY(category_id) REFERENCES news_categories(id), FOREIGN KEY(author_id) REFERENCES users(id)
      );
      CREATE INDEX IF NOT EXISTS news_articles_status_idx ON news_articles(status, published_at);
      CREATE TABLE IF NOT EXISTS news_translations (
        id TEXT PRIMARY KEY, article_id TEXT NOT NULL, locale TEXT NOT NULL, title TEXT NOT NULL, slug TEXT NOT NULL,
        excerpt TEXT, content TEXT, seo_title TEXT, seo_description TEXT, canonical_url TEXT, robots TEXT NOT NULL DEFAULT 'index,follow',
        created_at TEXT NOT NULL, updated_at TEXT NOT NULL, UNIQUE(article_id, locale), UNIQUE(locale, slug),
        FOREIGN KEY(article_id) REFERENCES news_articles(id) ON DELETE CASCADE
      );
      CREATE INDEX IF NOT EXISTS news_translations_slug_idx ON news_translations(locale, slug);
      CREATE TABLE IF NOT EXISTS leads (
        id TEXT PRIMARY KEY, name TEXT NOT NULL, company TEXT NOT NULL, email TEXT NOT NULL,
        country TEXT NOT NULL, product_interest TEXT, flow TEXT, pressure TEXT, message TEXT NOT NULL,
        locale TEXT NOT NULL, source_path TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'new', assignee_id TEXT,
        tags TEXT, created_at TEXT NOT NULL, updated_at TEXT, deleted_at TEXT, FOREIGN KEY(assignee_id) REFERENCES users(id)
      );
      CREATE INDEX IF NOT EXISTS leads_created_at_idx ON leads(created_at); CREATE INDEX IF NOT EXISTS leads_email_idx ON leads(email);
      CREATE INDEX IF NOT EXISTS leads_status_idx ON leads(status, created_at); CREATE INDEX IF NOT EXISTS leads_country_idx ON leads(country);
      CREATE TABLE IF NOT EXISTS lead_notes (
        id TEXT PRIMARY KEY, lead_id TEXT NOT NULL, body TEXT NOT NULL, created_by TEXT, created_at TEXT NOT NULL,
        FOREIGN KEY(lead_id) REFERENCES leads(id) ON DELETE CASCADE, FOREIGN KEY(created_by) REFERENCES users(id)
      );
      CREATE TABLE IF NOT EXISTS analytics_daily (
        id TEXT PRIMARY KEY, metric_date TEXT NOT NULL, page_path TEXT NOT NULL DEFAULT '', country TEXT NOT NULL DEFAULT '', device TEXT NOT NULL DEFAULT '',
        source TEXT NOT NULL DEFAULT '', page_views INTEGER NOT NULL DEFAULT 0, visitors INTEGER NOT NULL DEFAULT 0, sessions INTEGER NOT NULL DEFAULT 0,
        conversions INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
        UNIQUE(metric_date, page_path, country, device, source)
      );
      CREATE INDEX IF NOT EXISTS analytics_daily_date_idx ON analytics_daily(metric_date);
      CREATE TABLE IF NOT EXISTS seo_metrics (
        id TEXT PRIMARY KEY, metric_date TEXT NOT NULL, property TEXT NOT NULL, dimension_type TEXT NOT NULL, dimension_value TEXT NOT NULL,
        clicks INTEGER NOT NULL DEFAULT 0, impressions INTEGER NOT NULL DEFAULT 0, ctr REAL NOT NULL DEFAULT 0, position REAL,
        created_at TEXT NOT NULL, UNIQUE(metric_date, property, dimension_type, dimension_value)
      );
      CREATE INDEX IF NOT EXISTS seo_metrics_date_idx ON seo_metrics(metric_date, dimension_type);
      CREATE TABLE IF NOT EXISTS seo_issues (
        id TEXT PRIMARY KEY, issue_type TEXT NOT NULL, severity TEXT NOT NULL, page_path TEXT NOT NULL, message TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'open', detected_at TEXT NOT NULL, resolved_at TEXT, assigned_to TEXT, FOREIGN KEY(assigned_to) REFERENCES users(id)
      );
      CREATE TABLE IF NOT EXISTS sync_runs (
        id TEXT PRIMARY KEY, source TEXT NOT NULL, run_type TEXT NOT NULL, status TEXT NOT NULL, started_at TEXT NOT NULL, finished_at TEXT,
        records_processed INTEGER NOT NULL DEFAULT 0, error_code TEXT, error_message TEXT, cursor_value TEXT, initiated_by TEXT,
        FOREIGN KEY(initiated_by) REFERENCES users(id)
      );
      CREATE INDEX IF NOT EXISTS sync_runs_source_idx ON sync_runs(source, started_at);
      CREATE TABLE IF NOT EXISTS system_settings (key TEXT PRIMARY KEY, value TEXT NOT NULL, is_secret INTEGER NOT NULL DEFAULT 0, updated_by TEXT, updated_at TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS audit_logs (
        id TEXT PRIMARY KEY, action TEXT NOT NULL, entity_type TEXT NOT NULL, entity_id TEXT, actor_id TEXT,
        details TEXT, ip_hash TEXT, user_agent TEXT, result TEXT NOT NULL DEFAULT 'success', created_at TEXT NOT NULL,
        FOREIGN KEY(actor_id) REFERENCES users(id)
      );
      CREATE INDEX IF NOT EXISTS audit_logs_created_at_idx ON audit_logs(created_at);
      CREATE TABLE IF NOT EXISTS industry_news_sites (
        site_id TEXT PRIMARY KEY, enabled INTEGER NOT NULL DEFAULT 0, brand_name TEXT NOT NULL, site_url TEXT NOT NULL,
        industry TEXT NOT NULL, industry_scope TEXT NOT NULL, target_markets TEXT NOT NULL, publication_language TEXT NOT NULL,
        locale TEXT NOT NULL, timezone TEXT NOT NULL, list_route TEXT NOT NULL, detail_route_pattern TEXT NOT NULL,
        rss_route TEXT NOT NULL, sitemap_route TEXT NOT NULL, desired_word_min INTEGER NOT NULL DEFAULT 700,
        desired_word_max INTEGER NOT NULL DEFAULT 1000, ingest_interval_hours INTEGER NOT NULL DEFAULT 12,
        publish_interval_hours INTEGER NOT NULL DEFAULT 48, candidate_max_age_hours INTEGER NOT NULL DEFAULT 72,
        fallback_candidate_max_age_days INTEGER NOT NULL DEFAULT 7, min_score INTEGER NOT NULL DEFAULT 70,
        max_internal_product_links INTEGER NOT NULL DEFAULT 1, default_author_type TEXT NOT NULL DEFAULT 'Editorial Team',
        require_frontend_verification INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL, updated_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS industry_news_sources (
        id TEXT PRIMARY KEY, site_id TEXT NOT NULL, tier TEXT NOT NULL CHECK(tier IN ('primary','fallback')), domain TEXT NOT NULL,
        source_type TEXT NOT NULL, allowed_topics TEXT NOT NULL, allowed_languages TEXT NOT NULL, feed_url TEXT NOT NULL,
        source_trust_score INTEGER NOT NULL, is_enabled INTEGER NOT NULL DEFAULT 1, last_healthy_at TEXT,
        created_at TEXT NOT NULL, updated_at TEXT NOT NULL, UNIQUE(site_id, feed_url),
        FOREIGN KEY(site_id) REFERENCES industry_news_sites(site_id) ON DELETE CASCADE
      );
      CREATE TABLE IF NOT EXISTS industry_news_theme_windows (
        id TEXT PRIMARY KEY, site_id TEXT NOT NULL, theme_id TEXT NOT NULL, product_url TEXT NOT NULL, product_name TEXT NOT NULL,
        start_at TEXT NOT NULL, end_at TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'active', created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
        UNIQUE(site_id, theme_id), FOREIGN KEY(site_id) REFERENCES industry_news_sites(site_id) ON DELETE CASCADE
      );
      CREATE TABLE IF NOT EXISTS industry_news_ingest_runs (
        id TEXT PRIMARY KEY, site_id TEXT NOT NULL, cycle_key TEXT NOT NULL, status TEXT NOT NULL, started_at TEXT NOT NULL, finished_at TEXT,
        discovered_count INTEGER NOT NULL DEFAULT 0, candidate_count INTEGER NOT NULL DEFAULT 0, rejected_count INTEGER NOT NULL DEFAULT 0,
        error_summary TEXT, created_at TEXT NOT NULL, UNIQUE(site_id, cycle_key),
        FOREIGN KEY(site_id) REFERENCES industry_news_sites(site_id) ON DELETE CASCADE
      );
      CREATE TABLE IF NOT EXISTS industry_news_candidates (
        id TEXT PRIMARY KEY, site_id TEXT NOT NULL, source_id TEXT NOT NULL, normalized_url TEXT NOT NULL, normalized_url_hash TEXT NOT NULL,
        title TEXT NOT NULL, title_hash TEXT NOT NULL, summary TEXT, source_name TEXT NOT NULL, source_published_at TEXT NOT NULL,
        source_author TEXT, language TEXT, media_url TEXT, image_rights_status TEXT NOT NULL DEFAULT 'unknown', industry_tags TEXT NOT NULL,
        relevance_score INTEGER NOT NULL, status TEXT NOT NULL, reject_reason TEXT, content_fingerprint TEXT NOT NULL,
        reserved_cycle_key TEXT, used_by_article_id TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
        UNIQUE(site_id, normalized_url_hash), UNIQUE(site_id, content_fingerprint),
        FOREIGN KEY(site_id) REFERENCES industry_news_sites(site_id) ON DELETE CASCADE,
        FOREIGN KEY(source_id) REFERENCES industry_news_sources(id) ON DELETE CASCADE
      );
      CREATE INDEX IF NOT EXISTS industry_news_candidates_select_idx ON industry_news_candidates(site_id,status,relevance_score,source_published_at);
      CREATE TABLE IF NOT EXISTS industry_news_articles (
        id TEXT PRIMARY KEY, site_id TEXT NOT NULL, candidate_id TEXT NOT NULL UNIQUE, status TEXT NOT NULL, slug TEXT NOT NULL,
        title TEXT NOT NULL, deck TEXT NOT NULL, content TEXT NOT NULL, source_name TEXT NOT NULL, source_url TEXT NOT NULL,
        source_published_at TEXT NOT NULL, source_author TEXT, image_url TEXT, image_rights_status TEXT NOT NULL,
        editorial_disclaimer TEXT NOT NULL, product_url TEXT, product_name TEXT, seo_title TEXT NOT NULL, seo_description TEXT NOT NULL,
        canonical_url TEXT NOT NULL, published_at TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, archived_at TEXT,
        UNIQUE(site_id, slug), FOREIGN KEY(site_id) REFERENCES industry_news_sites(site_id) ON DELETE CASCADE,
        FOREIGN KEY(candidate_id) REFERENCES industry_news_candidates(id) ON DELETE RESTRICT
      );
      CREATE INDEX IF NOT EXISTS industry_news_articles_public_idx ON industry_news_articles(site_id,status,published_at);
      CREATE TABLE IF NOT EXISTS industry_news_publication_runs (
        id TEXT PRIMARY KEY, site_id TEXT NOT NULL, cycle_key TEXT NOT NULL, status TEXT NOT NULL, candidate_id TEXT, article_id TEXT,
        attempts INTEGER NOT NULL DEFAULT 0, started_at TEXT NOT NULL, finished_at TEXT, error_code TEXT, error_message TEXT,
        idempotency_key TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, UNIQUE(site_id, cycle_key),
        UNIQUE(site_id, idempotency_key), FOREIGN KEY(site_id) REFERENCES industry_news_sites(site_id) ON DELETE CASCADE
      );
      CREATE TABLE IF NOT EXISTS industry_news_delivery_checks (
        id TEXT PRIMARY KEY, site_id TEXT NOT NULL, article_id TEXT NOT NULL, check_type TEXT NOT NULL, check_url TEXT NOT NULL,
        http_status INTEGER, passed INTEGER NOT NULL, details TEXT, checked_at TEXT NOT NULL,
        FOREIGN KEY(site_id) REFERENCES industry_news_sites(site_id) ON DELETE CASCADE,
        FOREIGN KEY(article_id) REFERENCES industry_news_articles(id) ON DELETE CASCADE
      );
      CREATE TABLE IF NOT EXISTS industry_news_audit_events (
        id TEXT PRIMARY KEY, site_id TEXT NOT NULL, event_type TEXT NOT NULL, entity_type TEXT, entity_id TEXT,
        details TEXT, result TEXT NOT NULL, created_at TEXT NOT NULL,
        FOREIGN KEY(site_id) REFERENCES industry_news_sites(site_id) ON DELETE CASCADE
      );
      CREATE TABLE IF NOT EXISTS industry_news_locks (
        lock_key TEXT PRIMARY KEY, site_id TEXT NOT NULL, expires_at TEXT NOT NULL, heartbeat_at TEXT NOT NULL, created_at TEXT NOT NULL,
        FOREIGN KEY(site_id) REFERENCES industry_news_sites(site_id) ON DELETE CASCADE
      );
    `);
    await ensureColumn(db, "ALTER TABLE leads ADD COLUMN assignee_id TEXT");
    await ensureColumn(db, "ALTER TABLE leads ADD COLUMN tags TEXT");
    await ensureColumn(db, "ALTER TABLE leads ADD COLUMN updated_at TEXT");
    await ensureColumn(db, "ALTER TABLE leads ADD COLUMN deleted_at TEXT");
    await ensureColumn(db, "ALTER TABLE audit_logs ADD COLUMN actor_id TEXT");
    await ensureColumn(db, "ALTER TABLE audit_logs ADD COLUMN ip_hash TEXT");
    await ensureColumn(db, "ALTER TABLE audit_logs ADD COLUMN user_agent TEXT");
    await ensureColumn(db, "ALTER TABLE audit_logs ADD COLUMN result TEXT NOT NULL DEFAULT 'success'");
    await ensureColumn(db, "ALTER TABLE news_articles ADD COLUMN external_fingerprint TEXT");
    await ensureColumn(db, "ALTER TABLE news_articles ADD COLUMN external_author_id TEXT");
    await ensureColumn(db, "ALTER TABLE news_articles ADD COLUMN cover_image_url TEXT");
    await db.execute("CREATE INDEX IF NOT EXISTS audit_logs_actor_idx ON audit_logs(actor_id, created_at)");
    await db.execute("CREATE UNIQUE INDEX IF NOT EXISTS news_articles_external_fingerprint_unique ON news_articles(external_fingerprint) WHERE external_fingerprint IS NOT NULL");
    await seedRolesAndAdmin(db);
    await migrateLegacyCatalog(db);
    initialized = true;
  }
  return db;
}

export async function writeAudit(input: { action: string; entityType: string; entityId?: string; actorId?: string; details?: Record<string, unknown>; result?: "success" | "failure"; ipHash?: string; userAgent?: string }) {
  const db = await getDatabase();
  await db.execute({
    sql: "INSERT INTO audit_logs (id,action,entity_type,entity_id,actor_id,details,ip_hash,user_agent,result,created_at) VALUES (?,?,?,?,?,?,?,?,?,?)",
    args: [randomUUID(), input.action, input.entityType, input.entityId || null, input.actorId || null, input.details ? JSON.stringify(input.details) : null, input.ipHash || null, input.userAgent || null, input.result || "success", new Date().toISOString()],
  });
}

export type DatabaseStatement = InStatement;
