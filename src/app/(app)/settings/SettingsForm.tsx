"use client";
import { useState } from "react";

export function SettingsForm({ initialSettings }: { initialSettings: any }) {
  const [s, setS] = useState(initialSettings || {});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save() {
    setSaving(true); setSaved(false);
    const res = await fetch("/api/settings", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(s),
    });
    setSaving(false);
    if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 2000); }
    else { const d = await res.json(); alert(d.error || "Failed"); }
  }

  return (
    <>
      <div className="card mb-3">
        <div className="text-sm font-semibold mb-2 flex items-center gap-2"><i className="ti ti-shield-check text-accent" aria-hidden /> Internal Evaluation Fields</div>
        <p className="text-[11px] text-text-muted pb-2 mb-3 border-b border-border">Customize the 4 evaluation fields you fill in for each supplier.</p>
        <div className="grid grid-cols-2 gap-2.5">
          {[1, 2, 3, 4].map((n) => (
            <div key={n}>
              <label className="label">Field {n}</label>
              <input className="input" value={s[`evaluation_field_${n}`] || ""} onChange={(e) => setS({ ...s, [`evaluation_field_${n}`]: e.target.value })} />
            </div>
          ))}
        </div>
      </div>

      <div className="card mb-3">
        <div className="text-sm font-semibold mb-2 flex items-center gap-2"><i className="ti ti-list-check text-accent" aria-hidden /> Onboarding Stages</div>
        <p className="text-[11px] text-text-muted pb-2 mb-3 border-b border-border">5 stages every supplier goes through after submitting all forms.</p>
        {[1, 2, 3, 4, 5].map((n) => (
          <div key={n} className="mb-2 flex gap-2.5 items-center">
            <span className="bg-accent-soft text-accent w-7 h-7 rounded-md flex items-center justify-center text-[11px] font-bold font-mono flex-shrink-0">0{n}</span>
            <input className="input flex-1" value={s[`stage_${n}_name`] || ""} onChange={(e) => setS({ ...s, [`stage_${n}_name`]: e.target.value })} />
          </div>
        ))}
      </div>

      <button onClick={save} disabled={saving} className="btn btn-primary">
        {saving ? "Saving..." : saved ? "✓ Saved" : "Save All Changes"}
      </button>
    </>
  );
}
