import { createHash, randomUUID } from "node:crypto";
import type { DatabaseClient } from "@/lib/database";

export const CHILE_TIME_ZONE = "America/Santiago";

export function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export function emailHash(value: string) {
  return createHash("sha256").update(normalizeEmail(value)).digest("hex");
}

/**
 * Creates a durable customer profile only after a visitor voluntarily submits a lead.
 * Anonymous visitor IDs remain opaque browser identifiers and are never derived from IP.
 */
export async function linkLeadToCustomer(input: {
  db: DatabaseClient;
  leadId: string;
  name: string;
  company: string;
  email: string;
  country: string;
  visitorId?: string | null;
  sessionId?: string | null;
  occurredAt: string;
}) {
  const hash = emailHash(input.email);
  const existing = await input.db.execute({ sql: "SELECT id,first_seen_at FROM customer_profiles WHERE email_hash=? LIMIT 1", args: [hash] });
  const customerId = existing.rows[0]?.id ? String(existing.rows[0].id) : randomUUID();
  if (existing.rows.length) {
    await input.db.execute({
      sql: "UPDATE customer_profiles SET display_name=?,company=?,country=?,last_seen_at=?,updated_at=? WHERE id=?",
      args: [input.name, input.company, input.country, input.occurredAt, input.occurredAt, customerId],
    });
  } else {
    await input.db.execute({
      sql: "INSERT INTO customer_profiles (id,email_hash,display_name,company,country,first_seen_at,last_seen_at,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?)",
      args: [customerId, hash, input.name, input.company, input.country, input.occurredAt, input.occurredAt, input.occurredAt, input.occurredAt],
    });
  }
  await input.db.execute({ sql: "UPDATE leads SET customer_id=?,visitor_id=?,session_id=?,updated_at=? WHERE id=?", args: [customerId, input.visitorId || null, input.sessionId || null, input.occurredAt, input.leadId] });
  return customerId;
}
