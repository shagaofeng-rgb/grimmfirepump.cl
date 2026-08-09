import type { Metadata } from "next";
import Link from "next/link";
import { chileProducts } from "@/lib/chile-content";
import { JsonLd, SiteFooter, SiteHeader } from "@/components/site-shell";

export const metadata: Metadata = {
  title: "Productos | Bombas y sistemas para proyectos en Chile | GRIMM PUMP",
  description: "Catálogo adaptado para Chile: sistemas contra incendio, bombas de agua, equipos de presión, drenaje y bombeo móvil de GRIMM PUMP.",
  alternates: { canonical: "/es/productos" },
  openGraph: { images: ["/assets/grimm-fire-pump-hero.png"] },
};

export default function ProductsIndex() {
  const groups = Object.entries(Object.groupBy(chileProducts, ({ category }) => category ?? "Otros productos"));
  return <main><SiteHeader/><JsonLd data={{ "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Inicio", item: "https://grimmfirepump.cl/es" }, { "@type": "ListItem", position: 2, name: "Productos", item: "https://grimmfirepump.cl/es/productos" }] }}/><section className="section shaded"><div className="shell"><p className="eyebrow">CATÁLOGO DE PRODUCTOS</p><h1 className="page-title">Equipos de bombeo adaptados <em>para proyectos en Chile.</em></h1><p className="page-intro">El catálogo incorpora las 26 familias públicas del sitio principal, organizadas para consultas de ingeniería y compra en Chile. Cada ficha indica qué información debe confirmarse antes de seleccionar un modelo.</p>{groups.map(([category, products]) => <section key={category} className="product-category"><h2>{category}</h2><div className="product-grid">{products?.map((item) => <article className="product-card" key={item.slug}><p className="card-index">{item.driveType}</p><h3>{item.name}</h3><p>{item.description}</p><Link className="card-link" href={`/es/productos/${item.slug}`}>Revisar aplicación y selección →</Link></article>)}</div></section>)}<div className="notice">¿No sabe qué familia corresponde a su proyecto? Envíe aplicación, caudal, presión, fuente de agua, accionamiento y planos disponibles para iniciar una revisión.</div><Link className="btn" href="/es/contacto">Solicitar orientación técnica →</Link></div></section><SiteFooter/></main>;
}
