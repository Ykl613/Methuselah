"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/Logo";

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<"credentials" | "totp">("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleCredentials(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setLoading(true);
    const res = await fetch("/api/login", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error || "Login failed"); return; }
    // 2FA temporarily disabled - log in directly
    if (data.bypass2FA) { router.push(data.redirect || "/"); router.refresh(); return; }
    if (data.requires2FASetup) { router.push("/setup-2fa"); return; }
    setStep("totp");
  }

  async function handleTotp(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setLoading(true);
    const res = await fetch("/api/verify-2fa", {
      method: "POST", headers: { "Content-Type": "application/json" },
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
      <div className="w-full max-w-sm bg-white rounded-ios-xl p-8 shadow-sm border border-border">
        <div className="text-center mb-7">
          <div className="mx-auto mb-4 w-12 h-12"><Logo size={48} /></div>
          <h1 className="text-[24px] font-semibold text-text-primary tracking-[-0.5px]">Methuselah</h1>
          <p className="text-[13px] text-text-muted mt-1.5">
            {step === "credentials" ? "Sign in to continue" : "Two-factor authentication"}
          </p>
        </div>

        {error && (
          <div className="mb-4 text-[12px] text-red-text bg-red-soft rounded-ios px-3.5 py-2.5">{error}</div>
        )}

        {step === "credentials" ? (
          <form onSubmit={handleCredentials} className="space-y-3.5">
            <div>
              <label className="label">Email</label>
              <input className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <label className="label">Password</label>
              <input className="input" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <button className="btn btn-primary w-full justify-center py-3 text-[14px] font-semibold mt-2" disabled={loading}>
              {loading ? "Signing in..." : "Sign in"} <i className="ti ti-arrow-right" aria-hidden />
            </button>
          </form>
        ) : (
          <form onSubmit={handleTotp} className="space-y-3.5">
            <p className="text-[13px] text-text-secondary">Enter the 6-digit code from your authenticator app.</p>
            <input className="input text-center tracking-[0.4em] font-mono text-lg" maxLength={6} pattern="[0-9]{6}" required
              value={token} onChange={(e) => setToken(e.target.value.replace(/\D/g, ""))} autoFocus />
            <button className="btn btn-primary w-full justify-center py-3 text-[14px] font-semibold" disabled={loading}>
              {loading ? "Verifying..." : "Verify"}
            </button>
            <button type="button" onClick={() => { setStep("credentials"); setToken(""); }}
              className="block w-full text-center text-[12px] text-text-muted hover:text-text-primary">← Back</button>
          </form>
        )}

        <div className="text-center mt-5 text-[11px] text-text-muted flex items-center justify-center gap-1.5">
          <i className="ti ti-shield-check" aria-hidden /> Secure connection
        </div>
      </div>
    </div>
  );
}
