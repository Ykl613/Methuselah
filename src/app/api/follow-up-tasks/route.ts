import { createClient } from "@/lib/supabase-server";
import { logAudit } from "@/lib/auth";
import { isUuid } from "@/lib/sanitize";
import { NextResponse } from "next/server";

const MAX_TITLE_LENGTH = 200;

export async function POST(req: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("user_profiles").select("*").eq("id", user.id).single();
  if (!profile || profile.role !== "admin" || !profile.is_active) {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const supplierId = String(body.supplier_id || "").trim();
  const title = String(body.title || "").trim();

  if (!isUuid(supplierId)) return NextResponse.json({ error: "Invalid supplier id" }, { status: 400 });
  if (!title || title.length > MAX_TITLE_LENGTH) {
    return NextResponse.json({ error: "Title required (max 200 chars)" }, { status: 400 });
  }

  // Verify supplier exists
  const { data: supplier } = await supabase.from("suppliers").select("id, company_name, reference_code").eq("id", supplierId).maybeSingle();
  if (!supplier) return NextResponse.json({ error: "Supplier not found" }, { status: 404 });

  const { data, error } = await supabase.from("supplier_follow_up_tasks").insert({
    supplier_id: supplierId,
    title,
    status: "open",
    created_by: profile.id,
    created_by_label: profile.full_name,
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAudit({
    actorId: profile.id,
    actorLabel: profile.full_name,
    action: "follow_up.created",
    entityType: "supplier",
    entityId: supplierId,
    entityLabel: supplier.company_name || supplier.reference_code,
    metadata: { title },
  });

  return NextResponse.json({ ok: true, task: data });
}
