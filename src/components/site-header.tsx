"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const products = [
  ["Sistema EDJ", "/es/productos/sistema-bomba-incendio-edj"],
  ["Bomba diésel", "/es/productos/bomba-diesel-contra-incendio"],
  ["Bomba eléctrica", "/es/productos/bomba-electrica-contra-incendio"],
  ["Bomba jockey", "/es/productos/bomba-jockey-contra-incendio"],
  ["Bomba de eje largo", "/es/productos/bomba-incendio-eje-largo"],
] as const;

const solutions = [
  ["Bodegas y logística", "/es/soluciones/bombas-contra-incendio-bodegas"],
  ["Plantas industriales", "/es/soluciones/bombas-contra-incendio-plantas-industriales"],
  ["Centros de datos", "/es/soluciones/bombas-contra-incendio-centros-datos"],
  ["Petróleo, gas y sitios remotos", "/es/soluciones/bombas-contra-incendio-petroleo-gas"],
] as const;

type DesktopMenu = "products" | "solutions" | null;

export function SiteHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopMenu, setDesktopMenu] = useState<DesktopMenu>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const desktopNavRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!mobileOpen) return;
    const trigger = triggerRef.current;
    const previousOverflow = document.body.style.overflow;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      trigger?.focus();
    };
  }, [mobileOpen]);

  useEffect(() => {
    const closeWhenOutside = (event: MouseEvent) => {
      if (desktopNavRef.current && !desktopNavRef.current.contains(event.target as Node)) setDesktopMenu(null);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setDesktopMenu(null);
    };
    document.addEventListener("mousedown", closeWhenOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeWhenOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  const closeMobile = () => setMobileOpen(false);
  const toggleDesktop = (menu: Exclude<DesktopMenu, null>) => setDesktopMenu((current) => current === menu ? null : menu);

  return <header className="site-header"><div className="shell site-nav">
    <Link className="brand" href="/es"><span className="brand-mark" aria-hidden="true" /><span>GRIMM <b>PUMP</b><small>SISTEMAS DE BOMBEO</small></span></Link>
    <nav ref={desktopNavRef} className="desktop-nav" aria-label="Navegación principal">
      <div className="nav-menu" data-open={desktopMenu === "products"}><div className="nav-link-group"><Link href="/es/productos" onClick={() => setDesktopMenu(null)}>Productos</Link><button className="menu-expander" type="button" aria-label="Abrir categorías de productos" aria-haspopup="menu" aria-expanded={desktopMenu === "products"} aria-controls="products-menu" onClick={() => toggleDesktop("products")}>⌄</button></div><div id="products-menu" className="mega-menu" role="menu"><div><p>Por sistema</p>{products.map(([name, href]) => <Link key={href} href={href} role="menuitem" onClick={() => setDesktopMenu(null)}>{name}</Link>)}</div><div><p>Por proyecto</p>{solutions.slice(0, 3).map(([name, href]) => <Link key={href} href={href} role="menuitem" onClick={() => setDesktopMenu(null)}>{name}</Link>)}</div><div className="mega-cta"><b>¿Está preparando un proyecto?</b><span>Comparta caudal, presión y condiciones de instalación.</span><Link className="btn" href="/es/contacto" onClick={() => setDesktopMenu(null)}>Solicitar cotización</Link></div></div></div>
      <div className="nav-menu" data-open={desktopMenu === "solutions"}><div className="nav-link-group"><Link href="/es/soluciones" onClick={() => setDesktopMenu(null)}>Soluciones</Link><button className="menu-expander" type="button" aria-label="Abrir soluciones por industria" aria-haspopup="menu" aria-expanded={desktopMenu === "solutions"} aria-controls="solutions-menu" onClick={() => toggleDesktop("solutions")}>⌄</button></div><div id="solutions-menu" className="sub-menu" role="menu">{solutions.map(([name, href]) => <Link key={href} href={href} role="menuitem" onClick={() => setDesktopMenu(null)}>{name}</Link>)}</div></div>
      <Link href="/es/guias">Guías</Link><Link href="/es/noticias">Noticias</Link><Link href="/es/empresa">Empresa</Link><Link href="/es/contacto">Contacto</Link>
    </nav>
    <Link className="btn nav-quote" href="/es/contacto">Solicitar cotización</Link>
    <button ref={triggerRef} className="menu-toggle" type="button" aria-expanded={mobileOpen} aria-controls="mobile-navigation" onClick={() => setMobileOpen(true)}><span className="menu-icon" aria-hidden="true" /><span>Menú</span></button>
  </div>{mobileOpen ? <div className="mobile-overlay" onClick={closeMobile}><nav id="mobile-navigation" className="mobile-drawer" aria-label="Navegación móvil" onClick={(event) => event.stopPropagation()}><div className="drawer-top"><b>Menú</b><button type="button" onClick={closeMobile}>Cerrar</button></div><Link href="/es/productos" onClick={closeMobile}>Productos</Link><details><summary>Ver categorías</summary>{products.map(([name, href]) => <Link key={href} href={href} onClick={closeMobile}>{name}</Link>)}</details><Link href="/es/soluciones" onClick={closeMobile}>Soluciones</Link><details><summary>Ver industrias</summary>{solutions.map(([name, href]) => <Link key={href} href={href} onClick={closeMobile}>{name}</Link>)}</details><Link href="/es/guias" onClick={closeMobile}>Guías</Link><Link href="/es/noticias" onClick={closeMobile}>Noticias</Link><Link href="/es/empresa" onClick={closeMobile}>Empresa</Link><Link href="/es/contacto" onClick={closeMobile}>Contacto</Link><Link className="btn" href="/es/contacto" onClick={closeMobile}>Solicitar cotización</Link><p>Español · Chile</p></nav></div> : null}</header>;
}
