import { importPKCS8, SignJWT } from "jose";
import { getDatabase, writeAudit } from "@/lib/database";
import { getPublicSitemapEntries, SITE_URL, sitemapFingerprint } from "@/lib/sitemap-entries";

type ServiceAccount = { client_email: string; private_key: string };
type SearchConsoleRow = { keys?: string[]; clicks?: number; impressions?: number; ctr?: number; position?: number };
type TokenScope = "readonly" | "submit";

const METRICS_SOURCE = "google_search_console";
const SITEMAP_SOURCE = "google_search_console_sitemap";
const SITEMAP_HASH_SETTING = "google_search_console_sitemap_hash";
export const GOOGLE_SITEMAP_URL = `${SITE_URL}/sitemap.xml`;
const SEVENTY_TWO_HOURS = 72 * 60 * 60_000;
type SitemapSkipReason = "sitemap_unchanged" | "cadence_guard";
type SitemapSubmissionDecision = { submit: true } | { submit: false; reason: SitemapSkipReason };

function configuration() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  const property = process.env.GOOGLE_SEARCH_CONSOLE_PROPERTY;
  if (!raw || !property) throw new Error("search_console_not_configured");
  const credential = JSON.parse(raw) as ServiceAccount;
  if (!credential.client_email || !credential.private_key) throw new Error("search_console_invalid_credential");
  return { credential, property };
}

async function accessToken(credential: ServiceAccount, scope: TokenScope) {
  const key = await importPKCS8(credential.private_key, "RS256");
  const googleScope = scope === "submit"
    ? "https://www.googleapis.com/auth/webmasters"
    : "https://www.googleapis.com/auth/webmasters.readonly";
  const assertion = await new SignJWT({ scope: googleScope })
    .setProtectedHeader({ alg: "RS256", typ: "JWT" })
    .setIssuer(credential.client_email)
    .setAudience("https://oauth2.googleapis.com/token")
    .setIssuedAt()
    .setExpirationTime("55m")
    .sign(key);
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion }),
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) throw new Error(`search_console_auth_${response.status}`);
  const payload = await response.json() as { access_token?: string };
  if (!payload.access_token) throw new Error("search_console_missing_token");
  return payload.access_token;
}

export function sitemapSubmissionDecision(input: {
  force: boolean;
  now: Date;
  lastSucceededAt?: Date | null;
  previousFingerprint?: string | null;
  fingerprint: string;
}): SitemapSubmissionDecision {
  if (input.force) return { submit: true };
  if (input.previousFingerprint === input.fingerprint) return { submit: false, reason: "sitemap_unchanged" };
  if (input.lastSucceededAt && input.now.getTime() - input.lastSucceededAt.getTime() < SEVENTY_TWO_HOURS) {
    return { submit: false, reason: "cadence_guard" };
  }
  return { submit: true };
}

async function insertSkippedSitemapRun(reason: "sitemap_unchanged" | "cadence_guard", startedAt: string, details: Record<string, unknown>) {
  const db = await getDatabase();
  const id = crypto.randomUUID();
  await db.execute({
    sql: "INSERT INTO sync_runs (id,source,run_type,status,started_at,finished_at,records_processed,error_code,error_message) VALUES (?,?,?,?,?,?,?,?,?)",
    args: [id, SITEMAP_SOURCE, "scheduled", "skipped", startedAt, startedAt, 0, reason, reason === "sitemap_unchanged" ? "Sitemap unchanged since the last successful Google submission." : "Last successful Sitemap submission is less than 72 hours old."],
  });
  await writeAudit({ action: "search_console_sitemap_skipped", entityType: "sync", entityId: id, details: { reason, ...details } });
  return { id, status: "skipped" as const, reason };
}

/**
 * Submits the canonical Sitemap through the Google Search Console Sitemaps API.
 * A successful API acknowledgement is logged as delivery, not as an indexing claim.
 */
