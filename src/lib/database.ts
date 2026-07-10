import { randomUUID } from "node:crypto";
import { createClient, type Client, type InStatement } from "@libsql/client";

let client: Client | undefined;
let initialized = false;

function getClient() {
  if (!client) {
    client = createClient({
      url: process.env.DATABASE_URL || "file:./data/grimm-latam.db",
      authToken: process.env.DATABASE_AUTH_TOKEN,
    });
  }
  return client;
}

async function ensureColumn(db: Client, statement: string) {
  try { await db.execute(statement); } catch { /* The local database may already contain this additive column. */ }
}

async function seedRolesAndAdmin(db: Client) {
  const now = new Date().toISOString();
  const roles = ["super_admin", "admin", "editor", "marketing", "sales", "analyst", "viewer"];
  for (const role of roles) {
    await db.execute({ sql: "INSERT OR IGNORE INTO roles (id, name, label, created_at) VALUES (?, ?, ?, ?)", args: [role, role, role, now] });
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

export async function getDatabase() {
  const db = getClient();
  if (!initialized) {
    await db.executeMultiple(`
      PRAGMA foreign_keys = ON;
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
      CREATE TABLE IF NOT EXISTS news_categories (
        id TEXT PRIMARY KEY, name TEXT NOT NULL, slug TEXT NOT NULL UNIQUE, sort_order INTEGER NOT NULL DEFAULT 0,
        is_enabled INTEGER NOT NULL DEFAULT 1, seo_title TEXT, seo_description TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, deleted_at TEXT
      );
      CREATE TABLE IF NOT EXISTS news_articles (
        id TEXT PRIMARY KEY, category_id TEXT, status TEXT NOT NULL DEFAULT 'draft', is_featured INTEGER NOT NULL DEFAULT 0,
        sort_order INTEGER NOT NULL DEFAULT 0, published_at TEXT, scheduled_at TEXT, author_id TEXT,
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
    `);
    await ensureColumn(db, "ALTER TABLE leads ADD COLUMN assignee_id TEXT");
    await ensureColumn(db, "ALTER TABLE leads ADD COLUMN tags TEXT");
    await ensureColumn(db, "ALTER TABLE leads ADD COLUMN updated_at TEXT");
    await ensureColumn(db, "ALTER TABLE leads ADD COLUMN deleted_at TEXT");
    await ensureColumn(db, "ALTER TABLE audit_logs ADD COLUMN actor_id TEXT");
    await ensureColumn(db, "ALTER TABLE audit_logs ADD COLUMN ip_hash TEXT");
    await ensureColumn(db, "ALTER TABLE audit_logs ADD COLUMN user_agent TEXT");
    await ensureColumn(db, "ALTER TABLE audit_logs ADD COLUMN result TEXT NOT NULL DEFAULT 'success'");
    await db.execute("CREATE INDEX IF NOT EXISTS audit_logs_actor_idx ON audit_logs(actor_id, created_at)");
    await seedRolesAndAdmin(db);
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
