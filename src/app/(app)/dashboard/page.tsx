import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase-server";
import Link from "next/link";
import { NotificationBell } from "@/components/NotificationBell";
import { StatusBadge } from "@/components/StatusBadge";
import { GreetingHeader } from "@/components/GreetingHeader";
import { HeaderActions } from "@/components/HeaderActions";

// Re-render every 30 seconds at most. Reduces DB load dramatically.
export const revalidate = 30;
export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const user = await requireAdmin();
  const supabase = createClient();

  // Run ALL queries in parallel for maximum speed (was 2 round-trips, now 1)
  const [
    { count: total },
    { count: approved },
    { count: notApproved },
    { count: inProgress },
    { count: awaitingMe },
    { data: pendingSuppliers },
    { data: openFollowUps },
  ] = await Promise.all([
    supabase.from("suppliers").select("*", { count: "exact", head: true }),
    supabase.from("suppliers").select("*", { count: "exact", head: true }).eq("status", "approved"),
    supabase.from("suppliers").select("*", { count: "exact", head: true }).eq("status", "not_approved"),
    supabase.from("suppliers").select("*", { count: "exact", head: true }).eq("status", "in_progress"),
    supabase.from("tasks").select("*", { count: "exact", head: true })
      .eq("claimed_by", user.id).neq("status", "completed"),
    supabase.from("suppliers").select("id, reference_code, company_name, country, current_stage, status, updated_at")
      .eq("status", "in_progress").order("updated_at", { ascending: false }).limit(10),
    supabase.from("supplier_follow_up_tasks")
      .select("id, title, created_at, created_by_label, supplier_id, suppliers!inner(id, company_name, reference_code)")
      .eq("status", "open")
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  const taskCount = awaitingMe || 0;

  return (
    <div>
      {/* Hero header with personalized greeting and live clock */}
      <div className="flex justify-between items-start mb-7">
        <GreetingHeader fullName={user.full_name} taskCount={taskCount} />
        <HeaderActions userId={user.id} />
      </div>

      {/* 4 stat cards in iOS style with colorful icons - compact */}
      <div className="grid grid-cols-4 gap-2.5 mb-6">
        <Link href="/my-tasks" className="stat-card-compact card-hover block">
          <div className="flex justify-between items-center mb-2.5">
            <div className="w-8 h-8 rounded-lg bg-accent-soft flex items-center justify-center">
              <i className="ti ti-bolt text-[16px] text-accent" aria-hidden />
            </div>
            {taskCount > 0 && (
              <span className="text-[10px] px-1.5 py-0.5 bg-accent-soft text-accent-strong rounded-full font-semibold">
                Active
              </span>
            )}
          </div>
          <p className="text-[12px] text-text-muted font-medium">Tasks for you</p>
          <p className="text-[22px] font-semibold text-text-primary tracking-[-0.4px] mt-0.5 leading-tight">
            {taskCount.toLocaleString()}
          </p>
        </Link>

        <Link href="/suppliers" className="stat-card-compact card-hover block">
          <div className="flex justify-between items-center mb-2.5">
            <div className="w-8 h-8 rounded-lg bg-green-soft flex items-center justify-center">
              <i className="ti ti-circle-check text-[16px] text-green-icon" aria-hidden />
            </div>
          </div>
          <p className="text-[12px] text-text-muted font-medium">Approved</p>
          <p className="text-[22px] font-semibold text-text-primary tracking-[-0.4px] mt-0.5 leading-tight">
            {(approved || 0).toLocaleString()}
          </p>
        </Link>

        <Link href="/in-progress?status=not_approved" className="stat-card-compact card-hover block">
          <div className="flex justify-between items-center mb-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-soft flex items-center justify-center">
              <i className="ti ti-circle-x text-[16px] text-red-icon" aria-hidden />
            </div>
          </div>
          <p className="text-[12px] text-text-muted font-medium">Not approved</p>
          <p className="text-[22px] font-semibold text-text-primary tracking-[-0.4px] mt-0.5 leading-tight">
            {(notApproved || 0).toLocaleString()}
          </p>
        </Link>

        <Link href="/in-progress?status=in_progress" className="stat-card-compact card-hover block">
          <div className="flex justify-between items-center mb-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-soft flex items-center justify-center">
              <i className="ti ti-clock-hour-3 text-[16px] text-amber-icon" aria-hidden />
            </div>
          </div>
          <p className="text-[12px] text-text-muted font-medium">In progress</p>
          <p className="text-[22px] font-semibold text-text-primary tracking-[-0.4px] mt-0.5 leading-tight">
            {(inProgress || 0).toLocaleString()}
          </p>
        </Link>
      </div>

      {/* Follow-up Tasks Panel (custom admin tasks for approved suppliers) */}
      {openFollowUps && openFollowUps.length > 0 && (
        <div className="panel mb-3.5 border border-red/20">
          <div className="px-5 py-4 flex justify-between items-center border-b border-border bg-red-soft/30">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-red-soft flex items-center justify-center animate-pulse-strong">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red" aria-hidden>
                  <path d="M5 7l5 5l-5 5" />
                  <path d="M13 17l6 0" />
                </svg>
              </div>
              <div>
                <h2 className="text-[17px] font-semibold tracking-[-0.3px]">Follow-ups</h2>
                <p className="text-[12px] text-text-muted mt-0.5">{openFollowUps.length} open task{openFollowUps.length !== 1 ? "s" : ""} for approved suppliers</p>
              </div>
            </div>
          </div>
          <div className="divide-y divide-border">
            {openFollowUps.map((task: any) => (
              <Link
                key={task.id}
                href={`/suppliers/${task.supplier_id}`}
                className="flex items-center gap-3 px-5 py-3 hover:bg-bg-elevated transition-colors group"
              >
                <div className="w-9 h-9 rounded-full bg-red-soft text-red-text flex items-center justify-center flex-shrink-0 font-semibold text-[13px]">
                  {(task.suppliers?.company_name || task.suppliers?.reference_code || "?").charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-medium text-text-primary truncate">{task.title}</div>
                  <div className="text-[11px] text-text-muted mt-0.5">
                    {task.suppliers?.company_name || task.suppliers?.reference_code} · Added {new Date(task.created_at).toLocaleDateString()}
                  </div>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-text-subtle group-hover:text-text-muted" aria-hidden>
                  <path d="M9 6l6 6l-6 6" />
                </svg>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Pending tasks panel */}
      <div className="panel">
        <div className="px-5 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-[17px] font-semibold tracking-[-0.3px]">Pending tasks</h2>
            <p className="text-[12px] text-text-muted mt-0.5">In-progress suppliers · sorted by recent activity</p>
          </div>
          <Link href="/in-progress" className="btn btn-secondary text-[12px] py-1.5">
            View all <i className="ti ti-arrow-right text-[14px]" aria-hidden />
          </Link>
        </div>
        <table className="ios-table">
          <thead>
            <tr>
              <th>Supplier</th>
              <th>Stage</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {(pendingSuppliers || []).length === 0 && (
              <tr>
                <td colSpan={3} className="px-5 py-12 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-14 h-14 bg-bg-elevated rounded-full flex items-center justify-center">
                      <i className="ti ti-package text-[24px] text-text-subtle" aria-hidden />
                    </div>
                    <div>
                      <p className="text-[14px] font-medium text-text-secondary">No suppliers in progress</p>
                      <p className="text-[12px] text-text-muted mt-0.5">New suppliers will appear here as they register</p>
                    </div>
                  </div>
                </td>
              </tr>
            )}
            {(pendingSuppliers || []).map((s: any) => (
              <tr key={s.id}>
                <td>
                  <Link href={`/suppliers/${s.id}`} className="flex items-center gap-3 -m-1 p-1">
                    <div className="avatar bg-accent-soft text-accent">
                      {(s.company_name || s.reference_code).charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-medium text-[14px] text-text-primary">
                        {s.country === "China" ? "🇨🇳 " : s.country === "Israel" ? "🇮🇱 " : ""}
                        {s.company_name || s.reference_code}
                      </div>
                      <div className="text-[12px] text-text-muted mt-0.5">{s.reference_code}</div>
                    </div>
                  </Link>
                </td>
                <td>
                  <span className="stage-tag">{s.current_stage.toUpperCase().replace("_", " ")}</span>
                </td>
                <td><StatusBadge status={s.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
