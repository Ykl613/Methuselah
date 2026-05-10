import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase-server";
import { HeaderActions } from "@/components/HeaderActions";
import { SuppliersSearch } from "./SuppliersSearch";

const PAGE_SIZE = 25;

export default async function Suppliers() {
  const user = await requireAdmin();
  const supabase = createClient();

  // Fetch suppliers + follow-up counts, then sort to prioritize ones with open tasks
  const { data: allSuppliers, count } = await supabase
    .from("suppliers")
    .select("*", { count: "exact" })
    .eq("status", "approved")
    .order("approved_at", { ascending: false })
    .range(0, 999);

  const supplierIds = (allSuppliers || []).map((s: any) => s.id);
  let followUpMap: Record<string, number> = {};
  if (supplierIds.length > 0) {
    const { data: followUps } = await supabase
      .from("supplier_follow_up_tasks")
      .select("supplier_id")
      .in("supplier_id", supplierIds)
      .eq("status", "open");
    (followUps || []).forEach((f: any) => {
      followUpMap[f.supplier_id] = (followUpMap[f.supplier_id] || 0) + 1;
    });
  }

  const enriched = (allSuppliers || []).map((s: any) => ({
    ...s,
    open_follow_ups: followUpMap[s.id] || 0,
  }));

  // Sort: suppliers with open follow-ups first
  enriched.sort((a: any, b: any) => {
    if (a.open_follow_ups > 0 && b.open_follow_ups === 0) return -1;
    if (a.open_follow_ups === 0 && b.open_follow_ups > 0) return 1;
    if (a.approved_at && b.approved_at) return new Date(b.approved_at).getTime() - new Date(a.approved_at).getTime();
    return 0;
  });

  const firstPage = enriched.slice(0, PAGE_SIZE);

  return (
    <div>
      <div className="flex justify-between items-center mb-5">
        <div>
          <h1 className="text-[24px] font-semibold tracking-[-0.5px] text-text-primary mb-1">Suppliers</h1>
          <p className="text-[12px] text-text-muted">{(count || 0).toLocaleString()} approved suppliers</p>
        </div>
        <HeaderActions userId={user.id} />
      </div>

      <SuppliersSearch initialSuppliers={firstPage} initialCount={count || 0} />
    </div>
  );
}
