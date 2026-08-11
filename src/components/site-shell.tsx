import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { siteConfig } from "@/lib/site-config";

export { SiteHeader };

export function SiteFooter() {
  return <footer><div className="shell footer footer-expanded"><Link className="brand" href="/es"><span className="brand-mark" aria-hidden="true"/><span>GRIMM <b>PUMP</b><small>SISTEMAS DE BOMBEO</small></span></Link><div><Link href="/es/productos">Productos</Link><Link href="/es/soluciones">Soluciones</Link><Link href="/es/noticias">Noticias</Link><Link href="/es/contacto">Contacto</Link></div><div><Link href="/es/empresa">Empresa</Link><Link href="/es/descargas">Descargas</Link><Link href="/es/politica-de-privacidad">Privacidad</Link></div><p>© {new Date().getFullYear()} {siteConfig.legalCompanyName}<br/>Proveedor para proyectos en Chile.</p></div></footer>;
}

export function JsonLd({ data }: { data: unknown }) { return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />; }
export const organizationSchema = { "@context": "https://schema.org", "@type": "Organization", name: "GRIMM PUMP", url: "https://grimmfirepump.cl", logo: "https://grimmfirepump.cl/assets/brand/grimm-pump-logo.png", email: siteConfig.email, address: { "@type": "PostalAddress", streetAddress: siteConfig.address, addressCountry: "CN" } };
