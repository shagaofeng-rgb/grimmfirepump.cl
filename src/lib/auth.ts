import { createHash, randomUUID } from "node:crypto";
import { compare } from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { getDatabase, writeAudit } from "@/lib/database";

export type AdminRole = "super_admin" | "admin" | "editor" | "marketing" | "sales" | "analyst" | "viewer";
export type AdminSession = { userId: string; email: string; role: AdminRole; name: string };
export const cookieName = "grimm_admin_session";
const lockMinutes = 15;
const maxFailedAttempts = 5;

function secret() {
  const value = process.env.AUTH_SECRET;
  if (!value) throw new Error("AUTH_SECRET is not configured");
  return new TextEncoder().encode(value);
}

function hashIp(ip: string | null) { return ip ? createHash("sha256").update(ip).digest("hex").slice(0, 24) : undefined; }

export async function createAdminSession(user: AdminSession, remember = false) {
  return new SignJWT({ role: user.role, email: user.email, name: user.name })
    .setSubject(user.userId).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime(remember ? "30d" : "8h").sign(secret());
}

export async function getAdminSession(): Promise<AdminSession | null> {
  try {
    const token = (await cookies()).get(cookieName)?.value;
    if (!token) return null;
    const { payload } = await jwtVerify(token, secret());
    if (!payload.sub || typeof payload.email !== "string" || typeof payload.name !== "string" || typeof payload.role !== "string") return null;
    return { userId: payload.sub, email: payload.email, name: payload.name, role: payload.role as AdminRole };
  } catch { return null; }
}

export async function authenticateAdmin(input: { email: string; password: string; ip: string | null; userAgent: string | null }) {
  const email = input.email.trim().toLowerCase();
  const db = await getDatabase();
  const now = new Date();
  const found = await db.execute({ sql: "SELECT id,email,name,password_hash,role,status,failed_login_count,locked_until FROM users WHERE email = ?", args: [email] });
  const row = found.rows[0];
  const ipHash = hashIp(input.ip);
  const recordAttempt = async (success: boolean) => db.execute({ sql: "INSERT INTO login_attempts (id,email,ip_hash,success,created_at) VALUES (?,?,?,?,?)", args: [randomUUID(), email, ipHash || null, success ? 1 : 0, now.toISOString()] });
  if (!row || String(row.status) !== "active") { await recordAttempt(false); await writeAudit({ action: "login_failed", entityType: "user", details: { email }, result: "failure", ipHash, userAgent: input.userAgent || undefined }); return { ok: false as const, reason: "账号或密码错误。" }; }
  if (row.locked_until && new Date(String(row.locked_until)) > now) return { ok: false as const, reason: `登录已临时锁定，请 ${lockMinutes} 分钟后再试。` };
  if (!(await compare(input.password, String(row.password_hash)))) {
    const failures = Number(row.failed_login_count || 0) + 1;
    const lockedUntil = failures >= maxFailedAttempts ? new Date(now.getTime() + lockMinutes * 60_000).toISOString() : null;
    await db.execute({ sql: "UPDATE users SET failed_login_count=?, locked_until=?, updated_at=? WHERE id=?", args: [failures, lockedUntil, now.toISOString(), String(row.id)] });
    await recordAttempt(false); await writeAudit({ action: "login_failed", entityType: "user", entityId: String(row.id), details: { email }, result: "failure", ipHash, userAgent: input.userAgent || undefined });
    return { ok: false as const, reason: lockedUntil ? `登录失败次数过多，已锁定 ${lockMinutes} 分钟。` : "账号或密码错误。" };
  }
  await db.execute({ sql: "UPDATE users SET failed_login_count=0, locked_until=NULL, last_login_at=?, updated_at=? WHERE id=?", args: [now.toISOString(), now.toISOString(), String(row.id)] });
  await recordAttempt(true); await writeAudit({ action: "login", entityType: "user", entityId: String(row.id), details: { email }, ipHash, userAgent: input.userAgent || undefined });
  return { ok: true as const, user: { userId: String(row.id), email: String(row.email), name: String(row.name), role: String(row.role) as AdminRole } };
}
