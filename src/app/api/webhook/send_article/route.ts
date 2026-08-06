import { createHash, randomUUID, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getDatabase, writeAudit } from "@/lib/database";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const requestSchema = z.object({
  sign: z.string().min(24).max(512),
  class_id: z.string().trim().min(1).max(80).optional().default("blog"),
  title: z.string().trim().min(2).max(220),
  content: z.string().trim().min(10).max(80000),
  author_id: z.string().trim().max(160).optional().default(""),
  image_url: z.string().trim().url().max(2000).optional().default("").refine((value) => !value || new URL(value).protocol === "https:", "image_url must use HTTPS"),
});

function response(code: 0 | 1, msg: string, status = 200) {
  return NextResponse.json({ code, msg }, { status, headers: { "Cache-Control": "no-store" } });
}

function safeEqual(left: string, right: string) {
  const a = Buffer.from(left); const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

function slugFrom(title: string, fingerprint: string) {
  const normalized = title.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 130);
  return `${normalized || "blog"}-${fingerprint.slice(0, 10)}`;
}

function excerptFrom(content: string) {
  return content.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 280) || null;
}

async function readPayload(request: Request) {
  const contentType = request.headers.get("content-type") || "";
  if (contentType.includes("application/json")) return await request.json();
  if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) return Object.fromEntries((await request.formData()).entries());
  throw new Error("unsupported_content_type");
}

export async function POST(request: Request) {
  const configuredSecret = process.env.WEBHOOK_ARTICLE_SIGN;
  if (!configuredSecret) return response(0, "发布服务未配置", 503);
  try {
    const input = requestSchema.parse(await readPayload(request));
    if (!safeEqual(input.sign, configuredSecret)) return response(0, "秘钥错误", 401);
    const fingerprint = createHash("sha256").update(`${input.class_id}\u0000${input.title}\u0000${input.content}`).digest("hex");
    const db = await getDatabase();
    const duplicate = await db.execute({ sql: "SELECT id FROM news_articles WHERE external_fingerprint=? AND deleted_at IS NULL", args: [fingerprint] });
    if (duplicate.rows[0]) return response(1, "发布成功（重复请求已忽略）");
    const now = new Date().toISOString();
    const categorySlug = `blog-${input.class_id.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "blog"}`;
    const existingCategory = await db.execute({ sql: "SELECT id FROM news_categories WHERE slug=? AND deleted_at IS NULL", args: [categorySlug] });
    const categoryId = existingCategory.rows[0]?.id ? String(existingCategory.rows[0].id) : randomUUID();
    if (!existingCategory.rows[0]) await db.execute({ sql: "INSERT INTO news_categories (id,name,slug,sort_order,is_enabled,created_at,updated_at) VALUES (?,?,?,?,?,?,?)", args: [categoryId, input.class_id === "blog" ? "Blog" : `Blog · ${input.class_id}`, categorySlug, 0, 1, now, now] });
    const articleId = randomUUID();
    await db.execute({ sql: "INSERT INTO news_articles (id,category_id,status,is_featured,sort_order,published_at,external_fingerprint,external_author_id,cover_image_url,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)", args: [articleId, categoryId, "published", 0, 0, now, fingerprint, input.author_id || null, input.image_url || null, now, now] });
    await db.execute({ sql: "INSERT INTO news_translations (id,article_id,locale,title,slug,excerpt,content,seo_title,seo_description,canonical_url,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)", args: [randomUUID(), articleId, "es", input.title, slugFrom(input.title, fingerprint), excerptFrom(input.content), input.content, input.title, excerptFrom(input.content), null, now, now] });
    await writeAudit({ action: "webhook_article_published", entityType: "blog", entityId: articleId, details: { classId: input.class_id, authorProvided: Boolean(input.author_id), imageProvided: Boolean(input.image_url), fingerprint: fingerprint.slice(0, 12) } });
    return response(1, "发布成功");
  } catch (error) {
    const message = error instanceof z.ZodError ? "请求参数不符合要求" : error instanceof Error && error.message === "unsupported_content_type" ? "仅支持 application/x-www-form-urlencoded 或 application/json" : "发布失败，请稍后重试";
    return response(0, message, 400);
  }
}