export async function submitSearchConsoleSitemap(initiatedBy?: string) {
  const { credential, property } = configuration();
  const db = await getDatabase();
  const now = new Date();
  const startedAt = now.toISOString();
  const entries = await getPublicSitemapEntries();
  const fingerprint = sitemapFingerprint(entries);
  const [latest, storedHash] = await Promise.all([
    db.execute({ sql: "SELECT started_at FROM sync_runs WHERE source=? AND run_type='scheduled' AND status='success' ORDER BY started_at DESC LIMIT 1", args: [SITEMAP_SOURCE] }),
    db.execute({ sql: "SELECT value FROM system_settings WHERE key=? LIMIT 1", args: [SITEMAP_HASH_SETTING] }),
  ]);
  const lastSucceededAt = latest.rows[0]?.started_at ? new Date(String(latest.rows[0].started_at)) : null;
  const previousFingerprint = storedHash.rows[0]?.value ? String(storedHash.rows[0].value) : null;
  const decision = sitemapSubmissionDecision({ force: Boolean(initiatedBy), now, lastSucceededAt, previousFingerprint, fingerprint });
  if (!decision.submit) return insertSkippedSitemapRun(decision.reason, startedAt, { sitemapUrl: GOOGLE_SITEMAP_URL, urlCount: entries.length });

  const running = await db.execute({
    sql: "SELECT id FROM sync_runs WHERE source=? AND status='running' AND started_at > ? LIMIT 1",
    args: [SITEMAP_SOURCE, new Date(now.getTime() - 20 * 60_000).toISOString()],
  });
  if (running.rows.length) throw new Error("search_console_sitemap_already_running");

  const id = crypto.randomUUID();
  await db.execute({
    sql: "INSERT INTO sync_runs (id,source,run_type,status,started_at,initiated_by,cursor_value) VALUES (?,?,?,?,?,?,?)",
    args: [id, SITEMAP_SOURCE, initiatedBy ? "manual" : "scheduled", "running", startedAt, initiatedBy || null, fingerprint],
  });
  try {
    const token = await accessToken(credential, "submit");
    const response = await fetch(
      `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(property)}/sitemaps/${encodeURIComponent(GOOGLE_SITEMAP_URL)}`,
      { method: "PUT", headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(30_000) },
    );
    if (!response.ok) throw new Error(`search_console_sitemap_submit_${response.status}`);
    const finishedAt = new Date().toISOString();
    await db.execute({
      sql: "INSERT INTO system_settings (key,value,is_secret,updated_by,updated_at) VALUES (?,?,?,?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value,is_secret=excluded.is_secret,updated_by=excluded.updated_by,updated_at=excluded.updated_at",
      args: [SITEMAP_HASH_SETTING, fingerprint, 0, initiatedBy || null, finishedAt],
    });
    await db.execute({ sql: "UPDATE sync_runs SET status='success',finished_at=?,records_processed=? WHERE id=?", args: [finishedAt, entries.length, id] });
    await writeAudit({ action: "search_console_sitemap_submitted", entityType: "sync", entityId: id, actorId: initiatedBy, details: { sitemapUrl: GOOGLE_SITEMAP_URL, urlCount: entries.length, fingerprint: fingerprint.slice(0, 12) } });
    return { id, status: "submitted" as const, sitemapUrl: GOOGLE_SITEMAP_URL, urlCount: entries.length };
  } catch (error) {
    const code = error instanceof Error ? error.message.slice(0, 120) : "search_console_sitemap_unknown_error";
    await db.execute({ sql: "UPDATE sync_runs SET status='failed',finished_at=?,error_code=?,error_message=? WHERE id=?", args: [new Date().toISOString(), code, "Google Sitemap 提交失败，请检查服务账号是否拥有该属性的完整权限、写入授权范围与 API 配额。", id] });
    await writeAudit({ action: "search_console_sitemap_submission_failed", entityType: "sync", entityId: id, actorId: initiatedBy, details: { code, sitemapUrl: GOOGLE_SITEMAP_URL }, result: "failure" });
    throw error;
  }
}

