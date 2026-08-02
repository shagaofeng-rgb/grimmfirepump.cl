import { requireAdmin } from "@/lib/admin-api";
import { getDatabase } from "@/lib/database";

function escapeCsv(value: unknown) { const text = value == null ? "" : String(value); return `"${text.replaceAll('"', '""')}"`; }

export async function GET(request: Request) {
  const auth = await requireAdmin("leads:export");
  if ("response" in auth) return auth.response;
  if (new URL(request.url).searchParams.get("type") !== "leads") return new Response("Unsupported export", { status: 400 });
  const db = await getDatabase();
  const result = await db.execute("SELECT name,company,email,country,product_interest,flow,pressure,message,status,created_at FROM leads WHERE deleted_at IS NULL ORDER BY created_at DESC");
  const columns = ["name", "company", "email", "country", "product_interest", "flow", "pressure", "message", "status", "created_at"];
  const csv = [`\uFEFF${columns.join(",")}`, ...result.rows.map((row) => columns.map((key) => escapeCsv(row[key])).join(","))].join("\r\n");
  return new Response(csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": "attachment; filename=grimm-latam-leads.csv" } });
}
