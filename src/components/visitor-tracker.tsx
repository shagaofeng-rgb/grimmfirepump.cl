"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const VISITOR_COOKIE = "grimm_visitor";
const SESSION_KEY = "grimm_visit_session";

function getCookie(name: string) { return document.cookie.split("; ").find((value) => value.startsWith(`${name}=`))?.split("=")[1] || ""; }
export function getVisitorContext() { return { visitorId: getCookie(VISITOR_COOKIE), sessionId: sessionStorage.getItem(SESSION_KEY) || "" }; }

export function VisitorTracker() {
  const pathname = usePathname();
  useEffect(() => {
    if (location.pathname.startsWith("/admin") || location.pathname.startsWith("/api")) return;
    let visitorId = getCookie(VISITOR_COOKIE);
    if (!visitorId) { visitorId = crypto.randomUUID(); document.cookie = `${VISITOR_COOKIE}=${visitorId}; Path=/; Max-Age=15552000; SameSite=Lax; Secure`; }
    let sessionId = sessionStorage.getItem(SESSION_KEY);
    if (!sessionId) { sessionId = crypto.randomUUID(); sessionStorage.setItem(SESSION_KEY, sessionId); }
    const referrer = document.referrer ? new URL(document.referrer) : null;
    const current = new URL(location.href);
    const payload = { visitorId, sessionId, path: location.pathname, title: document.title, referrerPath: referrer?.origin === location.origin ? referrer.pathname : undefined, referrerHost: referrer?.origin !== location.origin ? referrer?.host : undefined, locale: document.documentElement.lang, deviceType: innerWidth < 768 ? "mobile" : innerWidth < 1024 ? "tablet" : "desktop", utmSource: current.searchParams.get("utm_source") || undefined, utmMedium: current.searchParams.get("utm_medium") || undefined, utmCampaign: current.searchParams.get("utm_campaign") || undefined };
    void fetch("/api/analytics/track", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload), keepalive: true });
  }, [pathname]);
  return null;
}
