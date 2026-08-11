# Schedules and trigger chain — grimmfirepump-cl

Baseline recorded: 2026-08-11.

| Task | Entry point | Schedule/timezone | Current write target | May publish | Action |
| --- | --- | --- | --- | --- | --- |
| Search Console sync | `/api/cron/search-console` | `17 3 */3 * *`, UTC | `sync_runs`, `seo_metrics` | No | Keep unchanged. |
| Plugin Blog webhook | `/api/webhook/send_article` | Event-driven | Legacy Blog tables | Blog only | Keep unchanged and isolated. |
| News ingest | absent | absent | none | No | Add as a 12-hour, candidate-only task. |
| News publisher | absent | absent | none | No | Add as a 48-hour task, with frontend verification required before success. |

There is no observed legacy six-hour News task, CMS auto-publisher, queue worker, GitHub Action, or Vercel Cron that writes News. Full-text repository search was performed for `news`, `blog`, `cron`, `schedule`, `ingest`, `publish`, `webhook`, `queue`, `worker`, `rss`, and `sitemap`.

All new cron requests require the existing `CRON_SECRET`. The production Vercel plan is Pro, whose cron capacity permits the two new schedules in addition to the current SEO cron.
