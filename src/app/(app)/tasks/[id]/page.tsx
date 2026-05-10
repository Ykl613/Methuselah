import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase-server";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { NotificationBell } from "@/components/NotificationBell";
import { TaskDetailActions } from "./Actions";

export default async function TaskDetail({ params }: { params: { id: string } }) {
  const me = await requireAuth();
  const supabase = createClient();

  const { data: task } = await supabase.from("tasks").select("*").eq("id", params.id).maybeSingle();
  if (!task) notFound();

  const { data: supplier } = await supabase.from("suppliers").select("*").eq("id", task.supplier_id).single();
  task.supplier = supplier;

  // If admin, redirect to supplier page
  if (me.role === "admin") redirect(`/suppliers/${task.supplier.id}`);

  // Employee can only see if it's their task or it's open
  if (task.status !== "open" && task.claimed_by !== me.id) {
    redirect("/my-tasks");
  }

  const isMine = task.claimed_by === me.id;
  const stageLabels = ["Document Review", "Quality Assessment", "Management Approval", "Contract Signing", "System Onboarding"];
  const stageIdx = parseInt(task.stage.replace("stage_", ""), 10) - 1;

  return (
    <div>
      <div className="text-xs text-text-muted mb-2">
        <Link href={isMine ? "/my-tasks" : "/task-pool"} className="text-accent hover:underline">← {isMine ? "My Tasks" : "Task Pool"}</Link> / {task.supplier.company_name}
      </div>

      <div className="flex justify-between items-start gap-3 mb-5">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-text-primary mb-1">{task.supplier.company_name}</h1>
          <p className="text-xs text-text-muted">
            <span className="stage-tag">{task.stage.toUpperCase().replace("_", " ")}</span> {stageLabels[stageIdx]}
            {task.claimed_at && <> · Started {new Date(task.claimed_at).toLocaleString()}</>}
          </p>
        </div>
        <div className="flex gap-2 items-center">
          <NotificationBell userId={me.id} />
          <TaskDetailActions task={task} userId={me.id} />
        </div>
      </div>

      <div className="card mb-3">
        <div className="text-sm font-semibold mb-3 pb-2 border-b border-border flex items-center gap-2">
          <i className="ti ti-user text-accent" aria-hidden /> Supplier Information
        </div>
        <Row label="Contact" value={task.supplier.contact_name} />
        <Row label="Email" value={task.supplier.email} mono />
        <Row label="Phone" value={task.supplier.phone} mono />
        <Row label="Company" value={task.supplier.company_name} />
        <Row label="Country" value={task.supplier.country === "China" ? "🇨🇳 China" : task.supplier.country === "Israel" ? "🇮🇱 Israel" : "—"} />
        <Row label="Business No." value={task.supplier.business_number} mono />
        <Row label="Location" value={task.supplier.company_location} />
        <Row label="Factory" value={task.supplier.factory_address} />
        <Row label="Product" value={task.supplier.product_type} />
        <Row label="Capacity" value={task.supplier.production_quantity} />
      </div>

      <div className="card">
        <div className="text-sm font-semibold mb-3 pb-2 border-b border-border flex items-center gap-2">
          <i className="ti ti-clipboard text-accent" aria-hidden /> Task Status
        </div>
        <div className="text-xs">
          {task.status === "open" && <p className="text-text-secondary">This task is available to claim. Click the Claim button to start working on it.</p>}
          {task.status === "in_progress" && isMine && (
            <p className="text-text-secondary">You are working on this task. When complete, click <strong>Mark Complete</strong> to finish and unlock the next stage.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string | null; mono?: boolean }) {
  return (
    <div className="flex py-1 text-xs">
      <div className="w-28 text-text-muted">{label}</div>
      <div className={`flex-1 font-medium ${mono ? "font-mono text-[11px]" : ""}`}>{value || "—"}</div>
    </div>
  );
}
