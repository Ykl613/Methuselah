import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase-server";
import { sanitizeSearch } from "@/lib/sanitize";
import { HeaderActions } from "@/components/HeaderActions";

interface PageProps { searchParams: { from?: string; to?: string; q?: string }; }

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export default async function AuditLog({ searchParams }: PageProps) {
  const me = await requireAdmin();
  const supabase = createClient();
  const today = new Date().toISOString().slice(0, 10);
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const from = ISO_DATE.test(searchParams.from || "") ? searchParams.from! : weekAgo;
  const to = ISO_DATE.test(searchParams.to || "") ? searchParams.to! : today;
  const q = sanitizeSearch(searchParams.q || "");

  let query = supabase.from("audit_log").select("*").gte("created_at", `${from}T00:00:00`).lte("created_at", `${to}T23:59:59`);
  if (q) query = query.or(`action.ilike.%${q}%,actor_label.ilike.%${q}%,entity_label.ilike.%${q}%`);
  const { data: events } = await query.order("created_at", { ascending: false }).limit(200);

  return (
    <div>
      <div className="flex justify-between items-center mb-5">
        <div>
          <h1 className="text-[24px] font-semibold tracking-[-0.5px] text-text-primary mb-1">Audit Log</h1>
          <p className="text-[12px] text-text-muted">Complete record of every system action · Immutable</p>
        </div>
        <HeaderActions userId={me.id} />
      </div>

      <div className="panel">
        <form method="get" className="px-4 py-2.5 border-b border-border flex gap-2 items-center flex-wrap">
          <input name="q" defaultValue={q} placeholder="Search actions, users, entities..."
            className="bg-bg-elevated border border-border rounded-md px-3 py-1.5 text-xs outline-none focus:border-accent flex-1 max-w-xs" />
          <div className="flex items-center gap-1.5 bg-white border border-border-strong rounded-md px-2 py-1">
            <i className="ti ti-calendar text-text-muted text-sm" aria-hidden />
            <input name="from" type="date" defaultValue={from} className="text-[11px] text-text-primary border-none outline-none bg-transparent" />
            <span className="text-text-subtle">→</span>
            <input name="to" type="date" defaultValue={to} className="text-[11px] text-text-primary border-none outline-none bg-transparent" />
          </div>
          <button className="btn btn-primary"><i className="ti ti-filter" aria-hidden /> Apply</button>
        </form>

        <table className="w-full text-xs">
          <thead className="bg-bg-base">
            <tr>
              <th className="text-left px-4 py-2 text-[10.5px] text-text-muted font-medium border-b border-border">Timestamp</th>
              <th className="text-left px-3 py-2 text-[10.5px] text-text-muted font-medium border-b border-border">Actor</th>
              <th className="text-left px-3 py-2 text-[10.5px] text-text-muted font-medium border-b border-border">Action</th>
              <th className="text-left px-3 py-2 text-[10.5px] text-text-muted font-medium border-b border-border">Entity</th>
            </tr>
          </thead>
          <tbody>
            {(events || []).length === 0 && (
              <tr><td colSpan={4} className="px-4 py-12 text-center text-text-muted">No events in this range</td></tr>
            )}
            {(events || []).map((e: any) => (
              <tr key={e.id} className="border-b border-border last:border-0">
                <td className="px-4 py-2.5 text-text-muted font-mono text-[11px]">{new Date(e.created_at).toLocaleString()}</td>
                <td className="px-3 py-2.5 font-medium">{e.actor_label}</td>
                <td className="px-3 py-2.5"><span className="font-mono text-[10.5px] bg-bg-elevated text-text-secondary px-1.5 py-0.5 rounded mr-1.5">{e.action}</span></td>
                <td className="px-3 py-2.5 text-text-muted">{e.entity_label || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="px-4 py-2.5 border-t border-border text-xs text-text-muted">
          {events?.length || 0} events · showing most recent
        </div>
      </div>
    </div>
  );
}
