import type { SupplierStatus } from "@/lib/types";

const labels: Record<SupplierStatus, string> = {
  approved: "Approved",
  not_approved: "Not approved",
  in_progress: "In progress",
};

const classes: Record<SupplierStatus, string> = {
  approved: "bg-green-soft text-green-text",
  not_approved: "bg-red-soft text-red-text",
  in_progress: "bg-amber-soft text-amber-text",
};

export function StatusBadge({ status }: { status: SupplierStatus }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium ${classes[status]}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {labels[status]}
    </span>
  );
}
