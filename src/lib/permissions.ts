import type { AdminRole, AdminSession } from "@/lib/auth";

export type Permission = "dashboard:view" | "products:view" | "products:write" | "products:publish" | "products:delete" | "news:view" | "news:write" | "news:publish" | "news:delete" | "leads:view" | "leads:write" | "leads:export" | "analytics:view" | "seo:view" | "seo:sync" | "media:write" | "users:manage" | "settings:manage" | "audit:view";

const rolePermissions: Record<AdminRole, Permission[]> = {
  super_admin: ["dashboard:view", "products:view", "products:write", "products:publish", "products:delete", "news:view", "news:write", "news:publish", "news:delete", "leads:view", "leads:write", "leads:export", "analytics:view", "seo:view", "seo:sync", "media:write", "users:manage", "settings:manage", "audit:view"],
  admin: ["dashboard:view", "products:view", "products:write", "products:publish", "products:delete", "news:view", "news:write", "news:publish", "news:delete", "leads:view", "leads:write", "leads:export", "analytics:view", "seo:view", "seo:sync", "media:write", "audit:view"],
  editor: ["dashboard:view", "products:view", "products:write", "news:view", "news:write", "media:write"],
  marketing: ["dashboard:view", "products:view", "news:view", "news:write", "news:publish", "leads:view", "analytics:view", "seo:view", "seo:sync", "media:write"],
  sales: ["dashboard:view", "products:view", "leads:view", "leads:write", "leads:export"],
  analyst: ["dashboard:view", "analytics:view", "seo:view"],
  viewer: ["dashboard:view", "products:view", "news:view", "leads:view", "analytics:view", "seo:view"],
};

export function can(role: AdminRole, permission: Permission) { return rolePermissions[role]?.includes(permission) ?? false; }
export function canSession(session: AdminSession | null, permission: Permission) { return Boolean(session && can(session.role, permission)); }
