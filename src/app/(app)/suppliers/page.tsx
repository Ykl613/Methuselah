import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase-server";
import { HeaderActions } from "@/components/HeaderActions";
import { SuppliersSearch } from "./SuppliersSearch";

const PAGE_SIZE = 25;

export default async function Suppliers() {
  const user = await requireAdmin();
  const supabase = createClient();

  // Initial load - first 25 approved suppliers
  const { data: suppliers, count } = await supabase
    .from("suppliers")
    .select("*", { count: "exact" })
    .eq("status", "approved")
    .order("approved_at", { ascending: false })
    .range(0, PAGE_SIZE - 1);

  return (
    <div>
      <div className="flex justify-between items-center mb-5">
        <div>
          <h1 className="text-[24px] font-semibold tracking-[-0.5px] text-text-primary mb-1">Suppliers</h1>
          <p className="text-[12px] text-text-muted">{(count || 0).toLocaleString()} approved suppliers</p>
        </div>
        <HeaderActions userId={user.id} />
      </div>

      <SuppliersSearch initialSuppliers={suppliers || []} initialCount={count || 0} />
    </div>
  );
}
