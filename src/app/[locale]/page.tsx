import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { siteConfig, type Locale } from "@/lib/site-config";

export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return [{ locale: "en" }, { locale: "pt" }];
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (locale === "es") return {};
  const isPortuguese = locale === "pt";
  return {
    title: isPortuguese ? "Versão em português em preparação" : "English version in preparation",
    description: isPortuguese ? "A versão completa em português está em preparação." : "The complete English version is currently in preparation.",
    robots: { index: false, follow: true },
    alternates: { canonical: `/${locale}` },
  };
}

export default async function PendingLanguagePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!siteConfig.supportedLocales.includes(locale as Locale) || locale === "es") notFound();
  const isPortuguese = locale === "pt";
  const title = isPortuguese ? "Versão em português em preparação" : "English version in preparation";
  const description = isPortuguese
    ? "A versão completa em português está sendo preparada. Para informações atuais sobre projetos no Chile, consulte o site em espanhol."
    : "The complete English version is being prepared. For current information about projects in Chile, please use the Spanish site.";
  const cta = isPortuguese ? "Ver site em espanhol →" : "View the Spanish site →";

  return <main className="language-pending"><section className="section"><div className="shell"><p className="eyebrow">GRIMM PUMP</p><h1>{title}</h1><p>{description}</p><Link className="btn" href="/es">{cta}</Link></div></section></main>;
}
