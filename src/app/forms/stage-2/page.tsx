"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/Logo";

const TRANSLATIONS = {
  en: {
    title: "Stage 2 — Business Details",
    intro: "Enter your email to continue with your application.",
    email: "Email Address", business: "Business Number", location: "Company Location", factory: "Factory Address",
    submit: "Continue", footer: "Encrypted · Response within 5 business days",
  },
  zh: {
    title: "第2阶段 — 业务详情",
    intro: "输入您的电子邮件以继续您的申请。",
    email: "电子邮件地址", business: "营业执照号", location: "公司地址", factory: "工厂地址",
    submit: "继续", footer: "数据加密 · 5个工作日内回复",
  },
};

export default function Stage2() {
  const router = useRouter();
  const [lang, setLang] = useState<"en" | "zh">("en");
  const [form, setForm] = useState({ email: "", business_number: "", company_location: "", factory_address: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const t = TRANSLATIONS[lang];

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError("");
    const res = await fetch("/api/forms/stage-2", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error || "Submission failed"); return; }
    router.push("/forms/success");
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-bg-base">
      <div className="w-full max-w-md bg-white border border-border rounded-2xl p-8 shadow-sm relative">
        <div className="absolute top-4 right-4 flex bg-bg-elevated p-0.5 rounded-md">
          {(["en", "zh"] as const).map((l) => (
            <button key={l} onClick={() => setLang(l)}
              className={`px-2.5 py-1 text-[11px] font-medium rounded ${lang === l ? "bg-white shadow-sm" : "text-text-muted"}`}>
              {l === "en" ? "EN" : "中文"}
            </button>
          ))}
        </div>

        <div className="text-center mb-5">
          <div className="mx-auto mb-2 w-9 h-9"><Logo size={36} /></div>
          <div className="text-base font-semibold tracking-tight">Methuselah</div>
        </div>

        <h2 className="text-xl font-semibold text-center text-text-primary tracking-tight mb-2">{t.title}</h2>
        <p className="text-center text-xs text-text-muted mb-6">{t.intro}</p>

        {error && <div className="mb-4 text-xs text-red-text bg-red-soft rounded-md px-3 py-2">{error}</div>}

        <form onSubmit={submit} className="space-y-3">
          <div><label className="label">{t.email}</label>
            <input className="input" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          <div><label className="label">{t.business}</label>
            <input className="input" required value={form.business_number} onChange={(e) => setForm({ ...form, business_number: e.target.value })} /></div>
          <div><label className="label">{t.location}</label>
            <input className="input" required value={form.company_location} onChange={(e) => setForm({ ...form, company_location: e.target.value })} /></div>
          <div><label className="label">{t.factory}</label>
            <input className="input" required value={form.factory_address} onChange={(e) => setForm({ ...form, factory_address: e.target.value })} /></div>
          <button className="btn btn-primary w-full justify-center py-2.5 text-sm font-semibold" disabled={loading}>
            {loading ? "..." : t.submit} <i className="ti ti-arrow-right" aria-hidden />
          </button>
        </form>

        <div className="text-center mt-4 text-[11px] text-text-muted flex items-center justify-center gap-1">
          <i className="ti ti-shield-check" aria-hidden /> {t.footer}
        </div>
      </div>
    </div>
  );
}
