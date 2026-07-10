import { NextResponse } from "next/server";
import { syncSearchConsole } from "@/lib/search-console";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  try { return NextResponse.json({ success: true, data: await syncSearchConsole() }); }
  catch { return NextResponse.json({ success: false, error: "同步任务失败，请查看后台同步日志。" }, { status: 503 }); }
}
