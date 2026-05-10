import { createServiceClient } from "@/lib/supabase-server";
import { logAudit } from "@/lib/auth";
import { isEmail } from "@/lib/sanitize";
import { NextResponse } from "next/server";

const MAX = { email: 254, business: 80, location: 200, factory: 300 };

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  const email = String(body.email || "").trim().toLowerCase();
  const business_number = String(body.business_number || "").trim();
  const company_location = String(body.company_location || "").trim();
  const factory_address = String(body.factory_address || "").trim();

  if (!email || !isEmail(email) || email.length > MAX.email) return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  if (business_number.length > MAX.business) return NextResponse.json({ error: "Business number too long" }, { status: 400 });
  if (company_location.length > MAX.location) return NextResponse.json({ error: "Location too long" }, { status: 400 });
  if (factory_address.length > MAX.factory) return NextResponse.json({ error: "Factory address too long" }, { status: 400 });

  const supabase = createServiceClient();
  const { data: supplier } = await supabase.from("suppliers").select("*").eq("email", email).maybeSingle();
  if (!supplier) return NextResponse.json({ error: "No matching application found" }, { status: 404 });
  if (supplier.status !== "in_progress") return NextResponse.json({ error: "Application closed" }, { status: 400 });
  // SECURITY: Only accept Stage 2 submission if supplier was actually advanced to form_2 by an admin
  if (supplier.current_stage !== "form_2") {
    return NextResponse.json({ error: "Stage 2 form not yet available for this email" }, { status: 400 });
  }

  const country = (company_location || "").toLowerCase().includes("china") ? "China"
    : (company_location || "").toLowerCase().includes("israel") ? "Israel" : null;

  const { error } = await supabase.from("suppliers").update({
    business_number, company_location, factory_address, country,
    current_stage: "form_3",
  }).eq("id", supplier.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAudit({
    actorId: null, actorLabel: "Public Form",
    action: "supplier.form2_submitted",
    entityType: "supplier", entityId: supplier.id, entityLabel: supplier.company_name,
  });

  return NextResponse.json({ ok: true });
}
