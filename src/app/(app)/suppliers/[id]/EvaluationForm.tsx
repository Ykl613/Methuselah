"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function EvaluationForm({ supplier, settings }: any) {
  const router = useRouter();
  const [form, setForm] = useState({
    quality_rating: supplier.quality_rating || "",
    reliability_score: supplier.reliability_score || "",
    pricing_tier: supplier.pricing_tier || "",
    communication: supplier.communication || "",
  });
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const labels = settings ? [settings.evaluation_field_1, settings.evaluation_field_2, settings.evaluation_field_3, settings.evaluation_field_4] : ["Quality Rating", "Reliability Score", "Pricing Tier", "Communication"];
  const keys: (keyof typeof form)[] = ["quality_rating", "reliability_score", "pricing_tier", "communication"];

  async function save() {
    setLoading(true);
    setSaved(false);
    const res = await fetch(`/api/supplier/${supplier.id}/evaluation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setLoading(false);
    if (res.ok) {
      setSaved(true);
      router.refresh();
      setTimeout(() => setSaved(false), 2000);
    } else {
      const d = await res.json();
      alert(d.error || "Failed");
    }
  }

  return (
    <div className="card mb-3">
      <div className="text-sm font-semibold mb-3 pb-2 border-b border-border flex items-center justify-between gap-2">
        <span className="flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent" aria-hidden>
            <path d="M12 3l8 4.5v9l-8 4.5l-8 -4.5v-9l8 -4.5" />
            <path d="M12 12l8 -4.5" />
            <path d="M12 12l0 9" />
            <path d="M12 12l-8 -4.5" />
          </svg>
          Internal Evaluation
        </span>
        <span className="text-[10px] uppercase tracking-wider text-text-muted font-medium">Admin only</span>
      </div>

      <p className="text-[11px] text-text-muted mb-3 -mt-1">Fill in manually based on your assessment of the supplier</p>

      <div className="grid grid-cols-2 gap-3 mb-3">
        {keys.map((key, i) => (
          <div key={key}>
            <label className="label">{labels[i]}</label>
            <input
              className="input"
              value={form[key]}
              onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              placeholder="—"
            />
          </div>
        ))}
      </div>

      <button onClick={save} disabled={loading} className="btn btn-primary w-full justify-center py-2.5">
        {loading ? (
          "Saving..."
        ) : saved ? (
          <>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M5 12l5 5l10 -10" />
            </svg>
            Saved
          </>
        ) : (
          "Save Evaluation"
        )}
      </button>
    </div>
  );
}
