import { createClient, type Client } from "@libsql/client";

let client: Client | undefined;
let initialized = false;

function getClient() {
  if (!client) client = createClient({ url: process.env.DATABASE_URL || "file:./data/grimm-latam.db" });
  return client;
}

export async function getDatabase() {
  const db = getClient();
  if (!initialized) {
    await db.executeMultiple(`
      CREATE TABLE IF NOT EXISTS leads (
        id TEXT PRIMARY KEY, name TEXT NOT NULL, company TEXT NOT NULL, email TEXT NOT NULL,
        country TEXT NOT NULL, product_interest TEXT, flow TEXT, pressure TEXT, message TEXT NOT NULL,
        locale TEXT NOT NULL, source_path TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'new',
        created_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS leads_created_at_idx ON leads(created_at);
      CREATE INDEX IF NOT EXISTS leads_email_idx ON leads(email);
      CREATE TABLE IF NOT EXISTS audit_logs (
        id TEXT PRIMARY KEY, action TEXT NOT NULL, entity_type TEXT NOT NULL, entity_id TEXT,
        details TEXT, created_at TEXT NOT NULL
      );
    `);
    initialized = true;
  }
  return db;
}
