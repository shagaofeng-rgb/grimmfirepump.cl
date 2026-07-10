import { fail, ok, requireAdmin } from "@/lib/admin-api";
import { syncSearchConsole } from "@/lib/search-console";

export async function POST() {
  const auth = await requireAdmin("seo:sync"); if ("response" in auth) return auth.response;
  try { return ok(await syncSearchConsole(auth.session.userId)); }
  catch (error) { const code = error instanceof Error ? error.message : "unknown"; const message = code === "search_console_not_configured" ? "尚未配置 Search Console 属性或服务账号。" : code === "search_console_sync_already_running" ? "已有同步任务正在执行。" : "Search Console 同步失败，请检查后台同步日志。"; return fail(message, 503); }
}
