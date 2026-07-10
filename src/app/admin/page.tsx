import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminFrame } from "@/components/admin-frame";
import { getAdminSession } from "@/lib/auth";
import { getDatabase } from "@/lib/database";

type DashboardData = { counts: number[]; latestLeads: Record<string, unknown>[]; latestSync: Record<string, unknown>[] };
async function dashboardData(): Promise<DashboardData> {
  const db = await getDatabase();
  const [leads, products, news, users, latestLeads, latestSync] = await Promise.all([
    db.execute("SELECT COUNT(*) AS total FROM leads WHERE deleted_at IS NULL"), db.execute("SELECT COUNT(*) AS total FROM products WHERE deleted_at IS NULL"), db.execute("SELECT COUNT(*) AS total FROM news_articles WHERE deleted_at IS NULL"), db.execute("SELECT COUNT(*) AS total FROM users WHERE status='active'"), db.execute("SELECT id,name,company,email,country,status,created_at FROM leads WHERE deleted_at IS NULL ORDER BY created_at DESC LIMIT 6"), db.execute("SELECT source,status,started_at,finished_at,records_processed,error_message FROM sync_runs ORDER BY started_at DESC LIMIT 5"),
  ]);
  return { counts: [leads, products, news, users].map((result) => Number(result.rows[0]?.total || 0)), latestLeads: latestLeads.rows, latestSync: latestSync.rows };
}

function DatabaseUnavailable() { return <><header className="admin-page-header"><div><p>数据库连接异常</p><h1>数据概览</h1></div></header><div className="admin-error"><h2>后台数据库尚未就绪</h2><p>请在生产环境配置可持久化的 LibSQL/Turso 数据库地址和访问令牌。系统不会使用 Vercel 临时文件系统保存业务数据。</p></div></>; }
function Dashboard({ data }: { data: DashboardData }) { return <><header className="admin-page-header"><div><p>运营总览 · 数据实时来自业务数据库</p><h1>数据概览</h1></div><Link className="btn btn-small" href="/admin/leads">查看客户表单</Link></header><div className="stat-row"><article><span>有效表单</span><b>{data.counts[0]}</b><small>全部未删除询盘</small></article><article><span>产品内容</span><b>{data.counts[1]}</b><small>含草稿与已发布内容</small></article><article><span>新闻内容</span><b>{data.counts[2]}</b><small>含草稿与已发布内容</small></article><article><span>启用账号</span><b>{data.counts[3]}</b><small>具备后台登录资格</small></article></div><div className="admin-grid"><section className="admin-panel"><div className="table-title"><h2>最近表单</h2><Link href="/admin/leads">全部查看</Link></div><table><thead><tr><th>联系人</th><th>公司 / 国家</th><th>状态</th><th>提交时间</th></tr></thead><tbody>{data.latestLeads.length ? data.latestLeads.map((row) => <tr key={String(row.id)}><td><b>{String(row.name)}</b><small>{String(row.email)}</small></td><td>{String(row.company)}<small>{String(row.country)}</small></td><td><em>{String(row.status)}</em></td><td>{new Date(String(row.created_at)).toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" })}</td></tr>) : <tr><td colSpan={4} className="empty-cell">暂无客户表单</td></tr>}</tbody></table></section><section className="admin-panel"><div className="table-title"><h2>同步状态</h2><Link href="/admin/sync">同步中心</Link></div>{data.latestSync.length ? <table><thead><tr><th>数据源</th><th>状态</th><th>处理数量</th><th>开始时间</th></tr></thead><tbody>{data.latestSync.map((row, index) => <tr key={index}><td>{String(row.source)}</td><td><em>{String(row.status)}</em></td><td>{String(row.records_processed)}</td><td>{new Date(String(row.started_at)).toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" })}</td></tr>)}</tbody></table> : <div className="empty-state"><b>尚无同步记录</b><p>Google Search Console 凭据已部署；配置持久化数据库与属性地址后即可执行并记录同步。</p></div>}</section></div></>; }

export default async function AdminPage() {
  const session = await getAdminSession(); if (!session) redirect("/admin/login");
  const result = await dashboardData().then((data) => ({ data, failed: false as const }), () => ({ data: null, failed: true as const }));
  return <AdminFrame session={session}>{result.failed || !result.data ? <DatabaseUnavailable /> : <Dashboard data={result.data} />}</AdminFrame>;
}
