import Link from "next/link";
import type { ReactNode } from "react";
import type { AdminSession } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { AdminLogoutButton } from "@/components/admin-logout-button";

const nav = [
  ["/admin", "数据概览", "dashboard:view"], ["/admin/products", "产品管理", "products:view"], ["/admin/categories", "产品分类", "products:view"],
  ["/admin/news", "新闻管理", "news:view"], ["/admin/leads", "客户表单", "leads:view"], ["/admin/analytics", "访问分析", "analytics:view"],
  ["/admin/seo", "SEO 数据", "seo:view"], ["/admin/sync", "数据同步", "seo:view"], ["/admin/users", "用户与权限", "users:manage"],
  ["/admin/settings", "系统设置", "settings:manage"], ["/admin/audit", "操作日志", "audit:view"],
] as const;

export function AdminFrame({ session, children }: { session: AdminSession; children: ReactNode }) {
  return <main className="admin-shell"><aside><Link href="/admin" className="admin-brand">GRIMM <b>PUMP</b><small>南美网站中文管理后台</small></Link><nav>{nav.filter((item) => can(session.role, item[2])).map(([href, label]) => <Link href={href} key={href}>{label}</Link>)}</nav><div className="admin-user"><span>{session.name}</span><small>{session.email} · {session.role}</small><AdminLogoutButton /></div></aside><section>{children}</section></main>;
}
