import { createClient } from "@/lib/supabase-server";
import { logAudit } from "@/lib/auth";
import { isUuid } from "@/lib/sanitize";
import { NextResponse } from "next/server";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  if (!isUuid(params.id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("user_profiles").select("*").eq("id", user.id).single();
  if (!profile || profile.role !== "admin" || !profile.is_active) return NextResponse.json({ error: "Admin only" }, { status: 403 });

  if (params.id === profile.id) return NextResponse.json({ error: "Cannot modify yourself" }, { status: 400 });

  const update: Record<string, any> = {};
  if (typeof body.is_active === "boolean") update.is_active = body.is_active;
  if (typeof body.role === "string" && ["admin", "employee"].includes(body.role)) update.role = body.role;
  if (typeof body.full_name === "string") {
    const fn = body.full_name.trim().slice(0, 120);
    if (fn) update.full_name = fn;
  }
  if (Object.keys(update).length === 0) return NextResponse.json({ error: "No valid fields" }, { status: 400 });

  const { error } = await supabase.from("user_profiles").update(update).eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAudit({
    actorId: profile.id, actorLabel: profile.full_name,
    action: "user.updated",
    entityType: "user", entityId: params.id,
    metadata: update,
  });

  return NextResponse.json({ ok: true });
}
