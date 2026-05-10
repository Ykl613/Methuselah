"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/Logo";

const TRANSLATIONS = {
  en: {
    title: "Welcome, Future Partner", intro: "Please share your contact information to begin.",
    name: "Contact Name", email: "Email Address", phone: "Phone Number", company: "Company Name",
    submit: "Submit Application", footer: "Encrypted · Response within 5 business days",
  },
  zh: {
    title: "欢迎,未来的合作伙伴", intro: "请提供您的联系信息以开始。",
    name: "联系人姓名", email: "电子邮件地址", phone: "电话号码", company: "公司名称",
    submit: "提交申请", footer: "数据加密 · 5个工作日内回复",
  },
};

export default function Stage1() {
  const router = useRouter();
  const [lang, setLang] = useState<"en" | "zh">("en");
  const [form, setForm] = useState({ contact_name: "", email: "", phone: "", company_name: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const t = TRANSLATIONS[lang];

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError("");
    const res = await fetch("/api/forms/stage-1", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      if (data.code === "EMAIL_EXISTS") { router.push("/forms/blocked"); return; }
      setError(data.error || "Submission failed"); return;
    }
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
          <div><label className="label">{t.name}</label>
            <input className="input" required value={form.contact_name} onChange={(e) => setForm({ ...form, contact_name: e.target.value })} /></div>
          <div><label className="label">{t.email}</label>
            <input className="input" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          <div><label className="label">{t.phone}</label>
            <input className="input" type="tel" required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
          <div><label className="label">{t.company}</label>
            <input className="input" required value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} /></div>
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
