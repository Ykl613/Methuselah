import { createClient } from "@/lib/supabase-server";
import { logAudit } from "@/lib/auth";
import { isUuid } from "@/lib/sanitize";
import { NextResponse } from "next/server";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  if (!isUuid(params.id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("user_profiles").select("*").eq("id", user.id).single();
  if (!profile || !profile.is_active) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data: task } = await supabase.from("tasks").select("*").eq("id", params.id).single();
  if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (task.status !== "open") return NextResponse.json({ error: "Task not available" }, { status: 400 });

  const { data: supplier } = await supabase.from("suppliers").select("company_name").eq("id", task.supplier_id).single();

  // Check sequential lock - previous stage must be completed
  const stageOrder = ["stage_1", "stage_2", "stage_3", "stage_4", "stage_5"];
  const idx = stageOrder.indexOf(task.stage);
  if (idx > 0) {
    const { data: prev } = await supabase.from("tasks").select("status").eq("supplier_id", task.supplier_id).eq("stage", stageOrder[idx - 1]).single();
    if (!prev || prev.status !== "completed") {
      return NextResponse.json({ error: "Previous stage not completed" }, { status: 400 });
    }
  }

  // Atomic claim: returns the row only if it was actually updated (status was 'open' until now).
  const { data: claimed, error } = await supabase.from("tasks").update({
    status: "in_progress", claimed_by: profile.id, claimed_at: new Date().toISOString(),
  }).eq("id", params.id).eq("status", "open").select().maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!claimed) return NextResponse.json({ error: "Task was claimed by someone else" }, { status: 409 });

  await logAudit({
    actorId: profile.id, actorLabel: profile.full_name,
    action: "task.claimed",
    entityType: "task", entityId: params.id,
    entityLabel: `${supplier?.company_name || "—"} · ${task.stage}`,
  });

  return NextResponse.json({ ok: true });
}
