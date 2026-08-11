# Blog publishing webhook

- Endpoint: `POST https://grimmfirepump.cl/api/webhook/send_article`
- Content type: `application/x-www-form-urlencoded`
- Authentication: send the server-only API key in the `sign` field. The key is stored only in Vercel's encrypted production environment and must not be committed to this repository.
- Required content fields: `sign`, `title`, `content`.
- Optional fields: `class_id` (defaults to `blog`), `author_id`, `image_url` (HTTPS only).

Successful requests return `{"code":1,"msg":"发布成功"}`. A retry of identical content returns code `1` and is safely ignored, preventing duplicate entries. Validation, authentication, and server failures return code `0` with a reason. Published entries are immediately available at `/es/blog` and are included in the sitemap.

## Production operations

- Configure the key as `WEBHOOK_ARTICLE_SIGN` in the Vercel **Production** environment. The plugin's `API_KEY` must be the same value.
- Use `POST https://grimmfirepump.cl/api/webhook/send_article` with `application/x-www-form-urlencoded`. A signed request containing only `sign` and `class_id` is a non-writing connection check.
- The endpoint records accepted publishes in `audit_logs` and deduplicates identical `class_id + title + content` payloads through `external_fingerprint`.
- Do not rotate the key until the plugin configuration has been updated at the same time; otherwise its requests will correctly return HTTP 401 with `code: 0`.
