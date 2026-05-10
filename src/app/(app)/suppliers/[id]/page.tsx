import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase-server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { NotificationBell } from "@/components/NotificationBell";
import { StatusBadge } from "@/components/StatusBadge";
import { DeleteSupplierButton } from "@/components/DeleteSupplierButton";
import { HeaderActions } from "@/components/HeaderActions";
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

  return (
    <div>
      <div className="text-xs text-text-muted mb-2">
        <Link href={supplier.status === "approved" ? "/suppliers" : "/in-progress"} className="text-accent hover:underline">
          ← {supplier.status === "approved" ? "Suppliers" : "In Progress"}
        </Link> / {supplier.company_name || supplier.reference_code}
      </div>

      <div className="flex justify-between items-start gap-3 mb-5">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-text-primary mb-1">
            {supplier.company_name || supplier.contact_name || supplier.reference_code}
          </h1>
          <p className="text-xs text-text-muted flex items-center gap-2 flex-wrap">
            <span className="font-mono">{supplier.reference_code}</span>
            <span className="text-text-subtle">·</span>
            <span>{supplier.country === "China" ? "🇨🇳 China" : supplier.country === "Israel" ? "🇮🇱 Israel" : "—"}</span>
            <span className="text-text-subtle">·</span>
            <StatusBadge status={supplier.status} />
            {supplier.status === "approved" && supplier.approved_at && (
              <>
                <span className="text-text-subtle">·</span>
                <span className="flex items-center gap-1">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-icon" aria-hidden>
                    <path d="M4 7a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2v-12z" />
                    <path d="M16 3v4" />
                    <path d="M8 3v4" />
                    <path d="M4 11h16" />
                    <path d="M11 15h1" />
                    <path d="M12 15v3" />
                  </svg>
                  Approved on {new Date(supplier.approved_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                </span>
              </>
            )}
            {supplier.status === "not_approved" && supplier.rejected_at && (
              <>
                <span className="text-text-subtle">·</span>
                <span className="flex items-center gap-1 text-red-text">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M18 6l-12 12" />
                    <path d="M6 6l12 12" />
                  </svg>
                  Rejected on {new Date(supplier.rejected_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                </span>
              </>
            )}
          </p>
        </div>
        <div className="flex gap-2 items-center">
          <SupplierActions supplier={supplier} />
          <DeleteSupplierButton
            supplierId={supplier.id}
            supplierName={supplier.company_name || supplier.reference_code}
            variant="button"
            redirectTo={supplier.status === "approved" ? "/suppliers" : "/in-progress"}
          />
          <div className="ml-2 pl-2 border-l border-border">
            <HeaderActions userId={user.id} />
          </div>
        </div>
      </div>

      <StagesPanel supplier={supplier} tasks={tasks || []} settings={settings} userId={user.id} userRole={user.role} />

      <div className="grid grid-cols-[1.5fr_1fr] gap-3.5 mt-3.5">
        <div>
          {/* Stage 1 Form - Initial Contact */}
          <div className="card mb-3">
            <div className="text-sm font-semibold mb-3 pb-2 border-b border-border flex items-center justify-between gap-2">
              <span className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-accent-soft text-accent text-[10px] font-bold flex items-center justify-center">1</span>
                Initial Contact
              </span>
              <span className="text-[10px] uppercase tracking-wider text-text-muted font-medium">Stage 1</span>
            </div>
            <Row label="Contact" value={supplier.contact_name} />
            <Row label="Email" value={supplier.email} mono />
            <Row label="Phone" value={supplier.phone} mono />
            <Row label="Company" value={supplier.company_name} />
          </div>

          {/* Stage 2 Form - Company Details */}
          {(supplier.business_number || supplier.company_location || supplier.factory_address) && (
            <div className="card mb-3">
              <div className="text-sm font-semibold mb-3 pb-2 border-b border-border flex items-center justify-between gap-2">
                <span className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-amber-soft text-amber-text text-[10px] font-bold flex items-center justify-center">2</span>
                  Company Details
                </span>
                <span className="text-[10px] uppercase tracking-wider text-text-muted font-medium">Stage 2</span>
              </div>
              <Row label="Business No." value={supplier.business_number} mono />
              <Row label="Location" value={supplier.company_location} />
              <Row label="Factory" value={supplier.factory_address} />
            </div>
          )}

          {/* Stage 3 Form - Production */}
          {(supplier.product_type || supplier.production_quantity) && (
            <div className="card mb-3">
              <div className="text-sm font-semibold mb-3 pb-2 border-b border-border flex items-center justify-between gap-2">
                <span className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-green-soft text-green-text text-[10px] font-bold flex items-center justify-center">3</span>
                  Production
                </span>
                <span className="text-[10px] uppercase tracking-wider text-text-muted font-medium">Stage 3</span>
              </div>
              <Row label="Product" value={supplier.product_type} />
              <Row label="Capacity" value={supplier.production_quantity} />
            </div>
          )}

          {/* Hint if some forms not submitted yet */}
          {!supplier.business_number && !supplier.company_location && !supplier.factory_address && (
            <div className="text-[12px] text-text-muted bg-bg-elevated rounded-ios p-3 mb-3 flex items-start gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 flex-shrink-0 text-text-secondary" aria-hidden>
                <circle cx="12" cy="12" r="9" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>Send the supplier the Stage 2 link to collect company details.</span>
            </div>
          )}
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
