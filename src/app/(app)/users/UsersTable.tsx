"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function UsersTable({ initialUsers, currentUserId }: { initialUsers: any[]; currentUserId: string }) {
  const router = useRouter();
  const [showAdd, setShowAdd] = useState(false);
  const [createdResult, setCreatedResult] = useState<{ email: string; temp_password: string } | null>(null);
  const [form, setForm] = useState({ email: "", full_name: "", role: "employee" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function add() {
    setLoading(true); setError("");
    const res = await fetch("/api/users", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error || "Failed"); return; }
    setCreatedResult({ email: data.email, temp_password: data.temp_password });
    setShowAdd(false);
    setForm({ email: "", full_name: "", role: "employee" });
    router.refresh();
  }

  async function toggle(id: string, isActive: boolean) {
    if (!confirm(isActive ? "Disable this user?" : "Enable this user?")) return;
    await fetch(`/api/users/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !isActive }),
    });
    router.refresh();
  }

  return (
    <>
      <div className="panel">
        <div className="px-4 py-2.5 border-b border-border flex justify-end">
          <button onClick={() => setShowAdd(true)} className="btn btn-primary"><i className="ti ti-plus" aria-hidden /> Add User</button>
        </div>
        <table className="w-full text-xs">
          <thead className="bg-bg-base">
            <tr>
              <th className="text-left px-4 py-2 text-[10.5px] text-text-muted font-medium border-b border-border">Name</th>
              <th className="text-left px-3 py-2 text-[10.5px] text-text-muted font-medium border-b border-border">Email</th>
              <th className="text-left px-3 py-2 text-[10.5px] text-text-muted font-medium border-b border-border">Role</th>
              <th className="text-left px-3 py-2 text-[10.5px] text-text-muted font-medium border-b border-border">2FA</th>
              <th className="text-left px-3 py-2 text-[10.5px] text-text-muted font-medium border-b border-border">Status</th>
              <th className="px-3 py-2 border-b border-border w-20"></th>
            </tr>
          </thead>
          <tbody>
            {initialUsers.map((u) => (
              <tr key={u.id} className="border-b border-border last:border-0 hover:bg-bg-elevated">
                <td className="px-4 py-2.5 font-medium">{u.full_name}{u.id === currentUserId && <span className="ml-1.5 text-accent text-[10px]">(You)</span>}</td>
                <td className="px-3 py-2.5 font-mono text-[11px] text-text-secondary">{u.email}</td>
                <td className="px-3 py-2.5"><span className={`stage-tag ${u.role === "admin" ? "!bg-blue-50 !text-blue-700" : ""}`}>{u.role.toUpperCase()}</span></td>
                <td className="px-3 py-2.5 text-text-muted">{u.totp_enabled ? "✓ Enabled" : "Pending"}</td>
                <td className="px-3 py-2.5">
                  <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium ${u.is_active ? "bg-green-soft text-green-text" : "bg-red-soft text-red-text"}`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-current" />
                    {u.is_active ? "Active" : "Disabled"}
                  </span>
                </td>
                <td className="px-3 py-2.5 text-right">
                  {u.id !== currentUserId && (
                    <button onClick={() => toggle(u.id, u.is_active)} className="text-text-muted hover:text-text-primary text-xs">
                      {u.is_active ? "Disable" : "Enable"}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-black/45 flex items-center justify-center z-50 p-6" onClick={() => setShowAdd(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-lg font-semibold tracking-tight">Add New User</h2>
                <p className="text-xs text-text-muted">Invite a team member</p>
              </div>
              <button onClick={() => setShowAdd(false)} className="text-text-muted"><i className="ti ti-x" aria-hidden /></button>
            </div>

            {error && <div className="mb-3 text-xs text-red-text bg-red-soft rounded-md px-3 py-2">{error}</div>}

            <div className="space-y-3">
              <div><label className="label">Full Name</label>
                <input className="input" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} placeholder="Maya Cohen" /></div>
              <div><label className="label">Email Address</label>
                <input className="input font-mono" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="maya@ykl.asia" /></div>
              <div>
                <label className="label">Role</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { v: "employee", label: "Employee", desc: "Can claim and complete tasks" },
                    { v: "admin", label: "Admin", desc: "Full access to all features" },
                  ].map((opt) => (
                    <label key={opt.v} className={`cursor-pointer p-2.5 rounded-lg border ${form.role === opt.v ? "border-accent bg-accent-soft/30 shadow-[0_0_0_1px_#eef0ff]" : "border-border-strong"}`}>
                      <input type="radio" name="role" checked={form.role === opt.v} onChange={() => setForm({ ...form, role: opt.v })} className="sr-only" />
                      <div className={`text-xs font-semibold mb-0.5 ${form.role === opt.v ? "text-accent" : "text-text-primary"}`}>{opt.label}</div>
                      <div className="text-[11px] text-text-muted">{opt.desc}</div>
                    </label>
                  ))}
                </div>
              </div>
              <div className="bg-accent-soft/30 border border-accent-soft rounded-md px-3 py-2 text-[11px] text-text-secondary flex gap-2">
                <i className="ti ti-shield-check text-accent flex-shrink-0 mt-0.5" aria-hidden />
                <span>User will set up 2FA on first login. A temporary password will be generated and shown to you.</span>
              </div>
            </div>

            <div className="flex gap-2 justify-end mt-5">
              <button onClick={() => setShowAdd(false)} className="btn btn-secondary">Cancel</button>
              <button onClick={add} disabled={loading || !form.email || !form.full_name} className="btn btn-primary">
                {loading ? "..." : <><i className="ti ti-send" aria-hidden /> Create User</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {createdResult && (
        <div className="fixed inset-0 bg-black/45 flex items-center justify-center z-50 p-6">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <div className="w-12 h-12 bg-green-soft rounded-full flex items-center justify-center mx-auto mb-3">
              <i className="ti ti-check text-2xl text-green-text" aria-hidden />
            </div>
            <h2 className="text-lg font-semibold text-center mb-2">User Created</h2>
            <p className="text-xs text-text-muted text-center mb-4">Share these credentials securely with the user. They&apos;ll set up 2FA on first login.</p>
            <div className="bg-bg-base border border-border rounded-md p-3 mb-3 space-y-2">
              <div><div className="text-[10.5px] text-text-muted uppercase">Email</div><div className="font-mono text-xs">{createdResult.email}</div></div>
              <div><div className="text-[10.5px] text-text-muted uppercase">Temporary Password</div><div className="font-mono text-xs select-all">{createdResult.temp_password}</div></div>
            </div>
            <button onClick={() => setCreatedResult(null)} className="btn btn-primary w-full justify-center">Done</button>
          </div>
        </div>
      )}
    </>
  );
}
