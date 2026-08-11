import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { chileSolutions, legacyProductRedirects } from "@/lib/chile-content";
import { getChileCatalog } from "@/lib/chile-catalog";
import { JsonLd, SiteFooter, SiteHeader } from "@/components/site-shell";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = (await getChileCatalog()).find((item) => item.slug === slug);
  if (!product) return {};
  return {
    title: product.title,
    description: product.description,
    alternates: { canonical: `/es/productos/${product.slug}` },
    openGraph: { title: product.title, description: product.description, url: `/es/productos/${product.slug}`, images: ["/assets/grimm-fire-pump-hero.png"] },
    twitter: { card: "summary_large_image" },
  };
}

export default async function ProductDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const legacyTarget = legacyProductRedirects[slug];
  if (legacyTarget) permanentRedirect(`/es/productos/${legacyTarget}`);
  const product = (await getChileCatalog()).find((item) => item.slug === slug);
  if (!product) notFound();
  const related = chileSolutions.filter((item) => product.relatedSolutions.includes(item.slug));
  const url = `https://grimmfirepump.cl/es/productos/${product.slug}`;
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Inicio", item: "https://grimmfirepump.cl/es" }, { "@type": "ListItem", position: 2, name: "Productos", item: "https://grimmfirepump.cl/es/productos" }, { "@type": "ListItem", position: 3, name: product.name, item: url }] },
      { "@type": "Product", name: product.name, description: product.description, url, image: "https://grimmfirepump.cl/assets/grimm-fire-pump-hero.png", brand: { "@type": "Brand", name: "GRIMM PUMP" } },
      { "@type": "FAQPage", mainEntity: product.faq.map(([name, text]) => ({ "@type": "Question", name, acceptedAnswer: { "@type": "Answer", text } })) },
    ],
  };
  return <main><SiteHeader/><JsonLd data={schema}/><section className="section product-detail"><div className="shell"><p className="eyebrow">{product.category ?? "PRODUCTO"} · {product.driveType}</p><h1 className="page-title">{product.name}</h1><p className="page-intro">{product.description}</p><div className="selection-diagram"><b>Cómo se revisa</b><span>{product.processRole}</span></div><div className="detail-grid"><section><h2>Contextos de aplicación</h2><ul>{product.contexts.map((item) => <li key={item}>{item}</li>)}</ul></section><section><h2>Datos para revisar la configuración</h2><ul>{product.selectionInputs.map((item) => <li key={item}>{item}</li>)}</ul></section></div><div className="spec-panel"><h2>Información técnica disponible</h2><dl>{product.verifiedSpecifications.map(([key, value]) => <div key={key}><dt>{key}</dt><dd>{value}</dd></div>)}</dl></div><section className="faq-section"><h2>Preguntas frecuentes</h2>{product.faq.map(([question, answer]) => <details key={question}><summary>{question}</summary><p>{answer}</p></details>)}</section>{related.length ? <section className="related-links"><h2>Soluciones relacionadas</h2>{related.map((item) => <Link key={item.slug} href={`/es/soluciones/${item.slug}`}>{item.name} →</Link>)}</section> : null}<Link className="btn" href={`/es/contacto?producto=${product.slug}`}>Solicitar revisión técnica →</Link></div></section><SiteFooter/></main>;
}
