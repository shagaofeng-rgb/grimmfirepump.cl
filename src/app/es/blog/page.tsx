import type { Metadata } from "next";
import BlogPage, { generateMetadata as metadataForLocale } from "../../[locale]/blog/page";
export const dynamic = "force-dynamic";
export async function generateMetadata(): Promise<Metadata> { return metadataForLocale({ params: Promise.resolve({ locale: "es" }) }); }
export default function SpanishBlogPage() { return <BlogPage params={Promise.resolve({ locale: "es" })} />; }
