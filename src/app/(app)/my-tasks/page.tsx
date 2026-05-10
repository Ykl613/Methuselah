import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase-server";
import Link from "next/link";
import { NotificationBell } from "@/components/NotificationBell";

export default async function MyTasks() {
  const me = await requireAuth();
  const supabase = createClient();

  const { data: activeRaw } = await supabase.from("tasks").select("id, stage, status, claimed_at, supplier_id").eq("claimed_by", me.id).neq("status", "completed").order("claimed_at");
  const { data: completedRaw } = await supabase.from("tasks").select("id, stage, status, completed_at, supplier_id").eq("completed_by", me.id).eq("status", "completed").order("completed_at", { ascending: false }).limit(20);

  const ids = Array.from(new Set([...(activeRaw || []).map((t: any) => t.supplier_id), ...(completedRaw || []).map((t: any) => t.supplier_id)]));
  let suppliersMap: Record<string, any> = {};
  if (ids.length > 0) {
    const { data } = await supabase.from("suppliers").select("id, company_name, country").in("id", ids);
    (data || []).forEach((s: any) => { suppliersMap[s.id] = s; });
  }
  const active = (activeRaw || []).map((t: any) => ({ ...t, supplier: suppliersMap[t.supplier_id] }));
  const completed = (completedRaw || []).map((t: any) => ({ ...t, supplier: suppliersMap[t.supplier_id] }));

  return (
    <div>
      <div className="flex justify-between items-center mb-5">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-text-primary mb-0.5">My Tasks</h1>
          <p className="text-xs text-text-muted">{(active || []).length} active · {(completed || []).length} recently completed</p>
        </div>
        <NotificationBell userId={me.id} />
      </div>

      {(active || []).length === 0 && (
        <div className="card text-center py-12">
          <i className="ti ti-info-circle text-2xl text-text-muted opacity-50 mb-2" aria-hidden />
          <p className="text-sm text-text-muted mb-2">You haven&apos;t claimed any tasks yet.</p>
          <Link href="/task-pool" className="text-accent text-xs font-medium hover:underline">Browse Task Pool →</Link>
        </div>
      )}

      {(active || []).length > 0 && (
        <>
          <div className="flex items-center gap-2 my-3">
            <div className="text-[11px] uppercase tracking-wider text-text-muted font-semibold">Active</div>
            <div className="flex-1 h-px bg-border" />
          </div>
          {(active || []).map((t: any) => (
            <Link key={t.id} href={`/tasks/${t.id}`} className="block bg-white border-l-2 border-l-green border border-border rounded-lg px-3.5 py-3 mb-1.5 hover:border-border-strong">
              <div className="text-sm font-semibold">{t.supplier?.country === "China" ? "🇨🇳 " : t.supplier?.country === "Israel" ? "🇮🇱 " : ""}{t.supplier?.company_name}</div>
              <div className="text-[11px] text-text-muted flex items-center gap-1.5 mt-0.5">
                <span className="stage-tag">{t.stage.toUpperCase().replace("_", " ")}</span>
                · Started {new Date(t.claimed_at).toLocaleString()}
              </div>
            </Link>
          ))}
        </>
      )}

      {(completed || []).length > 0 && (
        <>
          <div className="flex items-center gap-2 my-3 mt-6">
            <div className="text-[11px] uppercase tracking-wider text-text-muted font-semibold">Recently Completed</div>
            <div className="flex-1 h-px bg-border" />
          </div>
          {(completed || []).map((t: any) => (
            <div key={t.id} className="bg-white border border-border rounded-lg px-3.5 py-3 mb-1.5 opacity-75 flex items-center gap-2">
              <i className="ti ti-circle-check text-green text-base" aria-hidden />
              <div className="flex-1">
                <div className="text-xs font-semibold">{t.supplier?.company_name}</div>
                <div className="text-[10.5px] text-text-muted flex items-center gap-1.5 mt-0.5">
                  <span className="stage-tag">{t.stage.toUpperCase().replace("_", " ")}</span>
                  · {new Date(t.completed_at).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
