import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublicBlogPost } from "@/lib/public-blog";
import { siteConfig, type Locale } from "@/lib/site-config";

export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> { const { locale, slug } = await params; const post = await getPublicBlogPost(slug); if (!post) return {}; return { title: `${post.title} | GRIMM PUMP`, description: post.excerpt || undefined, alternates: { canonical: `/${locale}/blog/${slug}` } }; }
function formatDate(value: string) { return new Intl.DateTimeFormat("es-CL", { dateStyle: "long", timeZone: "America/Santiago" }).format(new Date(value)); }
export default async function BlogArticlePage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params; if (!siteConfig.supportedLocales.includes(locale as Locale)) notFound(); const post = await getPublicBlogPost(slug); if (!post) notFound();
  const paragraphs = (post.content || "").replace(/<[^>]*>/g, " ").split(/\n{2,}|\r?\n/).map((paragraph) => paragraph.replace(/\s+/g, " ").trim()).filter(Boolean);
  return <main><header className="header"><div className="shell nav"><a className="brand" href={`/${locale}`}><span className="brand-mark"><i/><i/><i/></span><span>GRIMM <b>PUMP</b><small>SISTEMAS CONTRA INCENDIO</small></span></a><a className="btn btn-small" href={`/${locale}/blog`}>Volver al Blog</a></div></header><article className="section blog-article"><div className="shell"><p className="eyebrow">{post.category || "BLOG"}</p><h1 className="page-title">{post.title}</h1><p className="blog-meta">Publicado el {formatDate(post.publishedAt)}{post.authorId ? ` · ${post.authorId}` : ""}</p>{post.coverImageUrl ? <img className="blog-cover" src={post.coverImageUrl} alt="" /> : null}<div className="blog-content">{paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div></div></article></main>;
}
