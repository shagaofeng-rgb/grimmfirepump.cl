import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { siteConfig, type Locale } from "@/lib/site-config";

export const dynamic = "force-dynamic";
export function generateStaticParams() { return [{ locale: "en" }, { locale: "pt" }]; }
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> { const { locale } = await params; if (locale === "es") return {}; return { title: "Language version in preparation", description: "The complete language version is currently in preparation.", robots: { index: false, follow: true }, alternates: { canonical: `/${locale}` } }; }
export default async function PendingLanguagePage({ params }: { params: Promise<{ locale: string }> }) { const { locale } = await params; if (!siteConfig.supportedLocales.includes(locale as Locale) || locale === "es") notFound(); const language = locale === "en" ? "English" : "Português"; return <main className="language-pending"><section className="section"><div className="shell"><p className="eyebrow">GRIMM PUMP</p><h1>{language} version in preparation</h1><p>The complete localized version is being prepared. For current information about projects in Chile, please use the Spanish site.</p><Link className="btn" href="/es">Ir al sitio en español →</Link></div></section></main>; }
