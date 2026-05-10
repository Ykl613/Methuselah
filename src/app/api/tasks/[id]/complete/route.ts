import { createClient, createServiceClient } from "@/lib/supabase-server";
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
  if (task.status === "completed") return NextResponse.json({ error: "Already completed" }, { status: 400 });
  if (profile.role !== "admin" && task.claimed_by !== profile.id) {
    return NextResponse.json({ error: "Not your task" }, { status: 403 });
  }

  const { data: supplier } = await supabase.from("suppliers").select("company_name").eq("id", task.supplier_id).single();

  const { data: completed, error } = await supabase.from("tasks").update({
    status: "completed", completed_by: profile.id, completed_at: new Date().toISOString(),
  }).eq("id", params.id).neq("status", "completed").select().maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!completed) return NextResponse.json({ error: "Task already completed or state changed" }, { status: 409 });

  await logAudit({
    actorId: profile.id, actorLabel: profile.full_name,
    action: "task.completed",
    entityType: "task", entityId: params.id,
    entityLabel: `${supplier?.company_name || "—"} · ${task.stage}`,
  });

  // Notify admins on stage 5 completion (auto-approval). Use service-role to bypass RLS
  // since notifications table allows only the system (no INSERT policy for users).
  if (task.stage === "stage_5") {
    const service = createServiceClient();
    const { data: admins } = await service.from("user_profiles").select("id").eq("role", "admin").eq("is_active", true);
    if (admins) {
      await service.from("notifications").insert(admins.map((a: any) => ({
        user_id: a.id, type: "supplier.approved",
        title: "Supplier approved",
        body: `${supplier?.company_name || "Supplier"} completed all stages`,
        link: `/suppliers/${task.supplier_id}`,
      })));
    }
  }

  return NextResponse.json({ ok: true });
}
