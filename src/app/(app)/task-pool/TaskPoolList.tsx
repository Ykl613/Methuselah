"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export function TaskPoolList({ urgent, standard, mine }: { urgent: any[]; standard: any[]; mine: any[] }) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function claim(id: string) {
    setLoadingId(id);
    const res = await fetch(`/api/tasks/${id}/claim`, { method: "POST" });
    setLoadingId(null);
    if (res.ok) router.refresh();
    else { const d = await res.json(); alert(d.error || "Failed"); }
  }

  async function complete(id: string) {
    setLoadingId(id);
    const res = await fetch(`/api/tasks/${id}/complete`, { method: "POST" });
    setLoadingId(null);
    if (res.ok) router.refresh();
    else { const d = await res.json(); alert(d.error || "Failed"); }
  }

  const renderCard = (t: any, opts: { urgent?: boolean; mine?: boolean } = {}) => (
    <div key={t.id} className={`bg-white border rounded-lg px-3.5 py-3 mb-1.5 flex items-center gap-3 transition hover:translate-x-0.5 hover:border-border-strong ${
      opts.urgent ? "border-l-2 border-l-red" : opts.mine ? "border-l-2 border-l-green" : "border-border"
    }`}>
      {opts.urgent && (
        <span className="w-2 h-2 bg-red rounded-full flex-shrink-0 animate-pulse" style={{ boxShadow: "0 0 0 0 rgba(239, 68, 68, 0.5)" }} />
      )}
      <div className="flex-1 min-w-0">
        <Link href={`/tasks/${t.id}`} className="text-sm font-semibold text-text-primary hover:text-accent">
          {t.supplier?.country === "China" ? "🇨🇳 " : t.supplier?.country === "Israel" ? "🇮🇱 " : ""}{t.supplier?.company_name || "—"}
        </Link>
        <div className="text-[11px] text-text-muted flex items-center gap-1.5 flex-wrap mt-0.5">
          <span className="stage-tag">{t.stage.toUpperCase().replace("_", " ")}</span>
          {opts.mine ? <>· Started {new Date(t.claimed_at).toLocaleDateString()}</> : <>· Created {new Date(t.created_at).toLocaleDateString()}</>}
        </div>
      </div>
      {opts.mine ? (
        <button onClick={() => complete(t.id)} disabled={loadingId === t.id} className="btn btn-success">
          <i className="ti ti-check" aria-hidden /> {loadingId === t.id ? "..." : "Mark Complete"}
        </button>
      ) : (
        <button onClick={() => claim(t.id)} disabled={loadingId === t.id} className="btn btn-primary">
          {loadingId === t.id ? "..." : "Claim →"}
        </button>
      )}
    </div>
  );

  return (
    <>
      {urgent.length > 0 && (
        <>
          <div className="flex items-center gap-2 my-3">
            <div className="text-[11px] uppercase tracking-wider text-text-muted font-semibold flex items-center gap-1.5">
              <span className="text-red">●</span> Urgent — Awaiting Action
            </div>
            <div className="flex-1 h-px bg-border" />
          </div>
          {urgent.map((t) => renderCard(t, { urgent: true }))}
        </>
      )}

      {standard.length > 0 && (
        <>
          <div className="flex items-center gap-2 my-3">
            <div className="text-[11px] uppercase tracking-wider text-text-muted font-semibold">Standard Queue</div>
            <div className="flex-1 h-px bg-border" />
          </div>
          {standard.map((t) => renderCard(t))}
        </>
      )}

      {mine.length > 0 && (
        <>
          <div className="flex items-center gap-2 my-3">
            <div className="text-[11px] uppercase tracking-wider text-text-muted font-semibold">My Active Tasks</div>
            <div className="flex-1 h-px bg-border" />
          </div>
          {mine.map((t) => renderCard(t, { mine: true }))}
        </>
      )}

      {urgent.length === 0 && standard.length === 0 && mine.length === 0 && (
        <div className="card text-center py-12">
          <i className="ti ti-circle-check text-3xl text-text-muted opacity-50 mb-2" aria-hidden />
          <p className="text-sm text-text-muted">No tasks available right now.</p>
        </div>
      )}
    </>
  );
}
