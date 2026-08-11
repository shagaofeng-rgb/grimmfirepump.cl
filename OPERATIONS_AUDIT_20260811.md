# 生产数据、Blog 自动发布、Google SEO 与全站自检报告

执行日期：2026-08-11（Asia/Shanghai）  
生产项目：`grimmfirepump-cl` / `https://grimmfirepump.cl`  
数据库：Vercel Production `DATABASE_URL`（Neon PostgreSQL；连接值未读取或输出）

## 1. 已确认正常

| 检查项 | 真实证据 | 结果 |
| --- | --- | --- |
| 生产数据库连接 | `GET /api/health` → `200`，响应 `database: connected` | 正常 |
| 数据结构 | 生产库实际存在 `products`、`product_translations`、`news_articles`、`news_translations`、`leads`、`sync_runs`、`audit_logs` | 正常 |
| 产品数据 | 生产库有 4 条未删除产品；抽样的 `Conjunto EDJ`、`Bomba diésel + jockey`、`Conjunto eléctrico + jockey` 均为 `published` | 数据库正常 |
| Blog 数据 | 生产库有 5 条未删除文章；最近 3 条均为 `published`，含 `external_fingerprint` | 数据库/插件写入正常 |
| Blog 去重 | `external_fingerprint` 存在生产唯一部分索引；实际重复分组查询返回 0 行 | 正常 |
| 自动发布近期证据 | 最近正式文章发布时间为 2026-08-08、08-09、08-10（UTC）；文章可由 `/es/blog/<slug>` 返回 200 | 正常 |
| 前端 Blog 与 Sitemap | `/es/blog` 及抽样详情页均 200；`/sitemap.xml` 200 | 正常 |
| Google Search Console | 2026-08-10 03:17 UTC 的 scheduled `sync_runs` 为 `success`，处理 28 条记录 | 正常 |
| SEO 频率 | 生产 `vercel.json`：`17 3 */3 * *`；2026-08-07 的运行被 `cadence_guard` 跳过，08-10 成功 | 每 3 天保护机制已生效 |
| 公开服务 | `/es`、`/es/productos`、Blog、robots、sitemap、health 均返回 200；根域为一跳 301 到 `/es` | 正常 |

## 2. 已发现并修复

### `/favicon.ico` 404

- 证据：Vercel 生产日志在 2026-08-09 记录 `GET /favicon.ico` 为 404。
- 修复：新增 `src/app/favicon.ico/route.ts`，以 308 重定向至已有受控图标 `/icon.png`。
- 影响：仅消除浏览器/爬虫的常规图标请求 404；不改图标资产或页面内容。
- 回滚：删除该 route 文件即可恢复原行为。

### Blog 插件配置可维护性

- 修复：在 `.env.example` 声明 `WEBHOOK_ARTICLE_SIGN`，并扩展 `BLOG_WEBHOOK_SETUP.md` 的生产配置、非写入验证、去重与密钥轮换说明。
- 影响：不修改生产密钥、Webhook 实现、文章数据或定时任务。

## 3. 已发现但未安全自动修复

### 管理员凭据/环境变量不一致（P1）

- 证据：生产 `ADMIN_EMAIL` 变量实际为空；生产库有 1 个启用的邮箱格式超级管理员。使用此前提供的凭据进行 `/api/admin/session` 实测返回 401，空环境凭据返回 400。
- 影响：无法以当前已知凭据完成后台 API 的真实登录、编辑、撤回操作验证。
- 未自动重置原因：覆盖管理员密码或邮箱会改变现有访问凭据，可能使现有管理员失去访问权。
- 所需操作：提供当前有效的管理员邮箱与密码，或明确授权将现有超级管理员重置为指定的新凭据。

### Webhook 正式密钥不可在此审计会话读取（P1）

- 证据：`WEBHOOK_ARTICLE_SIGN` 已作为 Vercel 加密 Production 变量存在；使用审计会话拉取的值向 Webhook 测试返回 HTTP 401。生产库连续三天已有指纹化的成功发布记录，证明实际插件并未整体失效。
- 影响：无法在不掌握现有插件密钥的条件下创建新的测试文章并完成“Webhook → 后台 API → 草稿撤回”的完整闭环。
- 未自动重置原因：更换密钥会立即使已配置的第三方插件失效，需同步更新插件端。
- 所需操作：提供当前插件端 API key，或明确授权一次性轮换密钥并同步更新插件。

### 前台产品与后台产品双数据源（P1）

