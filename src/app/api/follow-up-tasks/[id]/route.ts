import { createClient } from "@/lib/supabase-server";
import { logAudit } from "@/lib/auth";
import { isUuid } from "@/lib/sanitize";
import { NextResponse } from "next/server";

// Mark task as completed
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  if (!isUuid(params.id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("user_profiles").select("*").eq("id", user.id).single();
  if (!profile || profile.role !== "admin" || !profile.is_active) {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  // Get existing task
  const { data: existing } = await supabase.from("supplier_follow_up_tasks").select("*").eq("id", params.id).maybeSingle();
  if (!existing) return NextResponse.json({ error: "Task not found" }, { status: 404 });
  if (existing.status === "completed") return NextResponse.json({ error: "Task already completed" }, { status: 400 });

  const { error } = await supabase.from("supplier_follow_up_tasks").update({
    status: "completed",
    completed_by: profile.id,
    completed_at: new Date().toISOString(),
  }).eq("id", params.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAudit({
    actorId: profile.id,
    actorLabel: profile.full_name,
    action: "follow_up.completed",
    entityType: "supplier",
    entityId: existing.supplier_id,
    entityLabel: existing.title,
  });

  return NextResponse.json({ ok: true });
}

// Delete task
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  if (!isUuid(params.id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("user_profiles").select("*").eq("id", user.id).single();
  if (!profile || profile.role !== "admin" || !profile.is_active) {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const { data: existing } = await supabase.from("supplier_follow_up_tasks").select("supplier_id, title").eq("id", params.id).maybeSingle();
  if (!existing) return NextResponse.json({ error: "Task not found" }, { status: 404 });

  const { error } = await supabase.from("supplier_follow_up_tasks").delete().eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAudit({
    actorId: profile.id,
    actorLabel: profile.full_name,
    action: "follow_up.deleted",
    entityType: "supplier",
    entityId: existing.supplier_id,
    entityLabel: existing.title,
  });

  return NextResponse.json({ ok: true });
}
