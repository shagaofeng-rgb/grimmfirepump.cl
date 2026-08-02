import Link from "next/link";
import type { ReactNode } from "react";
import type { AdminSession } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { AdminLogoutButton } from "@/components/admin-logout-button";

const nav = [
  ["/admin", "数据概览", "dashboard:view"], ["/admin/products", "产品管理", "products:view"], ["/admin/categories", "产品分类", "products:view"],
  ["/admin/news", "新闻管理", "news:view"], ["/admin/sync", "新闻自动化", "seo:view"], ["/admin/media", "媒体资源", "products:view"],
  ["/admin/leads", "客户询盘", "leads:view"], ["/admin/forms", "表单管理", "leads:view"], ["/admin/analytics", "访问分析", "analytics:view"],
  ["/admin/seo", "SEO 管理", "seo:view"], ["/admin/pages", "页面管理", "settings:manage"], ["/admin/downloads", "下载资料", "products:view"],
  ["/admin/users", "账号与权限", "users:manage"], ["/admin/audit", "操作日志", "audit:view"], ["/admin/settings", "系统设置", "settings:manage"],
] as const;

export function AdminFrame({ session, children }: { session: AdminSession; children: ReactNode }) {
  return <main className="admin-shell"><aside><Link href="/admin" className="admin-brand">GRIMM <b>PUMP</b><small>网站运营后台 · 南美站</small></Link><nav>{nav.filter((item) => can(session.role, item[2])).map(([href, label]) => <Link href={href} key={href}>{label}</Link>)}</nav><div className="admin-user"><span>{session.name}</span><small>{session.email} · {session.role}</small><AdminLogoutButton /></div></aside><section><header className="admin-topbar"><div><b>GRIMM PUMP</b><span>当前用户：{session.name} · {session.role}</span></div><div><label className="global-search"><span>⌕</span><input placeholder="搜索产品、询盘、页面..." aria-label="全局搜索" /></label><Link className="pending-link" href="/admin/leads">待处理询盘</Link><Link className="logout" href="/es" target="_blank">查看网站</Link></div></header>{children}</section></main>;
}
