"use client";

import { FormEvent, useState } from "react";

export function AdminLoginForm() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setError("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/admin/session", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ identifier: form.get("identifier"), password: form.get("password"), remember: form.get("remember") === "on" }) });
    if (response.ok) window.location.assign("/admin");
    else { const body = await response.json().catch(() => ({})); setError(body.error || "登录失败，请稍后再试。"); setLoading(false); }
  }
  return <form onSubmit={login} className="admin-form" noValidate>
    <h1>GRIMM PUMP</h1><p>南美网站中文管理后台</p>
    <label>账号或邮箱<input name="identifier" type="text" required minLength={2} autoComplete="username" aria-describedby={error ? "login-error" : undefined} /></label>
    <label>密码<span className="password-field"><input name="password" type={showPassword ? "text" : "password"} required minLength={8} autoComplete="current-password" /><button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)}>{showPassword ? "隐藏" : "显示"}</button></span></label>
    <label className="remember"><input name="remember" type="checkbox" /> 30 天内保持登录</label>
    <button className="btn" disabled={loading}>{loading ? "正在验证…" : "登录后台"}</button>
    <a className="subtle-link" href="mailto:Cain@grimmfirepump.com?subject=GRIMM%20LATAM%20后台密码重置">忘记密码？请联系系统管理员</a>
    {error && <p id="login-error" className="form-error" role="alert">{error}</p>}
  </form>;
}
