# Google Search Console 运行说明

## 已实施的动作

- Vercel Cron 每 3 个日历日调用 `/api/cron/search-console`。
- 指标同步与 Sitemap 提交使用不同的 `sync_runs.source`：`google_search_console` 和 `google_search_console_sitemap`。
- Sitemap 提交使用 Google Search Console Sitemaps API，目标固定为 `https://grimmfirepump.cl/sitemap.xml`。
- 定时任务仅在 Sitemap 内容指纹变化且距上次成功提交至少 72 小时时提交。后台授权的人工运行可以用于一次验证。
- 每次提交、跳过与失败都会写入 `sync_runs` 和 `audit_logs`。提交成功仅代表 Google API 接收，不代表 URL 已收录。

## 生产环境前置条件

1. 在 Search Console 建立或使用 `sc-domain:grimmfirepump.cl` 属性。
2. 将生产环境 `GOOGLE_SERVICE_ACCOUNT_JSON` 中的服务账号邮箱添加为该属性的完整用户。
3. 保持 `GOOGLE_SEARCH_CONSOLE_PROPERTY=sc-domain:grimmfirepump.cl` 与属性完全一致。
4. 在 Vercel 生产环境配置 `CRON_SECRET`，不要在客户端、仓库或日志中输出它。

## 验证步骤

1. 以管理员身份运行后台 Search Console 同步一次。
2. 在同步记录中确认指标任务为 `success`，Sitemap 任务为 `submitted` 或因未变化而 `skipped`。
3. 在 Search Console 的 Sitemaps 页面确认 `https://grimmfirepump.cl/sitemap.xml` 已接收。
4. 使用 URL Inspection 检查 `/es`、一个产品页和一个内容页；记录 Pages 报告给出的实际未收录原因。

## 回滚

恢复 `audit-backups/google-search-console-20260907/` 中的 `search-console.ts.bak`、`sitemap.ts.bak` 和 `vercel.json.bak` 后重新部署。数据库仅新增一条 `system_settings` 指纹记录及可审计的运行日志；无需删除任何内容数据。
