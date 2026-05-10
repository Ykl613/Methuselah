import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase-server";
import Link from "next/link";
import { NotificationBell } from "@/components/NotificationBell";

interface PageProps { searchParams: { stage?: string; page?: string }; }
const PAGE_SIZE = 50;

export default async function Tasks({ searchParams }: PageProps) {
  const user = await requireAdmin();
  const supabase = createClient();
  const stageFilter = searchParams.stage;
  const page = Math.max(1, parseInt(searchParams.page || "1", 10));

  let query = supabase.from("tasks").select("id, stage, status, claimed_at, claimed_by, supplier_id, created_at", { count: "exact" }).neq("status", "completed");

  if (stageFilter && stageFilter !== "all") query = query.eq("stage", stageFilter);

  const from = (page - 1) * PAGE_SIZE;
  query = query.order("created_at", { ascending: false }).range(from, from + PAGE_SIZE - 1);

  const { data: tasksRaw, count } = await query;

  // Fetch suppliers and users referenced
  const supplierIds = Array.from(new Set((tasksRaw || []).map((t: any) => t.supplier_id)));
  const userIds = Array.from(new Set((tasksRaw || []).map((t: any) => t.claimed_by).filter(Boolean)));
  let suppliersMap: Record<string, any> = {};
  let usersMap: Record<string, string> = {};
  if (supplierIds.length > 0) {
    const { data } = await supabase.from("suppliers").select("id, company_name, country, reference_code").in("id", supplierIds);
    (data || []).forEach((s: any) => { suppliersMap[s.id] = s; });
  }
  if (userIds.length > 0) {
    const { data } = await supabase.from("user_profiles").select("id, full_name").in("id", userIds);
    (data || []).forEach((u: any) => { usersMap[u.id] = u.full_name; });
  }
  const tasks = (tasksRaw || []).map((t: any) => ({
    ...t,
    supplier: suppliersMap[t.supplier_id] || null,
    claimed_by_user: t.claimed_by ? { full_name: usersMap[t.claimed_by] } : null,
  }));

  const counts: Record<string, number> = {};
  for (const s of ["stage_1", "stage_2", "stage_3", "stage_4", "stage_5"]) {
    const { count: c } = await supabase.from("tasks").select("*", { count: "exact", head: true }).eq("stage", s).neq("status", "completed");
    counts[s] = c || 0;
  }
  const totalActive = Object.values(counts).reduce((a, b) => a + b, 0);
  const totalPages = Math.max(1, Math.ceil((count || 0) / PAGE_SIZE));

  const buildHref = (params: { stage?: string; page?: number }) => {
    const sp = new URLSearchParams();
    if (params.stage && params.stage !== "all") sp.set("stage", params.stage);
    if (params.page && params.page > 1) sp.set("page", String(params.page));
    return `/tasks${sp.toString() ? "?" + sp.toString() : ""}`;
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-5">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-text-primary mb-0.5">Tasks</h1>
          <p className="text-xs text-text-muted">{totalActive} active tasks across 5 stages</p>
        </div>
        <NotificationBell userId={user.id} />
      </div>

      <div className="flex gap-1 bg-bg-elevated p-1 rounded-lg mb-3 w-fit">
        <Link href={buildHref({})} className={`px-3 py-1.5 rounded-md text-xs font-medium ${!stageFilter || stageFilter === "all" ? "bg-white shadow-sm text-text-primary" : "text-text-secondary"}`}>
          All Stages <span className="ml-1 bg-bg-elevated px-1.5 rounded text-[10px] font-mono">{totalActive}</span>
        </Link>
        {["stage_1", "stage_2", "stage_3", "stage_4", "stage_5"].map((s, i) => (
          <Link key={s} href={buildHref({ stage: s })} className={`px-3 py-1.5 rounded-md text-xs font-medium ${stageFilter === s ? "bg-white shadow-sm text-text-primary" : "text-text-secondary"}`}>
            Stage {i + 1} <span className="ml-1 bg-bg-elevated px-1.5 rounded text-[10px] font-mono">{counts[s]}</span>
          </Link>
        ))}
      </div>

      <div className="panel">
        <table className="w-full text-xs">
          <thead className="bg-bg-base">
            <tr>
              <th className="text-left px-4 py-2 text-[10.5px] text-text-muted font-medium border-b border-border">Supplier</th>
              <th className="text-left px-3 py-2 text-[10.5px] text-text-muted font-medium border-b border-border">Stage</th>
              <th className="text-left px-3 py-2 text-[10.5px] text-text-muted font-medium border-b border-border">Assignee</th>
              <th className="text-left px-3 py-2 text-[10.5px] text-text-muted font-medium border-b border-border">Started</th>
              <th className="text-left px-3 py-2 text-[10.5px] text-text-muted font-medium border-b border-border">Status</th>
            </tr>
          </thead>
          <tbody>
            {(tasks || []).length === 0 && (
              <tr><td colSpan={5} className="px-4 py-12 text-center text-text-muted">No tasks</td></tr>
            )}
            {(tasks || []).map((t: any) => (
              <tr key={t.id} className="border-b border-border last:border-0 hover:bg-bg-elevated">
                <td className="px-4 py-2.5 font-medium">
                  <Link href={`/suppliers/${t.supplier?.id}`}>{t.supplier?.country === "China" ? "🇨🇳 " : t.supplier?.country === "Israel" ? "🇮🇱 " : ""}{t.supplier?.company_name || "—"}</Link>
                </td>
                <td className="px-3 py-2.5"><span className="stage-tag">{t.stage.toUpperCase().replace("_", " ")}</span></td>
                <td className="px-3 py-2.5 text-text-secondary">{t.claimed_by_user?.full_name || <span className="italic text-text-muted">Unassigned</span>}</td>
                <td className="px-3 py-2.5 text-text-muted">{t.claimed_at ? new Date(t.claimed_at).toLocaleDateString() : new Date(t.created_at).toLocaleDateString()}</td>
                <td className="px-3 py-2.5">
                  <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium ${t.status === "open" ? "bg-bg-elevated text-text-secondary" : "bg-amber-soft text-amber-text"}`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-current" />
                    {t.status === "open" ? "Open" : "In Progress"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="px-4 py-3 border-t border-border flex justify-between items-center">
          <div className="text-xs text-text-muted">{(count || 0).toLocaleString()} tasks</div>
          <div className="flex gap-1">
            {page > 1 && <Link href={buildHref({ stage: stageFilter, page: page - 1 })} className="btn btn-secondary px-2">←</Link>}
            <span className="text-xs text-text-secondary px-2 py-1">Page {page} / {totalPages}</span>
            {page < totalPages && <Link href={buildHref({ stage: stageFilter, page: page + 1 })} className="btn btn-secondary px-2">→</Link>}
          </div>
        </div>
      </div>
    </div>
  );
}
