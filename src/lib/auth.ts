import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const cookieName = "grimm_admin_session";
function secret() { const value = process.env.AUTH_SECRET; if (!value) throw new Error("AUTH_SECRET is not configured"); return new TextEncoder().encode(value); }
export async function createAdminSession(email: string) { return new SignJWT({ role: "admin", email }).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("8h").sign(secret()); }
export async function getAdminSession() { try { const token = (await cookies()).get(cookieName)?.value; if (!token) return null; const { payload } = await jwtVerify(token, secret()); return payload.role === "admin" && typeof payload.email === "string" ? payload : null; } catch { return null; } }
export { cookieName };
