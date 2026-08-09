import type { Metadata } from "next";
import Link from "next/link";
import { chileSolutions } from "@/lib/chile-content";
import { SiteFooter, SiteHeader } from "@/components/site-shell";

export const metadata: Metadata = { title: "Soluciones contra incendio por industria | GRIMM PUMP Chile", description: "Información de selección de sistemas contra incendio para bodegas, plantas industriales, centros de datos y zonas remotas.", alternates: { canonical: "/es/soluciones" }, openGraph: { images: ["/assets/grimm-fire-pump-hero.png"] } };

export default function SolutionsIndex() { return <main><SiteHeader/><section className="section"><div className="shell"><p className="eyebrow">SOLUCIONES</p><h1 className="page-title">Información de bombeo por <em>contexto de proyecto.</em></h1><p className="page-intro">Cada guía trata condiciones, variables y documentos de un escenario concreto. No reemplaza la ingeniería ni declara prestaciones no verificadas.</p><div className="solution-grid">{chileSolutions.map((solution) => <article className="solution-card" key={solution.slug}><h2>{solution.name}</h2><p>{solution.intro}</p><Link className="card-link" href={`/es/soluciones/${solution.slug}`}>Ver guía del escenario →</Link></article>)}</div></div></section><SiteFooter/></main>; }
