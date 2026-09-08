import { fail, ok, pagination, requireAdmin } from "@/lib/admin-api";
import { dateSql, parseDateFilter } from "@/lib/admin-filters";
import { getDatabase } from "@/lib/database";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin("leads:view"); if ("response" in auth) return auth.response;
  const { id } = await context.params; const url = new URL(request.url); const { page, pageSize, offset } = pagination(url.searchParams); const filter = parseDateFilter(url.searchParams); const range = dateSql(filter, "e.occurred_at");
  try {
    const db = await getDatabase();
    const profile = await db.execute({ sql: "SELECT id,display_name,company,country,first_seen_at,last_seen_at FROM customer_profiles WHERE id=? LIMIT 1", args: [id] });
    if (!profile.rows.length) return fail("未找到该客户档案。", 404);
    const [leads, totals, events, eventCount] = await Promise.all([
      db.execute({ sql: "SELECT id,name,company,email,country,product_interest,status,source_path,created_at FROM leads WHERE customer_id=? AND deleted_at IS NULL ORDER BY created_at DESC", args: [id] }),
      db.execute({ sql: `SELECT COUNT(DISTINCT e.visitor_id) AS visitors,COUNT(DISTINCT e.session_id) AS sessions,COUNT(*) AS page_views FROM visit_events e INNER JOIN leads l ON l.visitor_id=e.visitor_id WHERE l.customer_id=?${range.sql}`, args: [id, ...range.args] }),
      db.execute({ sql: `SELECT e.id,e.session_id,e.page_path,e.page_title,e.referrer_path,e.occurred_at FROM visit_events e INNER JOIN leads l ON l.visitor_id=e.visitor_id WHERE l.customer_id=?${range.sql} GROUP BY e.id,e.session_id,e.page_path,e.page_title,e.referrer_path,e.occurred_at ORDER BY e.occurred_at DESC LIMIT ? OFFSET ?`, args: [id, ...range.args, pageSize, offset] }),
      db.execute({ sql: `SELECT COUNT(*) AS total FROM (SELECT e.id FROM visit_events e INNER JOIN leads l ON l.visitor_id=e.visitor_id WHERE l.customer_id=?${range.sql} GROUP BY e.id) AS events`, args: [id, ...range.args] }),
    ]);
    return ok({ profile: profile.rows[0], leads: leads.rows, totals: totals.rows[0], events: events.rows, pagination: { page, pageSize, total: Number(eventCount.rows[0]?.total || 0) }, dateFilter: filter });
  } catch { return fail("读取客户访问详情失败。", 503); }
}
