import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublicBlogPosts } from "@/lib/public-blog";
import { siteConfig, type Locale } from "@/lib/site-config";

export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> { const { locale } = await params; return { title: "Blog | GRIMM PUMP", description: "Actualizaciones técnicas de sistemas de bombeo contra incendio para Sudamérica.", alternates: { canonical: `/${locale}/blog`, languages: { es: "/es/blog", pt: "/pt/blog", en: "/en/blog", "x-default": "/es/blog" } } }; }

function formatDate(value: string) { return new Intl.DateTimeFormat("es-CL", { dateStyle: "long", timeZone: "America/Santiago" }).format(new Date(value)); }
export default async function BlogPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params; if (!siteConfig.supportedLocales.includes(locale as Locale)) notFound();
  const posts = await getPublicBlogPosts();
  return <main><header className="header"><div className="shell nav"><a className="brand" href={`/${locale}`}><span className="brand-mark"><i/><i/><i/></span><span>GRIMM <b>PUMP</b><small>SISTEMAS CONTRA INCENDIO</small></span></a><a className="btn btn-small" href={`/${locale}#contacto`}>Solicitar cotización →</a></div></header><section className="section shaded"><div className="shell"><p className="eyebrow">RECURSOS TÉCNICOS</p><h1 className="page-title">Blog de <em>GRIMM PUMP.</em></h1><p className="page-intro">Notas y actualizaciones técnicas publicadas desde el sistema editorial conectado.</p><div className="blog-grid">{posts.length ? posts.map((post) => <article className="blog-card" key={post.id}>{post.coverImageUrl ? <img src={post.coverImageUrl} alt="" loading="lazy" /> : null}<div><p className="card-index">{post.category || "BLOG"} · {formatDate(post.publishedAt)}</p><h2>{post.title}</h2>{post.excerpt ? <p>{post.excerpt}</p> : null}<a className="card-link" href={`/${locale}/blog/${post.slug}`}>Leer artículo →</a></div></article>) : <div className="notice">Aún no hay publicaciones. Las nuevas entradas aparecerán aquí cuando se publiquen desde el sistema editorial.</div>}</div></div></section></main>;
}
