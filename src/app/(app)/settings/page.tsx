import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase-server";
import { SettingsForm } from "./SettingsForm";

export default async function Settings() {
  await requireAdmin();
  const supabase = createClient();
  const { data: settings } = await supabase.from("settings").select("*").single();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "https://your-app.vercel.app";

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-2xl font-semibold tracking-tight text-text-primary mb-0.5">Settings</h1>
        <p className="text-xs text-text-muted">Configure system preferences</p>
      </div>
      <div className="max-w-[600px]">
        <div className="card mb-3">
          <div className="text-sm font-semibold mb-3 pb-2 border-b border-border flex items-center gap-2">
            <i className="ti ti-link text-accent" aria-hidden /> Form Links (share manually with suppliers)
          </div>
          {[1, 2, 3].map((n) => (
            <div key={n} className="mb-2.5">
              <label className="label">Stage {n} Form URL</label>
              <input className="input bg-bg-elevated font-mono text-[11px]" readOnly value={`${appUrl}/forms/stage-${n}`} />
            </div>
          ))}
        </div>

        <SettingsForm initialSettings={settings} />
      </div>
    </div>
  );
}
