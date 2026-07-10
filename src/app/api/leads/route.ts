import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getDatabase } from "@/lib/database";

const leadSchema = z.object({
  name: z.string().trim().min(2).max(120), company: z.string().trim().min(2).max(160),
  email: z.string().trim().email().max(160), country: z.string().trim().min(2).max(100),
  productInterest: z.string().trim().max(120).optional(), flow: z.string().trim().max(80).optional(),
  pressure: z.string().trim().max(80).optional(), message: z.string().trim().min(10).max(3000),
  locale: z.enum(["es", "pt", "en"]).default("es"), sourcePath: z.string().trim().max(200).default("/es"),
  website: z.string().max(0).optional(),
});

export async function POST(request: Request) {
  const requestId = randomUUID();
  try {
    const parsed = leadSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ success: false, error: "Datos de solicitud no válidos.", requestId, fields: parsed.error.flatten().fieldErrors }, { status: 400 });
    const lead = parsed.data;
    const db = await getDatabase(); const id = randomUUID(); const now = new Date().toISOString();
    await db.execute({ sql: "INSERT INTO leads (id,name,company,email,country,product_interest,flow,pressure,message,locale,source_path,status,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)", args: [id, lead.name, lead.company, lead.email, lead.country, lead.productInterest || null, lead.flow || null, lead.pressure || null, lead.message, lead.locale, lead.sourcePath, "new", now] });
    await db.execute({ sql: "INSERT INTO audit_logs (id,action,entity_type,entity_id,details,created_at) VALUES (?,?,?,?,?,?)", args: [randomUUID(), "lead_created", "lead", id, JSON.stringify({ sourcePath: lead.sourcePath }), now] });
    return NextResponse.json({ success: true, data: { id }, requestId }, { status: 201 });
  } catch { return NextResponse.json({ success: false, error: "No se pudo guardar la solicitud. Inténtelo de nuevo.", requestId }, { status: 500 }); }
}
