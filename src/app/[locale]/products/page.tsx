import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getPublicProducts } from "@/lib/public-catalog";
import { siteConfig, type Locale } from "@/lib/site-config";

export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> { const { locale } = await params; return { alternates: { canonical: `/${locale}/products`, languages: { es: "/es/products", pt: "/pt/products", en: "/en/products", "x-default": "/es/products" } } }; }

export default async function ProductsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!siteConfig.supportedLocales.includes(locale as Locale)) notFound();
  const products = await getPublicProducts();
  return <main><header className="header"><div className="shell nav"><a className="brand" href={`/${locale}`}><span className="brand-mark"><i/><i/><i/></span><span>GRIMM <b>PUMP</b><small>SISTEMAS CONTRA INCENDIO</small></span></a><a className="btn btn-small" href={`/${locale}#contacto`}>Solicitar cotización →</a></div></header><section className="section shaded"><div className="shell"><h1 className="page-title">Sistemas de bombeo para <em>proyectos contra incendio.</em></h1><p className="page-intro">Productos publicados desde el catálogo operativo del sitio.</p><div className="product-grid">{products.map((product, index) => <article className={`product-card ${index === 0 ? "featured" : ""}`} key={product.slug}><p className="card-index">{product.category.toUpperCase()}</p><h3>{product.name}</h3><p>{product.description}</p><dl>{product.specs.map(([key, value]) => <div key={key}><dt>{key}</dt><dd>{value}</dd></div>)}</dl><a className="card-link" href={`/${locale}/products/${product.slug}`}>Ver detalles →</a></article>)}</div></div></section></main>;
}
