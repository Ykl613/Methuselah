"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function SupplierActions({ supplier }: { supplier: any }) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [showReject, setShowReject] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  async function action(type: "send_stage_2" | "send_stage_3" | "continue") {
    setLoading(type);
    const res = await fetch(`/api/supplier/${supplier.id}/action`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: type }),
    });
    setLoading(null);
    if (res.ok) router.refresh();
    else { const d = await res.json(); alert(d.error || "Failed"); }
  }

  async function reject() {
    if (!rejectReason.trim()) { alert("Reason required"); return; }
    setLoading("reject");
    const res = await fetch(`/api/supplier/${supplier.id}/action`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "reject", reason: rejectReason }),
    });
    setLoading(null);
    if (res.ok) { setShowReject(false); router.refresh(); }
    else { const d = await res.json(); alert(d.error || "Failed"); }
  }

  if (supplier.status !== "in_progress") return null;

  const stage = supplier.current_stage;
  const sendNext = stage === "form_2" ? "send_stage_2" : stage === "form_3" ? "send_stage_3" : null;

  return (
    <>
      <div className="flex gap-1.5">
        {sendNext && (
          <button onClick={() => action(sendNext)} disabled={loading !== null} className="btn btn-secondary text-xs">
            <i className="ti ti-send" aria-hidden /> Send {sendNext === "send_stage_2" ? "Stage 2" : "Stage 3"} Link
          </button>
        )}
        <button onClick={() => setShowReject(true)} disabled={loading !== null} className="btn btn-danger text-xs">
          <i className="ti ti-x" aria-hidden /> Reject
        </button>
      </div>

      {showReject && (
        <div className="fixed inset-0 bg-black/45 flex items-center justify-center z-50 p-6" onClick={() => setShowReject(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold mb-3">Reject Supplier</h2>
            <p className="text-xs text-text-muted mb-3">This action moves the supplier to Not Approved. Provide a reason for the audit log.</p>
            <textarea className="input min-h-[80px]" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Reason for rejection..." />
            <div className="flex gap-2 justify-end mt-4">
              <button onClick={() => setShowReject(false)} className="btn btn-secondary">Cancel</button>
              <button onClick={reject} disabled={loading === "reject"} className="btn btn-danger">
                {loading === "reject" ? "..." : "Confirm Rejection"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
