import { NextResponse } from "next/server";
import { getDatabase } from "@/lib/database";
export async function GET() { try { const db = await getDatabase(); await db.execute("SELECT 1"); return NextResponse.json({ success: true, data: { status: "ok", database: "connected" } }); } catch (error) { console.error("healthcheck_database_failure", error instanceof Error ? error.message : "unknown"); return NextResponse.json({ success: false, error: "database_unavailable" }, { status: 503 }); } }