export async function syncSearchConsole(initiatedBy?: string) {
  const { credential, property } = configuration();
  const db = await getDatabase();
  const now = new Date();
  const startedAt = now.toISOString();
  if (!initiatedBy) {
    const latest = await db.execute({ sql: "SELECT started_at FROM sync_runs WHERE source=? AND run_type='scheduled' AND status='success' ORDER BY started_at DESC LIMIT 1", args: [METRICS_SOURCE] });
    const lastScheduledAt = latest.rows[0]?.started_at ? new Date(String(latest.rows[0].started_at)) : null;
    if (lastScheduledAt && now.getTime() - lastScheduledAt.getTime() < SEVENTY_TWO_HOURS) {
      const id = crypto.randomUUID();
      await db.execute({
        sql: "INSERT INTO sync_runs (id,source,run_type,status,started_at,finished_at,records_processed,error_code,error_message) VALUES (?,?,?,?,?,?,?,?,?)",
        args: [id, METRICS_SOURCE, "scheduled", "skipped", startedAt, startedAt, 0, "cadence_guard", "Skipped because the last successful scheduled sync is less than 72 hours old."],
      });
      await writeAudit({ action: "search_console_sync_skipped", entityType: "sync", entityId: id, details: { reason: "cadence_guard", lastScheduledAt: lastScheduledAt.toISOString() } });
      return { id, records: 0, skipped: true, reason: "cadence_guard", lastScheduledAt: lastScheduledAt.toISOString() };
    }
  }
  const running = await db.execute({ sql: "SELECT id FROM sync_runs WHERE source=? AND status='running' AND started_at > ? LIMIT 1", args: [METRICS_SOURCE, new Date(now.getTime() - 20 * 60_000).toISOString()] });
  if (running.rows.length) throw new Error("search_console_sync_already_running");

  const id = crypto.randomUUID();
  await db.execute({ sql: "INSERT INTO sync_runs (id,source,run_type,status,started_at,initiated_by) VALUES (?,?,?,?,?,?)", args: [id, METRICS_SOURCE, initiatedBy ? "manual" : "scheduled", "running", startedAt, initiatedBy || null] });
  let result: { id: string; records: number; startDate: string; endDate: string };
  try {
    const end = new Date(now); end.setUTCDate(end.getUTCDate() - 3);
    const start = new Date(end); start.setUTCDate(start.getUTCDate() - 27);
    const format = (date: Date) => date.toISOString().slice(0, 10);
    const token = await accessToken(credential, "readonly");
    const response = await fetch(`https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(property)}/searchAnalytics/query`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ startDate: format(start), endDate: format(end), dimensions: ["date"], rowLimit: 1000 }),
      signal: AbortSignal.timeout(30_000),
    });
    if (!response.ok) throw new Error(`search_console_query_${response.status}`);
    const payload = await response.json() as { rows?: SearchConsoleRow[] };
    let records = 0;
    for (const row of payload.rows || []) {
      const metricDate = row.keys?.[0];
      if (!metricDate) continue;
      await db.execute({
        sql: "INSERT INTO seo_metrics (id,metric_date,property,dimension_type,dimension_value,clicks,impressions,ctr,position,created_at) VALUES (?,?,?,?,?,?,?,?,?,?) ON CONFLICT(metric_date,property,dimension_type,dimension_value) DO UPDATE SET clicks=excluded.clicks,impressions=excluded.impressions,ctr=excluded.ctr,position=excluded.position,created_at=excluded.created_at",
        args: [crypto.randomUUID(), metricDate, property, "date", metricDate, Math.round(row.clicks || 0), Math.round(row.impressions || 0), Number(row.ctr || 0), Number(row.position || 0), new Date().toISOString()],
      });
      records++;
    }
    await db.execute({ sql: "UPDATE sync_runs SET status='success',finished_at=?,records_processed=? WHERE id=?", args: [new Date().toISOString(), records, id] });
    await writeAudit({ action: "search_console_sync", entityType: "sync", entityId: id, actorId: initiatedBy, details: { records } });
    result = { id, records, startDate: format(start), endDate: format(end) };
  } catch (error) {
    const code = error instanceof Error ? error.message.slice(0, 120) : "search_console_unknown_error";
    await db.execute({ sql: "UPDATE sync_runs SET status='failed',finished_at=?,error_code=?,error_message=? WHERE id=?", args: [new Date().toISOString(), code, "Search Console 指标同步失败，请检查凭据、属性权限、网络与 API 配额。", id] });
    await writeAudit({ action: "search_console_sync_failed", entityType: "sync", entityId: id, actorId: initiatedBy, details: { code }, result: "failure" });
    throw error;
  }

  const sitemap = await submitSearchConsoleSitemap(initiatedBy);
  return { ...result, sitemap };
}
