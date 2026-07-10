# GRIMM PUMP LATAM 后台实施计划

## 当前项目情况

- 框架：Next.js App Router、TypeScript、React。
- 数据访问：`@libsql/client`。本地使用 SQLite 文件；生产必须使用 LibSQL/Turso 等持久化远程数据库，不能使用 Vercel 本地文件系统。
- 已有前台、公开询盘接口和基础登录界面。
- Vercel 项目已连接；Google Search Console 服务账号已安全写入生产环境。

## 技术架构

- 后台/API：Next.js Route Handlers，所有写操作执行服务端会话与角色权限验证。
- 鉴权：bcrypt 密码哈希、JWT HttpOnly Cookie、登录失败锁定、审计日志。
- 数据库：用户与角色、产品/翻译/分类、新闻/翻译、线索、分析聚合、SEO 指标/问题、同步运行、媒体、设置与审计表。
- 外部 SEO：Google Search Console 服务账号 JWT，手动同步 API 与每 6 小时 Cron 路由。

## 已实施阶段

1. 基础架构：已完成数据库初始化、RBAC、中文后台导航、登录加固、审计日志。
2. 内容与线索：已完成产品分类、产品、新闻、线索、用户与设置的服务端分页/搜索/API/软删除基础能力。
3. SEO 与同步：已完成真实 Search Console 数据同步适配器、任务日志表、受保护的手动同步接口与 Cron 路由。

## 待完成的外部配置

- 在 Vercel Production 配置 `DATABASE_URL` 和 `DATABASE_AUTH_TOKEN`（持久化 LibSQL/Turso）。
- 配置 `GOOGLE_SEARCH_CONSOLE_PROPERTY=sc-domain:grimmfirepump.cl`。
- 配置随机 `CRON_SECRET`，以启用每 6 小时的 SEO 同步。
- 对象存储未接入前，媒体库表已就绪，但不能把上传文件写入 Vercel 临时磁盘。

## 安全方案

- 密码仅以 bcrypt 哈希保存；初始密码仅作为首次数据库启动的环境变量输入。
- 后台页面和 API 双重进行会话/角色权限校验。
- 登录失败 5 次锁定 15 分钟；审计日志不会记录密码、令牌或完整密钥。
- 所有新增/更新 API 使用 Zod 服务端校验；删除采用软删除。

## 测试与部署

- 执行：`npm run lint`、`npm run test`、`npm run build`。
- 本地：`npm run dev`，使用 `.env.local` 的 SQLite 地址。
- 生产：先配置持久化数据库，再部署；部署后验证 `/api/health`、后台登录、产品/新闻/线索 CRUD 与 Search Console 同步。

## 风险与限制

- 未配置生产数据库时，部署可以访问前台，但后台业务数据与同步任务不能可靠运行。
- 未配置对象存储时，不能启用真实文件上传；不得用 Vercel 函数本地磁盘替代。
- 新闻自动化、GA4/访问事件、完整富文本编辑器和 CSV/Excel 文件导入导出需要各自的外部服务或追加实现，当前不会用模拟数据冒充真实结果。
