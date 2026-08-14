import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { LeadForm } from "@/components/lead-form";
import { SiteFooter, SiteHeader } from "@/components/site-shell";
import { trustPages } from "@/lib/chile-content";

export function generateStaticParams() { return Object.keys(trustPages).map((section) => ({ section })); }
export async function generateMetadata({ params }: { params: Promise<{ section: string }> }): Promise<Metadata> { const { section } = await params; const page = trustPages[section]; if (!page) return {}; return { title: page.title, description: page.intro, alternates: { canonical: `/es/${section}` }, openGraph: { title: page.title, description: page.intro, images: ["/assets/grimm-fire-pump-hero.png"] } }; }
export default async function TrustPage({ params }: { params: Promise<{ section: string }> }) { const { section } = await params; const page = trustPages[section]; if (!page) notFound(); const isContact = section === "contacto"; return <main><SiteHeader/><section className="section shaded"><div className="shell"><p className="eyebrow">{page.eyebrow}</p><h1 className="page-title">{page.title}</h1><p className="page-intro">{page.intro}</p>{isContact ? <div className="contact-page"><div><p>Comparta caudal, presión, fuente de agua, accionamiento, planos y requisitos del proyecto. La información publicada y la configuración final se confirman según el caso.</p></div><Suspense fallback={<div className="quote-form" aria-busy="true" /> }><LeadForm locale="es"/></Suspense></div> : <div className="trust-sections">{page.sections.map(([title, body]) => <section key={title}><h2>{title}</h2><p>{body}</p></section>)}</div>}</div></section><SiteFooter/></main>; }
