# GRIMM PUMP Chile design system

## Design direction

Industrial B2B, dark blue and graphite surfaces, white working areas and one safety-orange action color. The interface is intentionally low-motion, information-led and designed for engineering procurement.

## Tokens

- Content width: 1200px; mobile page gutter: 16px; tablet: 24px; desktop: 32px.
- Spacing: 8px base scale from 8px to 96px.
- Breakpoints: 360, 375, 390, 768, 1024, 1280 and 1440px.
- Radius: 10px for inputs and cards, 6px for small controls; buttons remain compact rectangles.
- Colors: navy `#09253b`, graphite `#163545`, page `#f4f7f8`, surface `#ffffff`, muted `#607580`, orange `#d45a32`.
- Type: system sans stack with a display-weight hierarchy; body 16px, H1 clamp 38-64px, H2 clamp 28-42px.

## Component rules

- Buttons have a minimum 44px hit area, visible focus ring, hover and active feedback.
- Cards use one border and a restrained navy-tinted shadow only on hover.
- Product and solution links use normal anchors and remain crawlable without JavaScript.
- Images reserve ratio and use `object-fit: cover` only for contextual hero/media; equipment photos use `contain` when supplied.
- All motion is limited to interaction feedback and disabled by `prefers-reduced-motion`.
