import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter, SiteHeader, JsonLd } from "@/components/site-shell";
import { getDefaultNewsSite, getPublicNews } from "@/lib/industry-news";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Noticias del sector", description: "Noticias externas verificadas y síntesis editorial sobre protección contra incendios para proyectos en Chile.", alternates: { canonical: "/es/noticias" }, openGraph: { type: "website", locale: "es_CL", title: "Noticias del sector | GRIMM PUMP" } };
function date(value: unknown) { return new Intl.DateTimeFormat("es-CL", { dateStyle: "long", timeZone: "America/Santiago" }).format(new Date(String(value))); }
export default async function NewsPage() {
  const site = await getDefaultNewsSite(); const articles = site ? await getPublicNews(site.siteId) : [];
  return <><SiteHeader/><main><section className="section section-soft"><div className="shell"><p className="kicker">ACTUALIDAD DEL SECTOR</p><h1 className="page-title">Noticias verificadas para proyectos de protección contra incendios.</h1><p className="page-intro">Resúmenes editoriales de fuentes externas. Cada nota identifica su fuente, fecha original y enlace de consulta.</p><div className="blog-grid news-grid">{articles.length ? articles.map((article) => <article className="blog-card" key={String(article.id)}><div><p className="card-index">NOTICIAS · {date(article.published_at)}</p><h2>{String(article.title)}</h2><p>{String(article.deck)}</p><p className="news-source">Fuente: {String(article.source_name)}</p><Link className="card-link" href={`/es/noticias/${String(article.slug)}`}>Leer síntesis y fuente →</Link></div></article>) : <div className="notice">Aún no hay noticias publicadas. Las entradas se mostrarán únicamente después de completar la verificación editorial y de frontend.</div>}</div></div></section></main><SiteFooter/>{site ? <JsonLd data={{ "@context": "https://schema.org", "@type": "CollectionPage", name: "Noticias del sector", url: `${site.siteUrl}/es/noticias` }}/> : null}</>;
}
