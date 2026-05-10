import { createServiceClient } from "@/lib/supabase-server";
import { generateReferenceCode, logAudit } from "@/lib/auth";
import { isEmail } from "@/lib/sanitize";
import { NextResponse } from "next/server";

const MAX_LEN = { name: 120, email: 254, phone: 32, company: 200 };

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  const contact_name = String(body.contact_name || "").trim();
  const email = String(body.email || "").trim().toLowerCase();
  const phone = String(body.phone || "").trim();
  const company_name = String(body.company_name || "").trim();

  if (!contact_name || !email || !phone || !company_name) {
    return NextResponse.json({ error: "All fields required" }, { status: 400 });
  }
  if (contact_name.length > MAX_LEN.name) return NextResponse.json({ error: "Name too long" }, { status: 400 });
  if (email.length > MAX_LEN.email || !isEmail(email)) return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  if (phone.length > MAX_LEN.phone) return NextResponse.json({ error: "Phone too long" }, { status: 400 });
  if (company_name.length > MAX_LEN.company) return NextResponse.json({ error: "Company name too long" }, { status: 400 });

  const supabase = createServiceClient();

  const { data: existing } = await supabase.from("suppliers").select("id, status").eq("email", email).maybeSingle();
  if (existing) return NextResponse.json({ error: "Email already registered", code: "EMAIL_EXISTS" }, { status: 409 });

  const { data: supplier, error } = await supabase.from("suppliers").insert({
    reference_code: generateReferenceCode(company_name),
    email, contact_name, phone, company_name,
    current_stage: "form_2",
  }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAudit({
    actorId: null, actorLabel: "Public Form",
    action: "supplier.form1_submitted",
    entityType: "supplier", entityId: supplier.id, entityLabel: company_name,
  });

  const { data: admins } = await supabase.from("user_profiles").select("id").eq("role", "admin").eq("is_active", true);
  if (admins) {
    await supabase.from("notifications").insert(admins.map((a: any) => ({
      user_id: a.id, type: "supplier.new",
      title: "New supplier registration", body: `${company_name} (${contact_name})`,
      link: `/suppliers/${supplier.id}`,
    })));
  }

  return NextResponse.json({ ok: true });
}
