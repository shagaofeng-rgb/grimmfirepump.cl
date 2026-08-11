import { NextResponse } from "next/server";
import { runNewsIngest } from "@/lib/industry-news";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET(request: Request) { if (!process.env.CRON_SECRET || request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) return NextResponse.json({ success: false, error: "unauthorized" }, { status: 401 }); try { return NextResponse.json({ success: true, phase: "candidate_ingest_only", data: await runNewsIngest() }, { headers: { "cache-control": "no-store" } }); } catch { return NextResponse.json({ success: false, error: "news_ingest_failed" }, { status: 503 }); } }
