import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getDatabase } from "@/lib/database";

const eventSchema = z.object({
  visitorId: z.string().uuid(), sessionId: z.string().uuid(), path: z.string().startsWith("/").max(220),
  title: z.string().trim().max(180).optional(), referrerPath: z.string().trim().max(220).optional(), referrerHost: z.string().trim().max(180).optional(),
  locale: z.string().trim().max(16).optional(), deviceType: z.enum(["mobile", "tablet", "desktop"]).optional(),
  utmSource: z.string().trim().max(120).optional(), utmMedium: z.string().trim().max(120).optional(), utmCampaign: z.string().trim().max(120).optional(),
});

export async function POST(request: Request) {
  try {
    const parsed = eventSchema.safeParse(await request.json());
    if (!parsed.success || parsed.data.path.startsWith("/admin") || parsed.data.path.startsWith("/api")) return new NextResponse(null, { status: 204 });
    const event = parsed.data; const now = new Date().toISOString(); const db = await getDatabase();
    const session = await db.execute({ sql: "SELECT id FROM visitor_sessions WHERE id=? AND visitor_id=? LIMIT 1", args: [event.sessionId, event.visitorId] });
    if (session.rows.length) await db.execute({ sql: "UPDATE visitor_sessions SET last_seen_at=? WHERE id=?", args: [now, event.sessionId] });
    else await db.execute({ sql: "INSERT INTO visitor_sessions (id,visitor_id,landing_path,referrer_host,locale,device_type,utm_source,utm_medium,utm_campaign,started_at,last_seen_at,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)", args: [event.sessionId, event.visitorId, event.path, event.referrerHost || null, event.locale || null, event.deviceType || null, event.utmSource || null, event.utmMedium || null, event.utmCampaign || null, now, now, now] });
    await db.execute({ sql: "INSERT INTO visit_events (id,visitor_id,session_id,event_type,page_path,page_title,referrer_path,occurred_at) VALUES (?,?,?,?,?,?,?,?)", args: [randomUUID(), event.visitorId, event.sessionId, "page_view", event.path, event.title || null, event.referrerPath || null, now] });
    return new NextResponse(null, { status: 204 });
  } catch { return new NextResponse(null, { status: 204 }); }
}
