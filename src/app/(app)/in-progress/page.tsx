import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase-server";
import { sanitizeSearch } from "@/lib/sanitize";
import Link from "next/link";
import { NotificationBell } from "@/components/NotificationBell";
import { StatusBadge } from "@/components/StatusBadge";
import type { SupplierStatus } from "@/lib/types";

interface PageProps {
  searchParams: { status?: string; page?: string; q?: string };
}

const PAGE_SIZE = 25;

export default async function InProgress({ searchParams }: PageProps) {
  const user = await requireAdmin();
  const supabase = createClient();
  const status = searchParams.status as SupplierStatus | undefined;
  const page = Math.max(1, Math.min(10000, parseInt(searchParams.page || "1", 10) || 1));
  const q = sanitizeSearch(searchParams.q || "");

  // Show suppliers that are NOT approved (in_progress or not_approved)
  let query = supabase.from("suppliers").select("*", { count: "exact" }).neq("status", "approved");

  // Optional sub-filter
  if (status === "in_progress" || status === "not_approved") {
    query = supabase.from("suppliers").select("*", { count: "exact" }).eq("status", status);
  }

  if (q) query = query.or(`company_name.ilike.%${q}%,email.ilike.%${q}%,contact_name.ilike.%${q}%`);

  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  query = query.order("updated_at", { ascending: false }).range(from, to);

  const { data: suppliers, count } = await query;
  const totalPages = Math.max(1, Math.ceil((count || 0) / PAGE_SIZE));

  // Counts for filter pills
  const [{ count: inProg }, { count: notAppr }] = await Promise.all([
    supabase.from("suppliers").select("*", { count: "exact", head: true }).eq("status", "in_progress"),
    supabase.from("suppliers").select("*", { count: "exact", head: true }).eq("status", "not_approved"),
  ]);
  const totalInProgress = (inProg || 0) + (notAppr || 0);

  const buildHref = (params: { status?: string; page?: number; q?: string }) => {
    const sp = new URLSearchParams();
    if (params.status) sp.set("status", params.status);
    if (params.page && params.page > 1) sp.set("page", String(params.page));
    if (params.q) sp.set("q", params.q);
    const s = sp.toString();
    return `/in-progress${s ? "?" + s : ""}`;
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-5">
        <div>
          <h1 className="text-[24px] font-semibold tracking-[-0.5px] text-text-primary mb-1">In Progress</h1>
          <p className="text-[12px] text-text-muted">{totalInProgress.toLocaleString()} suppliers still in workflow</p>
        </div>
        <div className="flex gap-2.5 items-center">
          <NotificationBell userId={user.id} />
          <button className="btn btn-secondary"><i className="ti ti-download" aria-hidden /> Export</button>
        </div>
      </div>

      <div className="flex gap-1 bg-white p-1 rounded-ios mb-3 w-fit border border-border">
        <Link href={buildHref({})} className={`px-3.5 py-1.5 rounded-md text-[12px] font-medium transition ${!status ? "bg-accent-soft text-accent-strong" : "text-text-secondary hover:text-text-primary"}`}>
          All <span className="ml-1.5 text-[10px] opacity-60">{totalInProgress.toLocaleString()}</span>
        </Link>
        <Link href={buildHref({ status: "in_progress" })} className={`px-3.5 py-1.5 rounded-md text-[12px] font-medium flex items-center gap-1.5 transition ${status === "in_progress" ? "bg-amber-soft text-amber-text" : "text-text-secondary hover:text-text-primary"}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-amber" /> In Progress <span className="ml-1 text-[10px] opacity-60">{(inProg || 0).toLocaleString()}</span>
        </Link>
        <Link href={buildHref({ status: "not_approved" })} className={`px-3.5 py-1.5 rounded-md text-[12px] font-medium flex items-center gap-1.5 transition ${status === "not_approved" ? "bg-red-soft text-red-text" : "text-text-secondary hover:text-text-primary"}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-red" /> Not Approved <span className="ml-1 text-[10px] opacity-60">{(notAppr || 0).toLocaleString()}</span>
        </Link>
      </div>

      <div className="panel">
        <div className="px-4 py-3 border-b border-border flex gap-2 items-center">
          <form className="flex-1 max-w-md" method="get">
            {status && <input type="hidden" name="status" value={status} />}
            <div className="relative">
              <i className="ti ti-search absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-[14px]" aria-hidden />
              <input name="q" defaultValue={q} placeholder="Search by name, email, company..."
                className="w-full bg-bg-elevated border-0 rounded-ios pl-9 pr-3 py-2 text-[13px] outline-none focus:bg-white focus:ring-2 focus:ring-accent/15 transition-all" />
            </div>
          </form>
        </div>
        <table className="ios-table">
          <thead>
            <tr className="border-b border-border">
              <th>Company</th>
              <th>Contact</th>
              <th>Country</th>
              <th>Stage</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {(suppliers || []).length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-12 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-14 h-14 bg-amber-soft rounded-full flex items-center justify-center">
                      <i className="ti ti-progress text-[24px] text-amber-icon" aria-hidden />
                    </div>
                    <div>
                      <p className="text-[14px] font-medium text-text-secondary">No suppliers in progress</p>
                      <p className="text-[12px] text-text-muted mt-0.5">New supplier registrations will appear here</p>
                    </div>
                  </div>
                </td>
              </tr>
            )}
            {(suppliers || []).map((s: any) => (
              <tr key={s.id}>
                <td>
                  <Link href={`/suppliers/${s.id}`} className="flex items-center gap-3 -m-1 p-1">
                    <div className={`avatar ${s.status === "not_approved" ? "bg-red-soft text-red-text" : "bg-amber-soft text-amber-text"}`}>
                      {(s.company_name || s.reference_code).charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-medium text-[14px] text-text-primary">{s.company_name || s.reference_code}</div>
                      <div className="text-[12px] text-text-muted mt-0.5">{s.reference_code}</div>
                    </div>
                  </Link>
                </td>
                <td className="text-text-secondary">{s.contact_name || "—"}</td>
                <td>{s.country === "China" ? "🇨🇳 China" : s.country === "Israel" ? "🇮🇱 Israel" : "—"}</td>
                <td><span className="stage-tag">{s.current_stage.toUpperCase().replace("_", " ")}</span></td>
                <td><StatusBadge status={s.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>

        {(suppliers || []).length > 0 && (
          <div className="px-4 py-3 border-t border-border flex justify-between items-center">
            <div className="text-[12px] text-text-muted">
              Showing <strong className="text-text-primary">{from + 1}–{Math.min(to + 1, count || 0)}</strong> of <strong className="text-text-primary">{(count || 0).toLocaleString()}</strong>
            </div>
            <div className="flex gap-1.5">
              {page > 1 && <Link href={buildHref({ status, q, page: page - 1 })} className="btn btn-secondary text-[12px] px-3 py-1.5">←</Link>}
              <span className="text-[12px] text-text-secondary px-3 py-1.5">Page {page} of {totalPages}</span>
              {page < totalPages && <Link href={buildHref({ status, q, page: page + 1 })} className="btn btn-secondary text-[12px] px-3 py-1.5">→</Link>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
