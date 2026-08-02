import { notFound, redirect } from "next/navigation";
import { AdminFrame } from "@/components/admin-frame";
import { AdminResourceWorkspace } from "@/components/admin-resource-workspace";
import { getAdminSession } from "@/lib/auth";

const sections = ["categories", "products", "news", "leads", "users", "settings", "sync", "seo", "audit", "analytics", "media", "forms", "pages", "downloads"] as const;
export function generateStaticParams() { return sections.map((section) => ({ section })); }
export default async function AdminSection({ params }: { params: Promise<{ section: string }> }) { const { section } = await params; if (!sections.includes(section as (typeof sections)[number])) notFound(); const session = await getAdminSession(); if (!session) redirect("/admin/login"); return <AdminFrame session={session}><AdminResourceWorkspace resource={section as (typeof sections)[number]} /></AdminFrame>; }
