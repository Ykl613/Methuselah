"use client";
import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { StatusBadge } from "@/components/StatusBadge";
import { DeleteSupplierButton } from "@/components/DeleteSupplierButton";

// Field options for the dropdown (label shown to user → DB column name)
const FIELD_OPTIONS = [
  { value: "company_name", label: "Company name" },
  { value: "contact_name", label: "Contact name" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "reference_code", label: "Reference code" },
  { value: "business_number", label: "Business number" },
  { value: "company_location", label: "Company location" },
  { value: "factory_address", label: "Factory address" },
  { value: "product_type", label: "Product type" },
  { value: "production_quantity", label: "Capacity" },
  { value: "country", label: "Country" },
];

interface Filter {
  field: string;
  value: string;
}

interface Supplier {
  id: string;
  reference_code: string;
  company_name: string | null;
  contact_name: string | null;
  email: string | null;
  country: string | null;
  status: "approved" | "in_progress" | "not_approved";
  approved_at: string | null;
  open_follow_ups?: number;
}

// Custom debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export function SuppliersSearch({ initialSuppliers, initialCount }: { initialSuppliers: Supplier[]; initialCount: number }) {
  const [filters, setFilters] = useState<Filter[]>([
    { field: "company_name", value: "" },
    { field: "email", value: "" },
    { field: "product_type", value: "" },
  ]);
  const [suppliers, setSuppliers] = useState<Supplier[]>(initialSuppliers);
  const [count, setCount] = useState<number>(initialCount);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(Math.max(1, Math.ceil(initialCount / 25)));

  // Debounce filter changes (400ms after user stops typing)
  const debouncedFilters = useDebounce(filters, 400);

  const performSearch = useCallback(async (filtersToUse: Filter[], pageToUse: number) => {
    setLoading(true);
    try {
      const activeFilters = filtersToUse.filter((f) => f.value.trim().length > 0);
      const res = await fetch("/api/suppliers/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filters: activeFilters, page: pageToUse }),
      });
      if (!res.ok) {
        setSuppliers([]);
        setCount(0);
        return;
      }
      const data = await res.json();
      setSuppliers(data.suppliers || []);
      setCount(data.count || 0);
      setTotalPages(data.totalPages || 1);
    } catch {
      setSuppliers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Track if filters were ever touched (to avoid re-fetching on mount)
  const filtersFingerprint = useMemo(() => JSON.stringify(debouncedFilters), [debouncedFilters]);
  const [initialFingerprint] = useState(() => JSON.stringify(filters));

  useEffect(() => {
    if (filtersFingerprint === initialFingerprint) return;
    setPage(1);
    performSearch(debouncedFilters, 1);
  }, [filtersFingerprint, initialFingerprint, debouncedFilters, performSearch]);

  const updateFilter = (index: number, key: "field" | "value", val: string) => {
    setFilters((prev) => prev.map((f, i) => (i === index ? { ...f, [key]: val } : f)));
  };

  const clearAll = () => {
    setFilters([
      { field: "company_name", value: "" },
      { field: "email", value: "" },
      { field: "product_type", value: "" },
    ]);
  };

  const hasActiveFilters = filters.some((f) => f.value.trim().length > 0);

  const goToPage = (newPage: number) => {
    setPage(newPage);
    performSearch(debouncedFilters, newPage);
  };

  return (
    <>
      {/* Advanced search panel */}
      <div className="card mb-3.5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-[13px] font-semibold text-text-primary">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent" aria-hidden>
              <circle cx="10" cy="10" r="7" />
              <line x1="21" y1="21" x2="15" y2="15" />
            </svg>
            Advanced Search
          </div>
          {hasActiveFilters && (
            <button onClick={clearAll} className="text-[11px] text-text-muted hover:text-red font-medium transition-colors">
              Clear all
            </button>
          )}
        </div>

        <div className="space-y-2">
          {filters.map((filter, index) => (
            <div key={index} className="flex gap-2 items-center">
              <div className="text-[10px] text-text-muted font-bold w-4 text-center">{index + 1}</div>
              <select
                value={filter.field}
                onChange={(e) => updateFilter(index, "field", e.target.value)}
                className="bg-bg-elevated border-0 rounded-ios px-3 py-2 text-[13px] font-medium text-text-primary outline-none focus:bg-white focus:ring-2 focus:ring-accent/15 transition-all min-w-[160px] cursor-pointer"
              >
                {FIELD_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={filter.value}
                  onChange={(e) => updateFilter(index, "value", e.target.value)}
                  placeholder={`Search by ${FIELD_OPTIONS.find((o) => o.value === filter.field)?.label.toLowerCase() || "field"}...`}
                  className="w-full bg-bg-elevated border-0 rounded-ios px-3 py-2 text-[13px] outline-none focus:bg-white focus:ring-2 focus:ring-accent/15 transition-all"
                />
                {filter.value && (
                  <button
                    onClick={() => updateFilter(index, "value", "")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full hover:bg-bg-active flex items-center justify-center"
                    title="Clear"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="text-text-muted" aria-hidden>
                      <line x1="6" y1="6" x2="18" y2="18" />
                      <line x1="18" y1="6" x2="6" y2="18" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {hasActiveFilters && (
          <div className="mt-3 pt-3 border-t border-border flex items-center gap-2">
            <span className="text-[11px] text-text-muted">
              {loading ? (
                <span className="flex items-center gap-1.5">
                  <span className="inline-block w-2 h-2 bg-accent rounded-full animate-pulse" />
                  Searching...
                </span>
              ) : (
                <>Showing {count.toLocaleString()} {count === 1 ? "result" : "results"} · All conditions must match (AND)</>
              )}
            </span>
          </div>
        )}
      </div>

      {/* Results table */}
      <div className="panel">
        <table className="ios-table">
          <thead>
            <tr className="border-b border-border">
              <th>Company</th>
              <th>Contact</th>
              <th>Country</th>
              <th>Approved</th>
              <th>Status</th>
              <th className="w-12"></th>
            </tr>
          </thead>
          <tbody>
            {suppliers.length === 0 && !loading && (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-14 h-14 bg-green-soft rounded-full flex items-center justify-center">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-icon" aria-hidden>
                        <circle cx="12" cy="12" r="9" />
                        <path d="M9 12l2 2l4 -4" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-[14px] font-medium text-text-secondary">
                        {hasActiveFilters ? "No suppliers match your search" : "No approved suppliers yet"}
                      </p>
                      <p className="text-[12px] text-text-muted mt-0.5">
                        {hasActiveFilters ? "Try removing some filters" : "Approved suppliers will appear here after completing all stages"}
                      </p>
                    </div>
                  </div>
                </td>
              </tr>
            )}
            {suppliers.map((s) => (
              <tr key={s.id} className={s.open_follow_ups && s.open_follow_ups > 0 ? "bg-red-soft/30" : ""}>
                <td>
                  <Link href={`/suppliers/${s.id}`} className="flex items-center gap-3 -m-1 p-1">
                    <div className={`avatar ${s.open_follow_ups && s.open_follow_ups > 0 ? "bg-red-soft text-red-text animate-pulse-strong" : "bg-green-soft text-green-text"}`}>
                      {(s.company_name || s.reference_code).charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-medium text-[14px] text-text-primary flex items-center gap-2">
                        {s.company_name || s.reference_code}
                        {s.open_follow_ups && s.open_follow_ups > 0 ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-red text-white text-[10px] font-bold rounded-full animate-pulse-strong">
                            <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping-dot" />
                            {s.open_follow_ups} follow-up{s.open_follow_ups !== 1 ? "s" : ""}
                          </span>
                        ) : null}
                      </div>
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
                <td>
                  <DeleteSupplierButton
                    supplierId={s.id}
                    supplierName={s.company_name || s.reference_code}
                    variant="icon"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {suppliers.length > 0 && totalPages > 1 && (
          <div className="px-4 py-3 border-t border-border flex justify-between items-center">
            <div className="text-[12px] text-text-muted">
              Showing <strong className="text-text-primary">{(page - 1) * 25 + 1}–{Math.min(page * 25, count)}</strong> of <strong className="text-text-primary">{count.toLocaleString()}</strong>
            </div>
            <div className="flex gap-1.5">
              {page > 1 && <button onClick={() => goToPage(page - 1)} className="btn btn-secondary text-[12px] px-3 py-1.5">←</button>}
              <span className="text-[12px] text-text-secondary px-3 py-1.5">Page {page} of {totalPages}</span>
              {page < totalPages && <button onClick={() => goToPage(page + 1)} className="btn btn-secondary text-[12px] px-3 py-1.5">→</button>}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
