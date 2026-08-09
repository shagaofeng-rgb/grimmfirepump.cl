# 全站前后端检查、修复与验证报告

日期：2026-08-09（Asia/Shanghai）  
范围：公开西语站、语言准备页、询盘表单/API、数据库初始化与健康检查、SEO 路由、后台认证代码、构建与现有测试。  
新闻自动发布：**未修改**。未改动其工作流、触发、计划任务、接口协议、数据库表或后台配置。

## 已执行的基线与验证

| 项目 | 结果 | 证据/说明 |
| --- | --- | --- |
| `npm run lint` | 通过（0 error，2 warning） | 两条 warning 均在锁定的 Blog 页面，提示原生 `<img>` 可能影响 LCP。 |
| `npm test` | 通过 | 2 个测试文件、5 个测试全部通过。 |
| `npm run build` | 通过 | Next.js 16.2.10 完成编译、TypeScript 检查和 73 个页面生成。 |
| 隔离服务健康检查 | 通过 | `GET /api/health` → 200，`database: connected`。 |
| 隔离询盘写入 | 通过 | `POST /api/leads` → 201；只读查询确认 `leads` 表实际写入 1 条审计记录。 |
| 输入校验 | 通过 | 空 JSON 提交 `/api/leads` → 400，并返回字段级校验信息。 |
| 主要路由 | 通过 | `/es`、产品、解决方案、联系、Blog、`/en`、`/pt`、robots、sitemap、health 均为 200；未知路径为 404。 |

隔离 E2E 数据库：`data/audit-e2e-20260809.db`。它仅用于本次验证，未使用线上或现有数据库。测试记录邮箱为 `audit-20260809@invalid.example`，未发送邮件、未发布内容。

## 已修复

### 高：询盘网络失败会停留在“发送中”

- 页面：全站 `LeadForm`。
- 根因：`fetch` 网络异常没有 `try/catch`；请求被中断时组件不能恢复到可提交状态。
- 修复：为 POST 请求加入异常处理、统一错误状态和 `aria-busy`；保持字段名、POST API、数据库结构和原有后端协议不变。
- 验证：隔离环境 POST 返回 201，随后查询到 `leads` 的 `name/company/email/locale/source_path/status`；空请求返回 400。

### 中：西语询盘界面和语言准备页存在编码/文案问题

- 页面：询盘表单、`/en`、`/pt`。
- 根因：部分历史文件含有损坏的编码文本，导致重音字符、箭头和部分标签显示异常。
- 修复：重新写入规范 UTF-8 的西语表单；`/en` 使用英文准备页，`/pt` 使用葡语准备页；两者继续 `noindex,follow`，不伪装为完整翻译版本。
- 验证：生产构建与路由检查均通过。

### 中：移动导航可发现性与触控目标不足

- 页面：全站 Header。
- 根因：旧 Header 包含损坏的菜单文本，移动触发器仅为文字且视觉存在不确定性。
- 修复：Header 统一为 UTF-8 文案；移动按钮使用显式菜单图标、44px 目标、`aria-expanded` / `aria-controls`，保留 Escape、遮罩关闭和背景滚动锁定；桌面关键栏目仍为普通 `<a>` 链接。
- 验证：构建通过；CSS 对 `max-width:820px` 输出 `.menu-toggle { display:inline-flex }`。本机无头截图工具在 390px 下存在最小 CSS 视口裁切限制，不能将该截图作为真实设备菜单点击证明；须在真实手机或 Playwright mobile emulation 中做最终点击回归。

## 后端与同步检查

