# Rollback plan

## Code/configuration rollback

1. Deploy or revert to Git commit `f3470a8` (the pre-News baseline).
2. Restore `vercel.json` to its single Search Console cron definition.
3. Disable the News site configuration row (`enabled = false`) before any code rollback if immediate publication stop is required.

## Data rollback

The News tables are additive. No Blog row is altered by this feature. To hide a problematic News record without deletion, set its status to `archived` and remove it from the News sitemap/RSS through the normal query filters. Retain audit records for investigation.

## Safety checks

- Never delete `news_articles`, `news_translations`, or `news_categories`: they are legacy Blog data.
- Never roll back the Blog Webhook secret or third-party plugin configuration as part of a News rollback.
- Before any destructive data action, export the relevant `industry_news_*` rows and record the export timestamp.
