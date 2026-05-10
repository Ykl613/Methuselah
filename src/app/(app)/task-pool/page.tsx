import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase-server";
import { NotificationBell } from "@/components/NotificationBell";
import { TaskPoolList } from "./TaskPoolList";

export default async function TaskPool() {
  const me = await requireAuth();
  const supabase = createClient();

  const { data: openTasksRaw } = await supabase.from("tasks").select("id, stage, status, created_at, claimed_at, supplier_id").eq("status", "open").order("created_at");
  const { data: myTasksRaw } = await supabase.from("tasks").select("id, stage, status, claimed_at, supplier_id").eq("claimed_by", me.id).neq("status", "completed").order("claimed_at");

  const allSupplierIds = Array.from(new Set([
    ...(openTasksRaw || []).map((t: any) => t.supplier_id),
    ...(myTasksRaw || []).map((t: any) => t.supplier_id),
  ]));
  let suppliersMap: Record<string, any> = {};
  if (allSupplierIds.length > 0) {
    const { data } = await supabase.from("suppliers").select("id, company_name, country").in("id", allSupplierIds);
    (data || []).forEach((s: any) => { suppliersMap[s.id] = s; });
  }
  const openTasks = (openTasksRaw || []).map((t: any) => ({ ...t, supplier: suppliersMap[t.supplier_id] }));
  const myTasks = (myTasksRaw || []).map((t: any) => ({ ...t, supplier: suppliersMap[t.supplier_id] }));

  // Filter open tasks: only show stages whose previous stage is completed
  // (we do this client-side using all data from this supplier)
  const { data: allTasks } = await supabase.from("tasks").select("supplier_id, stage, status");
  const completedByPair = new Set((allTasks || []).filter((t: any) => t.status === "completed").map((t: any) => `${t.supplier_id}:${t.stage}`));
  const stageOrder = ["stage_1", "stage_2", "stage_3", "stage_4", "stage_5"];

  const availableTasks = (openTasks || []).filter((t: any) => {
    const idx = stageOrder.indexOf(t.stage);
    if (idx === 0) return true;
    return completedByPair.has(`${t.supplier_id}:${stageOrder[idx - 1]}`);
  });

  const urgent = availableTasks.filter((t: any) => {
    const created = new Date(t.created_at).getTime();
    return Date.now() - created > 24 * 60 * 60 * 1000;
  });
  const standard = availableTasks.filter((t: any) => !urgent.includes(t));

  return (
    <div>
      <div className="flex justify-between items-center mb-5">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-text-primary mb-0.5">Welcome back, {me.full_name.split(" ")[0]}</h1>
          <p className="text-xs text-text-muted">
            {availableTasks.length} tasks available · {(myTasks || []).length} in progress
            {urgent.length > 0 && <> · <span className="text-red font-semibold">{urgent.length} urgent</span></>}
          </p>
        </div>
        <NotificationBell userId={me.id} />
      </div>

      <TaskPoolList urgent={urgent} standard={standard} mine={myTasks || []} />
    </div>
  );
}
