import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminLogoutButton } from "@/components/admin-logout-button";
import { getAdminSession } from "@/lib/auth";
import { getDatabase } from "@/lib/database";

export default async function AdminPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  const db = await getDatabase();
  const result = await db.execute("SELECT id,name,company,email,country,product_interest,status,created_at FROM leads ORDER BY created_at DESC LIMIT 50");
  return <main className="admin-shell"><aside><b>GRIMM PUMP</b><small>{"\u5357\u7f8e\u7f51\u7ad9\u7ba1\u7406\u540e\u53f0"}</small><nav><Link href="/admin">{"\u6570\u636e\u6982\u89c8"}</Link><Link href="/es/products">{"\u4ea7\u54c1\u4e2d\u5fc3"}</Link><Link href="/es">{"\u67e5\u770b\u524d\u53f0"}</Link></nav></aside><section><header><div><p>{"\u5df2\u767b\u5f55\uff1a"}{String(session.email)}</p><h1>{"\u8be2\u76d8\u7ba1\u7406"}</h1></div><AdminLogoutButton/></header><div className="stat-row"><article><span>{"\u6700\u65b0\u8be2\u76d8"}</span><b>{result.rows.length}</b><small>{"\u5f53\u524d\u6570\u636e\u5e93\u6700\u8fd1 50 \u6761"}</small></article><article><span>{"\u6570\u636e\u72b6\u6001"}</span><b>{"\u6b63\u5e38"}</b><small>{"\u672c\u5730\u6570\u636e\u5e93\u5df2\u8fde\u63a5"}</small></article><article><span>{"\u5185\u5bb9\u8bed\u8a00"}</span><b>ES / PT / EN</b><small>{"\u524d\u53f0 URL \u72ec\u7acb"}</small></article></div><div className="admin-table"><div className="table-title"><h2>{"\u5ba2\u6237\u8be2\u76d8"}</h2><span>{"\u670d\u52a1\u7aef\u8bfb\u53d6\u00b7\u9ed8\u8ba4\u6309\u521b\u5efa\u65f6\u95f4\u6392\u5e8f"}</span></div><table><thead><tr><th>{"\u8054\u7cfb\u4eba"}</th><th>{"\u516c\u53f8"}</th><th>{"\u56fd\u5bb6"}</th><th>{"\u4ea7\u54c1\u5174\u8da3"}</th><th>{"\u72b6\u6001"}</th><th>{"\u63d0\u4ea4\u65f6\u95f4"}</th></tr></thead><tbody>{result.rows.map((row) => <tr key={String(row.id)}><td><b>{String(row.name)}</b><small>{String(row.email)}</small></td><td>{String(row.company)}</td><td>{String(row.country)}</td><td>{String(row.product_interest || "-")}</td><td><em>{String(row.status)}</em></td><td>{new Date(String(row.created_at)).toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" })}</td></tr>)}</tbody></table></div></section></main>;
}
