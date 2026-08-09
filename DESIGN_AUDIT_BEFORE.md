# Design audit before redesign

Date: 2026-08-09

## Existing public routes

- `/` redirects to `/es`; `/es` is the Spanish home.
- `/es/productos` and 26 generated product detail pages exist. Five earlier Chile category URLs remain as permanent redirects.
- `/es/soluciones` plus four industry pages exist.
- `/es/empresa`, `/es/fabrica`, `/es/pruebas`, `/es/certificados`, `/es/proyectos`, `/es/descargas`, `/es/guias`, `/es/contacto`, `/es/politica-de-privacidad` exist.
- `/es/blog` and article routes remain public. `/en` and `/pt` are noindex language-preparation pages.

## Findings

- Header was a single row of text links. It had no desktop product mega menu, no accessible mobile drawer, no Escape handling, no focus restoration and no scroll lock.
- The home product grid rendered all 26 catalog products without a Chile-specific core-category entry path. The current product detail pages were functional but visually text-heavy and did not provide a product hero, page directory or responsive side inquiry pattern.
- Existing product and solution links already point to independent URLs; no current public card needs to retain an anchor-only `#contacto` destination.
- Styles used a partial industrial palette but had inconsistent component spacing, overly tall product cards, a horizontal mobile nav, and reused the same hero asset in several templates.
- Lead form already uses POST, labels and a honeypot. It needs layout and state presentation improvements, not a field-name change.
- Only a controlled local hero product image is present in `public/assets`. There are no verified individual product, factory, certificate, testing or project images to publish.
- `/en` and `/pt` are preserved as `noindex,follow` preparation pages. They must not receive Spanish marketing content or be placed in an indexable hreflang set until translations are complete.

## Preserve and refactor

- Preserve all existing URLs, canonical metadata, lead endpoint and published product data.
- Keep `/es/products/*` and earlier five Chile product slugs as 308 compatibility routes.
- Refactor shared header, footer, page containers, product collection, product detail template, home layout and global tokens.
- Add no route deletions and no new 301 mappings in this redesign.
