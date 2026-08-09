import type { Metadata } from "next";
import BlogArticlePage, { generateMetadata as metadataForLocale } from "../../../[locale]/blog/[slug]/page";
export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> { const { slug } = await params; return metadataForLocale({ params: Promise.resolve({ locale: "es", slug }) }); }
export default async function SpanishBlogArticlePage({ params }: { params: Promise<{ slug: string }> }) { const { slug } = await params; return <BlogArticlePage params={Promise.resolve({ locale: "es", slug })} />; }
