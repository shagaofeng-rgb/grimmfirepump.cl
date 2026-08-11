import { z } from "zod";
import { fail, ok, requireAdmin } from "@/lib/admin-api";
import { runNewsIngest, runNewsPublish } from "@/lib/industry-news";

const requestSchema = z.object({ phase: z.enum(["ingest", "publish"]) });

export async function POST(request: Request) {
  const auth = await requireAdmin("news:publish"); if ("response" in auth) return auth.response;
  const parsed = requestSchema.safeParse(await request.json().catch(() => null)); if (!parsed.success) return fail("invalid_news_automation_request", 400);
  try { return ok(parsed.data.phase === "ingest" ? await runNewsIngest() : await runNewsPublish()); }
  catch (error) { return fail(error instanceof Error ? error.message : "news_automation_failed", 503); }
}
