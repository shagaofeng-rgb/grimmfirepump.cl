# GRIMM PUMP LATAM

独立部署的南美 B2B 网站与中文管理后台。前台使用西班牙语优先的 `/es` 路由；后台入口为 `/admin/login`。

## 本地启动

```powershell
$env:PATH = (Resolve-Path "../.tools/node").Path + ";" + $env:PATH
../.tools/node/npm.cmd run dev -- --port 3001
```

本地数据库默认使用 `file:./data/grimm-latam.db`。首次启动会通过 `ADMIN_EMAIL` 和 `ADMIN_PASSWORD` 创建 bcrypt 哈希的初始超级管理员；这两个变量仅用于首次建库，随后可在用户管理中创建其他账号。

## 后台功能

- 安全登录：bcrypt、HttpOnly 会话 Cookie、记住登录、失败 5 次锁定 15 分钟、登录审计。
- 角色权限：超级管理员、管理员、编辑、市场、销售、分析、只读；API 与导航均按权限判断。
- 业务模块：数据概览、产品/分类、新闻、客户表单、用户、SEO、同步、设置、操作日志。
- 数据能力：服务端搜索、分页（10/20/50/100）、软删除、线索状态/负责人/备注接口、审计日志。
- SEO：Google Search Console 服务账号同步、任务日志、后台手动同步、Vercel Cron 路由。

## 环境变量

从 `.env.example` 创建 `.env.local`。不要提交 `.env.local` 或任何真实密钥。

生产环境必须配置：

- `DATABASE_URL`：持久化 LibSQL/Turso 数据库地址。
- `DATABASE_AUTH_TOKEN`：远程 LibSQL 数据库访问令牌。
- `AUTH_SECRET`：随机的高熵会话签名密钥。
- `ADMIN_EMAIL`、`ADMIN_PASSWORD`：仅供首次初始化管理员使用。
- `GOOGLE_SERVICE_ACCOUNT_JSON`：Vercel 加密变量，不得写入仓库。
- `GOOGLE_SEARCH_CONSOLE_PROPERTY=sc-domain:grimmfirepump.cl`
- `CRON_SECRET`：保护 `/api/cron/search-console`。

Vercel 不提供可持久化的函数本地磁盘；不要在生产环境使用 `file:` 数据库地址。配置数据库后重新部署，应用会自动创建所需表和索引。

## 验证

```powershell
../.tools/node/npm.cmd run lint
../.tools/node/npm.cmd run test
../.tools/node/npm.cmd run build
```

本地冒烟流程：健康检查 → 后台登录 → 新建产品分类 → 分类列表读取 → 软删除分类。

## 同步与备份

- Search Console：手动执行 `POST /api/admin/sync/search-console`，或由 `vercel.json` 每 6 小时调用受 `CRON_SECRET` 保护的 Cron 路由。
- 数据库备份：使用所选 LibSQL/Turso 服务的官方备份/时间点恢复能力；上线前应执行一次还原演练。对象存储接入后，媒体文件需由对象存储自身的版本/备份策略覆盖。

## 已知外部依赖

媒体实体与内容字段已建模，但真实文件上传需要 S3/R2 等对象存储配置。访问分析需要接入 GA4 或网站事件采集。新闻自动化、富文本编辑器与 CSV/Excel 导入导出不能以模拟数据替代，需在相应服务与文件存储就绪后接入。
