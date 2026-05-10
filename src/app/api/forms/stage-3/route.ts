import { createServiceClient } from "@/lib/supabase-server";
import { logAudit } from "@/lib/auth";
import { isEmail } from "@/lib/sanitize";
import { NextResponse } from "next/server";

const MAX = { email: 254, product: 300, quantity: 80 };

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  const email = String(body.email || "").trim().toLowerCase();
  const product_type = String(body.product_type || "").trim();
  const production_quantity = String(body.production_quantity || "").trim();

  if (!email || !isEmail(email) || email.length > MAX.email) return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  if (product_type.length > MAX.product) return NextResponse.json({ error: "Product description too long" }, { status: 400 });
  if (production_quantity.length > MAX.quantity) return NextResponse.json({ error: "Quantity too long" }, { status: 400 });

  const supabase = createServiceClient();
  const { data: supplier } = await supabase.from("suppliers").select("*").eq("email", email).maybeSingle();
  if (!supplier) return NextResponse.json({ error: "No matching application found" }, { status: 404 });
  if (supplier.status !== "in_progress") return NextResponse.json({ error: "Application closed" }, { status: 400 });
  // SECURITY: Only accept Stage 3 submission if supplier was actually advanced to form_3 by an admin
  if (supplier.current_stage !== "form_3") {
    return NextResponse.json({ error: "Stage 3 form not yet available for this email" }, { status: 400 });
  }

  const { error } = await supabase.from("suppliers").update({
    product_type, production_quantity, current_stage: "stage_1",
  }).eq("id", supplier.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAudit({
    actorId: null, actorLabel: "Public Form",
    action: "supplier.form3_submitted",
    entityType: "supplier", entityId: supplier.id, entityLabel: supplier.company_name,
    metadata: { tasks_created: 5 },
  });

  return NextResponse.json({ ok: true });
}
