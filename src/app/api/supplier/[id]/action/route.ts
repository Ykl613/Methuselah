import { createClient } from "@/lib/supabase-server";
import { logAudit } from "@/lib/auth";
import { isUuid } from "@/lib/sanitize";
import { NextResponse } from "next/server";

const MAX_REASON = 500;

export async function POST(req: Request, { params }: { params: { id: string } }) {
  if (!isUuid(params.id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  const action = String(body.action || "");
  const reason = body.reason ? String(body.reason).trim().slice(0, MAX_REASON) : "";

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("user_profiles").select("*").eq("id", user.id).single();
  if (!profile || profile.role !== "admin" || !profile.is_active) return NextResponse.json({ error: "Admin only" }, { status: 403 });

  const { data: supplier } = await supabase.from("suppliers").select("*").eq("id", params.id).single();
  if (!supplier) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (action === "send_stage_2") {
    // Only valid when supplier just submitted Form 1
    if (supplier.current_stage !== "form_2" && supplier.current_stage !== "form_1") {
      return NextResponse.json({ error: `Cannot send Stage 2 link from stage ${supplier.current_stage}` }, { status: 400 });
    }
    if (supplier.status !== "in_progress") return NextResponse.json({ error: "Supplier not in progress" }, { status: 400 });
    await supabase.from("suppliers").update({ current_stage: "form_2" }).eq("id", params.id).eq("status", "in_progress");
    await logAudit({
      actorId: profile.id, actorLabel: profile.full_name,
      action: "supplier.send_stage_2_link",
      entityType: "supplier", entityId: params.id, entityLabel: supplier.company_name,
    });
    return NextResponse.json({ ok: true });
  }

  if (action === "send_stage_3") {
    if (supplier.current_stage !== "form_3" && supplier.current_stage !== "form_2") {
      return NextResponse.json({ error: `Cannot send Stage 3 link from stage ${supplier.current_stage}` }, { status: 400 });
    }
    if (supplier.status !== "in_progress") return NextResponse.json({ error: "Supplier not in progress" }, { status: 400 });
    await supabase.from("suppliers").update({ current_stage: "form_3" }).eq("id", params.id).eq("status", "in_progress");
    await logAudit({
      actorId: profile.id, actorLabel: profile.full_name,
      action: "supplier.send_stage_3_link",
      entityType: "supplier", entityId: params.id, entityLabel: supplier.company_name,
    });
    return NextResponse.json({ ok: true });
  }

  if (action === "reject") {
    if (!reason) return NextResponse.json({ error: "Reason required" }, { status: 400 });
    if (supplier.status !== "in_progress") {
      return NextResponse.json({ error: `Cannot reject supplier with status ${supplier.status}` }, { status: 400 });
    }
    // Atomic update: only flip if still in_progress (race-safe)
    const { data: updated, error: updateErr } = await supabase.from("suppliers").update({
      status: "not_approved", rejected_at: new Date().toISOString(),
      rejected_by: profile.id, rejection_reason: reason,
    }).eq("id", params.id).eq("status", "in_progress").select().single();
    if (updateErr || !updated) return NextResponse.json({ error: "Supplier state changed; reload and try again" }, { status: 409 });

    // Cancel any in-flight tasks (mark as completed only if the stage 5 trigger won't fire)
    await supabase.from("tasks").update({ status: "completed", completed_by: profile.id, completed_at: new Date().toISOString() })
      .eq("supplier_id", params.id).in("status", ["open", "in_progress"]).neq("stage", "stage_5");

    await logAudit({
      actorId: profile.id, actorLabel: profile.full_name,
      action: "supplier.rejected",
      entityType: "supplier", entityId: params.id, entityLabel: supplier.company_name,
      metadata: { reason },
    });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
