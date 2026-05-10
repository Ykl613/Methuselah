import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase-server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { NotificationBell } from "@/components/NotificationBell";
import { StatusBadge } from "@/components/StatusBadge";
import { SupplierActions } from "./Actions";
import { EvaluationForm } from "./EvaluationForm";
import { NotesPanel } from "./NotesPanel";
import { StagesPanel } from "./StagesPanel";

export default async function SupplierDetail({ params }: { params: { id: string } }) {
  const user = await requireAdmin();
  const supabase = createClient();

  const { data: supplier } = await supabase.from("suppliers").select("*").eq("id", params.id).maybeSingle();
  if (!supplier) notFound();

  const { data: tasksRaw } = await supabase.from("tasks").select("*").eq("supplier_id", supplier.id).order("stage");

  // Fetch user names for tasks
  const userIds = Array.from(new Set([
    ...(tasksRaw || []).map((t: any) => t.claimed_by).filter(Boolean),
    ...(tasksRaw || []).map((t: any) => t.completed_by).filter(Boolean),
  ]));
  let usersMap: Record<string, string> = {};
  if (userIds.length > 0) {
    const { data: usersData } = await supabase.from("user_profiles").select("id, full_name").in("id", userIds);
    (usersData || []).forEach((u: any) => { usersMap[u.id] = u.full_name; });
  }
  const tasks = (tasksRaw || []).map((t: any) => ({
    ...t,
    claimed_by_user: t.claimed_by ? { full_name: usersMap[t.claimed_by] } : null,
    completed_by_user: t.completed_by ? { full_name: usersMap[t.completed_by] } : null,
  }));

  const { data: settings } = await supabase.from("settings").select("*").single();

  const { data: notesRaw } = await supabase.from("supplier_notes").select("*").eq("supplier_id", supplier.id).order("created_at", { ascending: false });
  const noteAuthorIds = Array.from(new Set((notesRaw || []).map((n: any) => n.author_id)));
  let authorsMap: Record<string, string> = {};
  if (noteAuthorIds.length > 0) {
    const { data: authData } = await supabase.from("user_profiles").select("id, full_name").in("id", noteAuthorIds);
    (authData || []).forEach((u: any) => { authorsMap[u.id] = u.full_name; });
  }
  const notes = (notesRaw || []).map((n: any) => ({ ...n, author: { full_name: authorsMap[n.author_id] || "—" } }));

  const { data: timeline } = await supabase.from("audit_log").select("*").eq("entity_type", "supplier").eq("entity_id", supplier.id).order("created_at").limit(50);

  return (
    <div>
      <div className="text-xs text-text-muted mb-2">
        <Link href="/suppliers" className="text-accent hover:underline">← Suppliers</Link> / {supplier.company_name}
      </div>

      <div className="flex justify-between items-start gap-3 mb-5">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-text-primary mb-1">{supplier.company_name || supplier.reference_code}</h1>
          <p className="text-xs text-text-muted flex items-center gap-2">
            <span className="font-mono">{supplier.reference_code}</span> · {supplier.country === "China" ? "🇨🇳 China" : supplier.country === "Israel" ? "🇮🇱 Israel" : "—"} · <StatusBadge status={supplier.status} />
          </p>
        </div>
        <div className="flex gap-2 items-center">
          <NotificationBell userId={user.id} />
          <SupplierActions supplier={supplier} />
        </div>
      </div>

      <StagesPanel supplier={supplier} tasks={tasks || []} settings={settings} userId={user.id} userRole={user.role} />

      <div className="grid grid-cols-[1.5fr_1fr] gap-3.5 mt-3.5">
        <div>
          <div className="card mb-3">
            <div className="text-sm font-semibold mb-3 pb-2 border-b border-border flex items-center gap-2">
              <i className="ti ti-history text-accent" aria-hidden /> Timeline
            </div>
            <div className="relative pl-6">
              <div className="absolute left-[7px] top-1.5 bottom-1.5 w-px bg-border" />
              {(timeline || []).length === 0 && <div className="text-xs text-text-muted">No events yet</div>}
              {(timeline || []).map((e: any) => (
                <div key={e.id} className="relative pb-3.5 last:pb-0">
                  <div className="absolute -left-6 top-0.5 w-4 h-4 rounded-full bg-green-soft border-2 border-white flex items-center justify-center">
                    <i className="ti ti-check text-[9px] text-green-text" aria-hidden />
                  </div>
                  <div className="text-xs font-medium text-text-primary">{e.action.replace(/\./g, " ").replace(/_/g, " ")}</div>
                  <div className="text-[11px] text-text-muted mt-0.5">
                    {new Date(e.created_at).toLocaleString()} · by {e.actor_label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="text-sm font-semibold mb-3 pb-2 border-b border-border flex items-center gap-2">
              <i className="ti ti-user text-accent" aria-hidden /> Contact & Business
            </div>
            <Row label="Contact" value={supplier.contact_name} />
            <Row label="Email" value={supplier.email} mono />
            <Row label="Phone" value={supplier.phone} mono />
            <Row label="Business No." value={supplier.business_number} mono />
            <Row label="Location" value={supplier.company_location} />
            <Row label="Factory" value={supplier.factory_address} />
            <Row label="Product" value={supplier.product_type} />
            <Row label="Capacity" value={supplier.production_quantity} />
          </div>
        </div>

        <div>
          <EvaluationForm supplier={supplier} settings={settings} />
          <NotesPanel supplierId={supplier.id} notes={notes || []} />
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
