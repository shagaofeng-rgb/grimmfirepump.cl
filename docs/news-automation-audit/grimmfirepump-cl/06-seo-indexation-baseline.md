# SEO and indexation baseline

| Surface | Baseline |
| --- | --- |
| Main sitemap | `/sitemap.xml` includes public site, product, solution, trust, and Blog URLs. |
| Blog sitemap | Not separate; Blog entries are currently embedded in the main sitemap. |
| News sitemap/RSS | Not present. |
| Robots | Allows Googlebot, Bingbot, OAI-SearchBot, and PerplexityBot; GPTBot is explicitly controlled by `ALLOW_GPTBOT`. |
| News schema | Not present. |

Target: new, standalone News sitemap and RSS; only published self-canonical News articles appear there. Existing Blog indexation is retained.
