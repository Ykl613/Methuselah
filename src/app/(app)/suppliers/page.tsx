import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase-server";
import { sanitizeSearch } from "@/lib/sanitize";
import Link from "next/link";
import { NotificationBell } from "@/components/NotificationBell";
import { StatusBadge } from "@/components/StatusBadge";

interface PageProps {
  searchParams: { page?: string; q?: string };
}

const PAGE_SIZE = 25;

export default async function Suppliers({ searchParams }: PageProps) {
  const user = await requireAdmin();
  const supabase = createClient();
  const page = Math.max(1, Math.min(10000, parseInt(searchParams.page || "1", 10) || 1));
  const q = sanitizeSearch(searchParams.q || "");

  // Approved suppliers only
  let query = supabase.from("suppliers").select("*", { count: "exact" }).eq("status", "approved");
  if (q) query = query.or(`company_name.ilike.%${q}%,email.ilike.%${q}%,contact_name.ilike.%${q}%`);

  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  query = query.order("approved_at", { ascending: false }).range(from, to);

  const { data: suppliers, count } = await query;
  const totalPages = Math.max(1, Math.ceil((count || 0) / PAGE_SIZE));

  const buildHref = (params: { page?: number; q?: string }) => {
    const sp = new URLSearchParams();
    if (params.page && params.page > 1) sp.set("page", String(params.page));
    if (params.q) sp.set("q", params.q);
    const s = sp.toString();
    return `/suppliers${s ? "?" + s : ""}`;
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-5">
        <div>
          <h1 className="text-[24px] font-semibold tracking-[-0.5px] text-text-primary mb-1">Suppliers</h1>
          <p className="text-[12px] text-text-muted">{(count || 0).toLocaleString()} approved suppliers</p>
        </div>
        <div className="flex gap-2.5 items-center">
          <NotificationBell userId={user.id} />
          <button className="btn btn-secondary"><i className="ti ti-download" aria-hidden /> Export</button>
        </div>
      </div>

      <div className="panel">
        <div className="px-4 py-3 border-b border-border flex gap-2 items-center">
          <form className="flex-1 max-w-md" method="get">
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
              <th>Approved</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {(suppliers || []).length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-12 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-14 h-14 bg-green-soft rounded-full flex items-center justify-center">
                      <i className="ti ti-circle-check text-[24px] text-green-icon" aria-hidden />
                    </div>
                    <div>
                      <p className="text-[14px] font-medium text-text-secondary">No approved suppliers yet</p>
                      <p className="text-[12px] text-text-muted mt-0.5">Approved suppliers will appear here after completing all stages</p>
                    </div>
                  </div>
                </td>
              </tr>
            )}
            {(suppliers || []).map((s: any) => (
              <tr key={s.id}>
                <td>
                  <Link href={`/suppliers/${s.id}`} className="flex items-center gap-3 -m-1 p-1">
                    <div className="avatar bg-green-soft text-green-text">
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
                <td className="text-text-muted">
                  {s.approved_at ? new Date(s.approved_at).toLocaleDateString() : "—"}
                </td>
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
              {page > 1 && <Link href={buildHref({ q, page: page - 1 })} className="btn btn-secondary text-[12px] px-3 py-1.5">←</Link>}
              <span className="text-[12px] text-text-secondary px-3 py-1.5">Page {page} of {totalPages}</span>
              {page < totalPages && <Link href={buildHref({ q, page: page + 1 })} className="btn btn-secondary text-[12px] px-3 py-1.5">→</Link>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
