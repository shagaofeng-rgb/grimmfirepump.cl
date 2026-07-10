# GRIMM PUMP LATAM

独立部署的南美 B2B 网站工程，不覆盖既有主站。默认前台为西语，路由已预留西语、葡语和英语版本。

## 本地启动

项目内置 Node 运行时位于上级目录 `.tools/node`。从本目录运行：

```powershell
$env:PATH = (Resolve-Path "../.tools/node").Path + ";" + $env:PATH
../.tools/node/npm.cmd run dev -- --port 3001
```

访问：`http://localhost:3001/es`。

## 已实现的本地功能

- `/es`、`/pt`、`/en` 独立前台路由；产品中心和产品详情路由。
- `/api/leads`：Zod 服务端校验、蜜罐字段、UUID 与审计记录。
- libSQL/SQLite 持久化开发数据库；`/api/health` 健康检查。
- `/admin/login` 和 `/admin`：基于签名 HttpOnly Cookie 的中文后台登录和询盘看板。
- 真实环境变量位于 `.env.local`，该文件不会进入版本控制。上线前必须替换其中的初始密码、密钥和数据库地址。

## 验证

```powershell
../.tools/node/npm.cmd run lint
../.tools/node/npm.cmd run test
../.tools/node/npm.cmd run build
```

## 上线前的后续模块

PDF 中列出的完整 CMS、RBAC、媒体对象存储、新闻采集队列、邮件服务、PostgreSQL 生产数据库和部署编排仍需按服务器环境配置。它们不应以静态页面或虚构数据代替。
