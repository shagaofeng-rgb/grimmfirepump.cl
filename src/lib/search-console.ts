import { importPKCS8, SignJWT } from "jose";
import { getDatabase, writeAudit } from "@/lib/database";

type ServiceAccount = { client_email: string; private_key: string };
type SearchConsoleRow = { keys?: string[]; clicks?: number; impressions?: number; ctr?: number; position?: number };

function configuration() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  const property = process.env.GOOGLE_SEARCH_CONSOLE_PROPERTY;
  if (!raw || !property) throw new Error("search_console_not_configured");
  const credential = JSON.parse(raw) as ServiceAccount;
  if (!credential.client_email || !credential.private_key) throw new Error("search_console_invalid_credential");
  return { credential, property };
}

async function accessToken(credential: ServiceAccount) {
  const key = await importPKCS8(credential.private_key, "RS256");
  const assertion = await new SignJWT({ scope: "https://www.googleapis.com/auth/webmasters.readonly" })
    .setProtectedHeader({ alg: "RS256", typ: "JWT" }).setIssuer(credential.client_email).setAudience("https://oauth2.googleapis.com/token")
    .setIssuedAt().setExpirationTime("55m").sign(key);
  const response = await fetch("https://oauth2.googleapis.com/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion }), signal: AbortSignal.timeout(20_000) });
  if (!response.ok) throw new Error(`search_console_auth_${response.status}`);
  const payload = await response.json() as { access_token?: string };
  if (!payload.access_token) throw new Error("search_console_missing_token");
  return payload.access_token;
}

export async function syncSearchConsole(initiatedBy?: string) {
  const { credential, property } = configuration();
  const db = await getDatabase();
  const now = new Date(); const startedAt = now.toISOString();
  if (!initiatedBy) {
    const latest = await db.execute({ sql: "SELECT started_at FROM sync_runs WHERE source='google_search_console' AND run_type='scheduled' AND status='success' ORDER BY started_at DESC LIMIT 1" });
    const lastScheduledAt = latest.rows[0]?.started_at ? new Date(String(latest.rows[0].started_at)) : null;
    if (lastScheduledAt && now.getTime() - lastScheduledAt.getTime() < 72 * 60 * 60_000) {
      const id = crypto.randomUUID();
      await db.execute({ sql: "INSERT INTO sync_runs (id,source,run_type,status,started_at,finished_at,records_processed,error_code,error_message) VALUES (?,?,?,?,?,?,?,?,?)", args: [id, "google_search_console", "scheduled", "skipped", startedAt, startedAt, 0, "cadence_guard", "Skipped because the last successful scheduled sync is less than 72 hours old."] });
      await writeAudit({ action: "search_console_sync_skipped", entityType: "sync", entityId: id, details: { reason: "cadence_guard", lastScheduledAt: lastScheduledAt.toISOString() } });
      return { id, records: 0, skipped: true, reason: "cadence_guard", lastScheduledAt: lastScheduledAt.toISOString() };
    }
  }
  const running = await db.execute({ sql: "SELECT id FROM sync_runs WHERE source='google_search_console' AND status='running' AND started_at > ? LIMIT 1", args: [new Date(now.getTime() - 20 * 60_000).toISOString()] });
  if (running.rows.length) throw new Error("search_console_sync_already_running");
  const id = crypto.randomUUID();
  await db.execute({ sql: "INSERT INTO sync_runs (id,source,run_type,status,started_at,initiated_by) VALUES (?,?,?,?,?,?)", args: [id, "google_search_console", initiatedBy ? "manual" : "scheduled", "running", startedAt, initiatedBy || null] });
  try {
    const end = new Date(now); end.setUTCDate(end.getUTCDate() - 3); const start = new Date(end); start.setUTCDate(start.getUTCDate() - 27);
    const format = (date: Date) => date.toISOString().slice(0, 10);
    const token = await accessToken(credential);
    const response = await fetch(`https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(property)}/searchAnalytics/query`, {
      method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ startDate: format(start), endDate: format(end), dimensions: ["date"], rowLimit: 1000 }), signal: AbortSignal.timeout(30_000),
    });
    if (!response.ok) throw new Error(`search_console_query_${response.status}`);
    const payload = await response.json() as { rows?: SearchConsoleRow[] };
    let records = 0;
    for (const row of payload.rows || []) {
      const metricDate = row.keys?.[0]; if (!metricDate) continue;
      await db.execute({ sql: "INSERT INTO seo_metrics (id,metric_date,property,dimension_type,dimension_value,clicks,impressions,ctr,position,created_at) VALUES (?,?,?,?,?,?,?,?,?,?) ON CONFLICT(metric_date,property,dimension_type,dimension_value) DO UPDATE SET clicks=excluded.clicks,impressions=excluded.impressions,ctr=excluded.ctr,position=excluded.position,created_at=excluded.created_at", args: [crypto.randomUUID(), metricDate, property, "date", metricDate, Math.round(row.clicks || 0), Math.round(row.impressions || 0), Number(row.ctr || 0), Number(row.position || 0), new Date().toISOString()] }); records++;
    }
    await db.execute({ sql: "UPDATE sync_runs SET status='success',finished_at=?,records_processed=? WHERE id=?", args: [new Date().toISOString(), records, id] });
    await writeAudit({ action: "search_console_sync", entityType: "sync", entityId: id, actorId: initiatedBy, details: { records } });
    return { id, records, startDate: format(start), endDate: format(end) };
  } catch (error) {
    const code = error instanceof Error ? error.message.slice(0, 120) : "search_console_unknown_error";
    await db.execute({ sql: "UPDATE sync_runs SET status='failed',finished_at=?,error_code=?,error_message=? WHERE id=?", args: [new Date().toISOString(), code, "Search Console 同步失败，请检查凭据、属性权限、网络与 API 配额。", id] });
    await writeAudit({ action: "search_console_sync_failed", entityType: "sync", entityId: id, actorId: initiatedBy, details: { code }, result: "failure" });
    throw error;
  }
}