| 功能 | 实际检查 | 结论 |
| --- | --- | --- |
| 询盘 API | Zod 服务端校验、蜜罐、参数化 SQL、审计日志、201/400/500 返回 | 已通过隔离端到端验证。 |
| 数据库连接 | LibSQL 本地 / Neon Postgres 分支；生产缺少 `DATABASE_URL` 会显式失败 | 健康端点在隔离库验证通过。未读取或输出真实连接串。 |
| 后台登录 | bcrypt 比较、签名 HttpOnly 会话、失败次数锁定、审计日志 | 静态审查通过；本次未使用真实管理员凭据登录生产。 |
| 健康检查 | `SELECT 1`，失败时 503 且不泄露数据库错误 | 隔离环境通过。 |
| 产品管理同步 | 后台 `products` / `product_translations` 写入数据库；当前 `/es/productos/*` 主要渲染 `chileProducts` 静态内容 | **已发现、未改动。** 后台产品编辑不会自动更新当前西语产品详情页，需单独设计安全的发布/回退链路。 |
| 新闻自动发布 | Blog 页面、sitemap 与构建兼容 | 未改动业务逻辑；仅记录原生 `<img>` 的性能 warning。 |

## 多语言与 SEO

- `es` 是完整公开版本；`en`、`pt` 明确为准备页，返回 200 且 `noindex,follow`，没有继续把西语页面伪装成英语或葡语。
- 当前仓库没有 IP 地理语言识别、用户语言 cookie 优先级或可靠的语言切换持久化实现。该功能不能仅靠前端安全补齐；若要启用，应采用可信 CDN 国家头（如 Vercel）+ 用户选择 cookie 优先 + 默认 `/es` 回退，并评估缓存 `Vary`。本次未擅自增加。
- `robots.txt` 允许 Googlebot、Bingbot、OAI-SearchBot、PerplexityBot；GPTBot 仅受 `ALLOW_GPTBOT=true` 显式开关控制。
- `sitemap.xml`、canonical 与公开 URL 已通过本地 200 检查。未声称搜索引擎已收录。

## 前端、性能与安全结果

- 路由检查通过：`/es`、`/es/productos`、`/es/productos/sistema-incendio-edj`、`/es/soluciones`、`/es/contacto`、`/es/blog`、`/en`、`/pt`、`/robots.txt`、`/sitemap.xml`、`/api/health`。
- 浏览器截图检查：桌面产品页可渲染；小屏首页没有检测到应用层横向滚动样式问题，但本机无头 Chrome 的窄 viewport 截图存在裁切限制，不能替代真实手机点击测试。
- 表单使用 POST；不将用户字段置入 URL；服务端使用长度/格式限制与 honeypot。当前没有持久化限流或重复提交去重；生产应由 Vercel WAF/Upstash 等持久层落实。
- 未发现公开的密钥输出。本次只读取 `.env.local` 的变量名，未读取值。

## 未安全自动修改的风险与建议

1. **P1：产品数据双源。** 静态 `chileProducts` 与后台数据库并存。应先定义“草稿 → 审核 → 发布 → 失效 → 回退”的唯一数据源，再迁移公开页读取；迁移前需要备份数据库与逐页 SEO slug 映射。
2. **P1：真实多语言/IP 识别未实现。** 需要确认业务所需语言和部署平台缓存策略后再实施，避免把访客 IP 语言错误缓存给其他访客。
3. **P2：Blog 图片优化。** 两条 Lint warning 位于锁定新闻模块。本次遵守限制未改；待新闻模块解除锁定后再迁移为受控图片组件/域名配置。
4. **P2：生产数据库与真实 CRM/邮件闭环。** 本次仅验证隔离数据库；没有在生产提交测试询盘，避免污染真实线索。上线前应在独立测试环境验证通知、CRM 和后台读取。
5. **P2：媒体来源。** `next.config.ts` 仍允许 GitHub raw 图片域；应逐步迁移至受控对象存储/CDN 后再收紧。

## 备份与回滚

- 修改前快照：`audit-backups/20260809-140833/`。
- 本次改动均为源文件文本修改；可从该目录逐个恢复对应文件。
- 未执行数据库迁移、删除、清表、内容发布、新闻任务修改或生产部署。
