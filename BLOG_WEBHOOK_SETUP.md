# Blog publishing webhook

- Endpoint: `POST https://grimmfirepump.cl/api/webhook/send_article`
- Content type: `application/x-www-form-urlencoded`
- Authentication: send the server-only API key in the `sign` field. The key is stored only in Vercel's encrypted production environment and must not be committed to this repository.
- Required content fields: `sign`, `title`, `content`.
- Optional fields: `class_id` (defaults to `blog`), `author_id`, `image_url` (HTTPS only).

Successful requests return `{"code":1,"msg":"发布成功"}`. A retry of identical content returns code `1` and is safely ignored, preventing duplicate entries. Validation, authentication, and server failures return code `0` with a reason. Published entries are immediately available at `/es/blog` and are included in the sitemap.
