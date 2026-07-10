import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { getAdminSession, type AdminSession } from "@/lib/auth";
import { can, type Permission } from "@/lib/permissions";

export async function requireAdmin(permission: Permission): Promise<{ session: AdminSession } | { response: NextResponse }> {
  const session = await getAdminSession();
  if (!session) return { response: NextResponse.json({ success: false, error: "请先登录后台。", requestId: randomUUID() }, { status: 401 }) };
  if (!can(session.role, permission)) return { response: NextResponse.json({ success: false, error: "当前账号没有此操作权限。", requestId: randomUUID() }, { status: 403 }) };
  return { session };
}

export function requestId() { return randomUUID(); }
export function ok(data: unknown, status = 200, id = requestId()) { return NextResponse.json({ success: true, data, requestId: id }, { status }); }
export function fail(error: string, status = 400, fields?: unknown, id = requestId()) { return NextResponse.json({ success: false, error, requestId: id, ...(fields ? { fields } : {}) }, { status }); }
export function pagination(value: URLSearchParams) {
  const page = Math.max(1, Math.min(100000, Number(value.get("page") || 1) || 1));
  const pageSize = [10, 20, 50, 100].includes(Number(value.get("pageSize"))) ? Number(value.get("pageSize")) : 20;
  return { page, pageSize, offset: (page - 1) * pageSize };
}
