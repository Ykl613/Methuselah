"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface DeleteSupplierButtonProps {
  supplierId: string;
  supplierName: string;
  variant?: "icon" | "button"; // icon = small icon (for table rows), button = full button (for detail page)
  redirectTo?: string; // where to go after deletion (default: stay on page)
}

export function DeleteSupplierButton({ supplierId, supplierName, variant = "icon", redirectTo }: DeleteSupplierButtonProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  const requiredText = "DELETE";

  const handleDelete = async () => {
    if (confirmText !== requiredText) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/supplier/${supplierId}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        alert(`Failed to delete: ${data.error || "Unknown error"}`);
        setLoading(false);
        return;
      }
      setIsOpen(false);
      if (redirectTo) {
        router.push(redirectTo);
      } else {
        router.refresh();
      }
    } catch (e: any) {
      alert(`Error: ${e.message}`);
      setLoading(false);
    }
  };

  const openModal = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    setIsOpen(true);
    setConfirmText("");
  };

  return (
    <>
      {variant === "icon" ? (
        <button
          onClick={openModal}
          title="Delete supplier"
          className="w-8 h-8 rounded-lg hover:bg-red-soft flex items-center justify-center transition-all opacity-60 hover:opacity-100 group"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-text-muted group-hover:text-red transition-colors" aria-hidden>
            <path d="M4 7l16 0" />
            <path d="M10 11l0 6" />
            <path d="M14 11l0 6" />
            <path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12" />
            <path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3" />
          </svg>
        </button>
      ) : (
        <button
          onClick={openModal}
          className="btn bg-red-soft text-red-text hover:bg-red/20 hover:text-red-text active:scale-95 flex items-center gap-1.5"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M4 7l16 0" />
            <path d="M10 11l0 6" />
            <path d="M14 11l0 6" />
            <path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12" />
            <path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3" />
          </svg>
          Delete
        </button>
      )}

      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => !loading && setIsOpen(false)}
        >
          <div
            className="bg-white rounded-ios-xl max-w-md w-full p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-soft flex items-center justify-center flex-shrink-0">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red" aria-hidden>
                  <path d="M12 9v2m0 4v.01" />
                  <path d="M5 19h14a2 2 0 0 0 1.84 -2.75l-7.1 -12.25a2 2 0 0 0 -3.5 0l-7.1 12.25a2 2 0 0 0 1.75 2.75" />
                </svg>
              </div>
              <div>
                <h3 className="text-[17px] font-semibold tracking-[-0.3px] text-text-primary">Delete supplier?</h3>
                <p className="text-[13px] text-text-muted mt-0.5">This action cannot be undone</p>
              </div>
            </div>

            <div className="bg-bg-elevated rounded-ios p-3 mb-4">
              <p className="text-[13px] text-text-primary font-medium">{supplierName}</p>
            </div>

            <div className="space-y-2 text-[13px] text-text-secondary mb-5">
              <p>Deleting this supplier will permanently remove:</p>
              <ul className="ml-5 space-y-1 text-text-muted">
                <li>• Supplier record and all profile data</li>
                <li>• All 5 onboarding stage tasks</li>
                <li>• All notes and history</li>
                <li>• All evaluation data</li>
              </ul>
              <p className="text-[12px] text-text-muted pt-1">
                The deletion will be logged in the audit log.
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-[12px] text-text-secondary mb-1.5 font-medium">
                Type <code className="bg-red-soft text-red-text px-1.5 py-0.5 rounded text-[11px] font-mono font-semibold">{requiredText}</code> to confirm
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder={requiredText}
                disabled={loading}
                autoFocus
                className="input font-mono"
              />
            </div>

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setIsOpen(false)}
                disabled={loading}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={loading || confirmText !== requiredText}
                className="btn bg-red text-white hover:bg-red/90 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
              >
                {loading ? "Deleting..." : "Delete supplier"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
