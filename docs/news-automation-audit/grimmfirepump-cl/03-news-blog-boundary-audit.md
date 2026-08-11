# News / Blog boundary audit — grimmfirepump-cl

## Confirmed baseline issue

The tables named `news_articles`, `news_translations`, and `news_categories` are exposed by `/es/blog` and are the destination for the pre-existing third-party Blog Webhook. Treating them as an automated News store would mix content types, sitemaps, routes, and editorial rules.

## Enforced target mapping

| Boundary | Blog (existing) | News (new) |
| --- | --- | --- |
| URL | `/es/blog`, `/es/blog/[slug]` | `/es/noticias`, `/es/noticias/[slug]` |
| API/ingress | `/api/webhook/send_article` | Cron-only internal workflow; no third-party Blog plugin access |
| Tables | `news_articles`, `news_translations`, `news_categories` | `industry_news_sites`, `industry_news_sources`, `industry_news_candidates`, `industry_news_articles`, and run/check/audit tables |
| Sitemap | existing main sitemap Blog entries | dedicated `/news-sitemap.xml`, also referenced from the sitemap index |
| RSS | not enabled | `/es/noticias/rss.xml` |
| Publishing | authorized external Blog plugin/manual admin | source-attributed 48-hour News publisher |
| Images | Blog publisher media | only source-cleared URL or a site-owned neutral asset |

No News workflow may query or write the Blog tables. No Blog route, sitemap, or plugin may read the new News tables.
