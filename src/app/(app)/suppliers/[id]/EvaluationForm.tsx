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
    setLoading(true); setSaved(false);
    const res = await fetch(`/api/supplier/${supplier.id}/evaluation`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
    });
    setLoading(false);
    if (res.ok) { setSaved(true); router.refresh(); setTimeout(() => setSaved(false), 2000); }
    else { const d = await res.json(); alert(d.error || "Failed"); }
  }

  return (
    <div className="card mb-3">
      <div className="text-sm font-semibold mb-3 pb-2 border-b border-border flex items-center gap-2">
        <i className="ti ti-shield-check text-accent" aria-hidden /> Internal Evaluation
      </div>
      {keys.map((key, i) => (
        <div key={key} className="mb-2.5">
          <label className="label">{labels[i]}</label>
          <input className="input" value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} />
        </div>
      ))}
      <button onClick={save} disabled={loading} className="btn btn-primary w-full justify-center">
        {loading ? "Saving..." : saved ? "✓ Saved" : "Save Evaluation"}
      </button>
    </div>
  );
}
