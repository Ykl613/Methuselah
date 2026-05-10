import { createClient, createServiceClient } from "@/lib/supabase-server";
import { logAudit } from "@/lib/auth";
import { isEmail } from "@/lib/sanitize";
import { NextResponse } from "next/server";
import crypto from "crypto";

function generateSecurePassword(length = 20): string {
  // Mix of alphanumeric + special chars, cryptographically random
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*";
  const bytes = crypto.randomBytes(length);
  let result = "";
  for (let i = 0; i < length; i++) {
    result += alphabet[bytes[i] % alphabet.length];
  }
  // Ensure password contains at least one of each class for compatibility with auth providers
  if (!/[A-Z]/.test(result)) result = "A" + result.slice(1);
  if (!/[a-z]/.test(result)) result = result.slice(0, -1) + "a";
  if (!/[0-9]/.test(result)) result = result.slice(0, 1) + "5" + result.slice(2);
  if (!/[!@#$%&*]/.test(result)) result = result.slice(0, -1) + "!";
  return result;
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  const email = String(body.email || "").trim().toLowerCase();
  const full_name = String(body.full_name || "").trim();
  const role = String(body.role || "");

  if (!email || !isEmail(email)) return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  if (!full_name || full_name.length > 120) return NextResponse.json({ error: "Invalid name" }, { status: 400 });
  if (!["admin", "employee"].includes(role)) return NextResponse.json({ error: "Invalid role" }, { status: 400 });

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("user_profiles").select("*").eq("id", user.id).single();
  if (!profile || profile.role !== "admin") return NextResponse.json({ error: "Admin only" }, { status: 403 });

  const service = createServiceClient();
  const tempPassword = generateSecurePassword(20);

  const { data: created, error: createErr } = await service.auth.admin.createUser({
    email, password: tempPassword, email_confirm: true,
  });
  if (createErr) return NextResponse.json({ error: createErr.message }, { status: 500 });

  const { error: profileErr } = await service.from("user_profiles").insert({
    id: created.user.id, email, full_name, role, is_active: true,
  });
  if (profileErr) return NextResponse.json({ error: profileErr.message }, { status: 500 });

  await logAudit({
    actorId: profile.id, actorLabel: profile.full_name,
    action: "user.created",
    entityType: "user", entityId: created.user.id, entityLabel: full_name,
    metadata: { email, role },
  });

  return NextResponse.json({ ok: true, temp_password: tempPassword, email });
}
