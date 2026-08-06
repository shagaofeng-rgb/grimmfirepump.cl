import { notFound } from "next/navigation";
import { getPublicProducts } from "@/lib/public-catalog";
import { siteConfig, type Locale } from "@/lib/site-config";

export const dynamic = "force-dynamic";

export default async function ProductPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  if (!siteConfig.supportedLocales.includes(locale as Locale)) notFound();
  const product = (await getPublicProducts()).find((item) => item.slug === slug);
  if (!product) notFound();
  return <main><header className="header"><div className="shell nav"><a className="brand" href={`/${locale}`}><span className="brand-mark"><i/><i/><i/></span><span>GRIMM <b>PUMP</b><small>SISTEMAS CONTRA INCENDIO</small></span></a><a className="btn btn-small" href={`/${locale}#contacto`}>Solicitar cotización →</a></div></header><section className="section product-detail"><div className="shell"><h1 className="page-title">{product.name}</h1><p className="page-intro">{product.description}</p><div className="spec-panel"><h2>Parámetros principales</h2><dl>{product.specs.map(([key, value]) => <div key={key}><dt>{key}</dt><dd>{value}</dd></div>)}</dl></div><div className="notice">La información publicada procede del catálogo operativo. Comparta caudal, presión y aplicación para revisar la configuración aplicable.</div><a href={`/${locale}#contacto`} className="btn">Solicitar orientación técnica →</a></div></section></main>;
}