- 证据：`/es/productos/*` 渲染 `src/lib/chile-content.ts` 的静态 26 个面向智利内容；后台 `products` 写入 PostgreSQL，历史 `/es/products/*` 在西语下重定向到静态页。
- 影响：后台编辑的 4 条产品不会自动更新当前主产品页；不满足“后台修改后前台立即同步”的完整要求。
- 未自动修改原因：直接替换会使 26 个已上线产品 URL/西语内容发生业务与 SEO 迁移，需确认唯一内容源、字段映射及 301/回滚方案。

### 线索抽查不足（P2）

- 证据：生产 `leads` 表当前为 0 条，无法抽取 3 条真实线索；未创建虚假线索。

## 4. Blog 系统与插件结论

- 现有 Blog：存在；前端在 `/es/blog` 与 `/es/blog/[slug]`，后台资源为 `news`，数据表为 `news_articles`、`news_translations`、`news_categories`。
- 第三方接入：`POST /api/webhook/send_article`，支持 `application/x-www-form-urlencoded` 与 JSON；字段为 `sign`、`class_id`、`title`、`content`、`author_id`、`image_url`。
- 鉴权：常量时间比较的 `WEBHOOK_ARTICLE_SIGN`；未配置返回 503，错误密钥返回 401。
- 幂等：以 `class_id + title + content` 的 SHA-256 指纹去重；重复请求返回成功且不新建文章。
- 审计：成功发布写入 `audit_logs`；测试期间未写入文章，因为签名验证在入口返回 401。
- 发布/草稿/撤回：后台已有状态字段和 PATCH 实现；因管理员凭据阻塞，未将真实文章改动作为测试。

## 5. Google SEO 主动传递

- 代码位置：`src/app/api/cron/search-console/route.ts`、`src/lib/search-console.ts`、`vercel.json`。
- 当前计划：`17 3 */3 * *`（UTC）。
- 应用级保护：最近成功 scheduled 同步小于 72 小时即插入 `skipped/cadence_guard` 记录，不重复调用 Google。
- 旧记录：2026-08-04 至 08-05 存在每 6 小时的历史成功同步；当前 08-07/08-10 记录表明频率已经被修正。
- 未重复手动调用 Google，避免无必要的配额消耗。

## 6. 性能与可用性抽查

| URL | 状态 | TTFB | 总耗时 |
| --- | ---: | ---: | ---: |
| `/es` | 200 | 0.406s | 0.422s |
| `/es/productos` | 200 | 0.547s | 0.610s |
| `/es/blog` | 200 | 0.922s | 0.922s |
| Blog 抽样详情 | 200 | 0.407s | 0.422s |
| `/robots.txt` | 200 | 0.250s | 0.250s |
| `/sitemap.xml` | 200 | 0.485s | 0.485s |
| `/api/health` | 200 | 0.390s | 0.390s |

这些是单次网络采样，不代表 Core Web Vitals 或长期 SLA。

## 7. 运行项清单与冲突检查

| 项目 | 触发 | 状态 | 冲突检查 |
| --- | --- | --- | --- |
| 公共 Next.js 页面/API | HTTP 请求 | 正常 | 无循环触发证据 |
| Blog Webhook | 第三方 POST | 近期文章证明正常 | 指纹唯一约束防重复 |
| Google Search Console | Vercel Cron | 正常 | `cadence_guard` 防 72h 内重复 |
| 后台管理 API | 管理员会话 | 凭据待修复 | 不改生产数据 |
| 线索 API | 表单 POST | 数据库表正常，生产无记录 | 未伪造测试线索 |

## 8. 文件、回滚与部署

- 修改文件：`src/app/favicon.ico/route.ts`、`.env.example`、`BLOG_WEBHOOK_SETUP.md`、本报告。
- 数据库结构：本次无迁移、无删除、无生产数据写入。
- 备份：`audit-backups/20260811-105100/`（环境示例与 Webhook 文档的修改前副本）。
- 部署前验证（2026-08-11）：`npm run lint` 完成（0 error，2 条既有 Blog 远程 `<img>` 优化 warning）；`npm test` 为 2 个测试文件、5 个测试全部通过；`npm run build` 成功，生成 74 个路由页面。
- 本地生产运行验证（2026-08-11）：`GET /favicon.ico` 返回 `308 Location: /icon.png`；`GET /icon.png` 返回 `200 image/png`。
- 下一步：部署 Vercel Production 并在线验证 `/favicon.ico`、`/api/health`、Blog、sitemap。
