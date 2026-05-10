"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/Logo";

export default function Setup2FA() {
  const router = useRouter();
  const [qr, setQr] = useState<string>("");
  const [secret, setSecret] = useState<string>("");
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/setup-2fa", { method: "POST" })
      .then((r) => r.json())
      .then((d) => { if (d.qr) { setQr(d.qr); setSecret(d.secret); } else { setError(d.error || "Failed"); } });
  }, []);

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError("");
    const res = await fetch("/api/setup-2fa", {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error || "Invalid code"); return; }
    router.push(data.redirect || "/");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-bg-base">
      <div className="w-full max-w-md bg-white border border-border rounded-2xl p-8 shadow-sm">
        <div className="text-center mb-5">
          <div className="mx-auto mb-3 w-10 h-10"><Logo size={40} /></div>
          <h1 className="text-lg font-semibold tracking-tight">Set up Two-Factor Authentication</h1>
          <p className="text-xs text-text-muted mt-1">Scan with Google Authenticator, Authy, or 1Password.</p>
        </div>

        {error && <div className="mb-4 text-xs text-red-text bg-red-soft rounded-md px-3 py-2">{error}</div>}

        {qr ? (
          <>
            <div className="flex justify-center mb-4">
              <img src={qr} alt="QR Code" className="w-48 h-48 border border-border rounded-md" />
            </div>
            <div className="text-[10px] text-text-muted text-center mb-4 font-mono break-all">{secret}</div>
            <form onSubmit={verify} className="space-y-3">
              <label className="label">Enter 6-digit code from your app</label>
              <input className="input text-center tracking-[0.4em] font-mono text-lg" maxLength={6} required
                value={token} onChange={(e) => setToken(e.target.value.replace(/\D/g, ""))} autoFocus />
              <button className="btn btn-primary w-full justify-center py-2.5 text-sm font-semibold" disabled={loading}>
                {loading ? "Verifying..." : "Confirm and finish"}
              </button>
            </form>
          </>
        ) : (
          <div className="text-center text-xs text-text-muted py-12">Loading...</div>
        )}
      </div>
    </div>
  );
}
