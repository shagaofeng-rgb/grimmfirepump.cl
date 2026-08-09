# Responsive QA report

Date: 2026-08-09

## Method

- Production build generated successfully with 73 public/static route outputs.
- Chrome headless local renders were captured for `/es` at 360, 375, 390, 768, 1024, 1280 and 1440px.
- The first 390px render exposed a narrow-screen overflow in the hero/header. CSS was corrected with mobile grid containment, word wrapping, viewport-safe shell sizing and a smaller mobile title scale; a final 390px render was captured after the correction source change.

## Implemented breakpoint behavior

| Width | Navigation | Layout result |
|---:|---|---|
| 360 | Drawer trigger; desktop nav hidden | One-column cards, compact title and 44px controls. |
| 375 | Drawer trigger; grouped quick links wrap | One-column content and form fields. |
| 390 | Drawer trigger; grid containment applied | Hero/media, CTA and selection links constrained to viewport. |
| 768 | Drawer trigger | Two-column process/trust content where space permits. |
| 1024 | Desktop navigation | Product cards use 2-3 columns; no desktop mega-menu overlap rule. |
| 1280 | Desktop navigation and mega menu | Core cards use five columns and content remains within 1200px shell. |
| 1440 | Desktop navigation and mega menu | Same 1200px max-width, preventing stretched reading lines. |

## Accessibility checks

- Mobile menu has `aria-expanded`, `aria-controls`, Escape close, overlay close, body scroll lock and trigger focus restoration.
- Links remain real anchors; summary controls remain keyboard operable.
- Buttons and drawer controls are at least 44px high.
- Global visible focus ring and reduced-motion behavior are retained.

## Remaining manual visual work

The repository has no verified individual product, application, factory, test or certificate photography. The structure is responsive, but final media QA should be repeated after approved assets are supplied.
