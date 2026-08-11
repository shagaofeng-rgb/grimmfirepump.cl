# Current architecture — grimmfirepump-cl

Baseline recorded: 2026-08-11 (Asia/Shanghai). Rollback point: Git commit `f3470a8`.

## Runtime and deployment

- Framework: Next.js 16 App Router, React 19, TypeScript.
- Production: Vercel project `grimmfirepump-cl`, production branch `main`, Pro plan.
- Database: PostgreSQL/Neon via `DATABASE_URL`; the application initializes additive tables in `src/lib/database.ts`.
- Existing production cron: `/api/cron/search-console`, `17 3 */3 * *` (UTC), guarded by `CRON_SECRET` and a 72-hour database guard.

## Existing content architecture

| Logical function | Current URL/API | Physical store | Finding |
| --- | --- | --- | --- |
| Blog | `/es/blog`, `/es/blog/[slug]` | `news_articles`, `news_translations`, `news_categories` | Legacy physical names are misleading; this is the existing Blog system. |
| Third-party Blog publisher | `POST /api/webhook/send_article` | same legacy Blog tables | Signed, idempotent Blog-only webhook. It must be preserved. |
| Google Search Console sync | `GET /api/cron/search-console` | `sync_runs`, `seo_metrics` | Separate SEO task; not a content publisher. |
| News | none | none | No independent News URL, content type, worker, sitemap, or scheduler exists. |

## Decision

The new News implementation uses the `industry_news_*` namespace rather than `news_*`, because the latter already contains published Blog data. This is a deliberate physical isolation measure, not a rename of existing content.
