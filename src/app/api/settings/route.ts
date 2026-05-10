import { createClient } from "@/lib/supabase-server";
import { logAudit } from "@/lib/auth";
import { NextResponse } from "next/server";

const MAX_LEN = 80;

export async function PATCH(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("user_profiles").select("*").eq("id", user.id).single();
  if (!profile || profile.role !== "admin" || !profile.is_active) return NextResponse.json({ error: "Admin only" }, { status: 403 });

  const allowed = [
    "evaluation_field_1", "evaluation_field_2", "evaluation_field_3", "evaluation_field_4",
    "stage_1_name", "stage_2_name", "stage_3_name", "stage_4_name", "stage_5_name",
  ];
  const update: Record<string, any> = {};
  for (const k of allowed) {
    if (typeof body[k] === "string") {
      const v = body[k].trim().slice(0, MAX_LEN);
      if (v) update[k] = v;
    }
  }
  if (Object.keys(update).length === 0) return NextResponse.json({ error: "No valid fields" }, { status: 400 });

  const { error } = await supabase.from("settings").update(update).eq("id", 1);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAudit({
    actorId: profile.id, actorLabel: profile.full_name,
    action: "settings.updated",
    entityType: "settings",
    metadata: update,
  });

  return NextResponse.json({ ok: true });
}
