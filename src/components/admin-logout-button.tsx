"use client";

export function AdminLogoutButton() {
  return <button className="logout" onClick={async () => { await fetch("/api/admin/session", { method: "DELETE" }); window.location.assign("/admin/login"); }}>退出登录</button>;
}
