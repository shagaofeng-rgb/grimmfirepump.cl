import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { authenticateAdmin, createAdminSession, cookieName } from "@/lib/auth";

const loginSchema = z.object({ identifier: z.string().trim().min(2).max(160), password: z.string().min(8).max(256), remember: z.boolean().optional().default(false) });

export async function POST(request: Request) {
  const requestId = randomUUID();
  try {
    let body: unknown;
    try { body = await request.json(); }
    catch { return NextResponse.json({ success: false, error: "请求格式无效。", requestId }, { status: 400 }); }
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ success: false, error: "请填写有效的账号和密码。", requestId, fields: parsed.error.flatten().fieldErrors }, { status: 400 });
    const login = await authenticateAdmin({ identifier: parsed.data.identifier, password: parsed.data.password, ip: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null, userAgent: request.headers.get("user-agent") });
    if (!login.ok) return NextResponse.json({ success: false, error: login.reason, requestId }, { status: 401 });
    const response = NextResponse.json({ success: true, data: { name: login.user.name, role: login.user.role }, requestId });
    response.cookies.set(cookieName, await createAdminSession(login.user, parsed.data.remember), { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: parsed.data.remember ? 60 * 60 * 24 * 30 : 60 * 60 * 8 });
    return response;
  } catch (error) {
    console.error(JSON.stringify({ level: "error", route: "/api/admin/session", requestId, error: error instanceof Error ? error.message : String(error) }));
    return NextResponse.json({ success: false, error: "登录服务暂时不可用，请稍后再试。", requestId }, { status: 503 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.set(cookieName, "", { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 0 });
  return response;
}
