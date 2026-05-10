"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function NotesPanel({ supplierId, notes }: { supplierId: string; notes: any[] }) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  async function add() {
    if (!content.trim()) return;
    setLoading(true);
    const res = await fetch("/api/notes", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ supplier_id: supplierId, content }),
    });
    setLoading(false);
    if (res.ok) { setContent(""); router.refresh(); }
    else { const d = await res.json(); alert(d.error || "Failed"); }
  }

  return (
    <div className="card">
      <div className="text-sm font-semibold mb-3 pb-2 border-b border-border flex items-center gap-2">
        <i className="ti ti-message-dots text-accent" aria-hidden /> Notes
        <span className="ml-auto bg-bg-elevated text-text-muted px-1.5 rounded text-[10px] font-semibold">{notes.length}</span>
      </div>

      <div className="space-y-2 mb-3">
        {notes.length === 0 && <div className="text-xs text-text-muted">No notes yet</div>}
        {notes.map((n: any) => (
          <div key={n.id} className="bg-bg-base border border-border rounded-md p-2.5">
            <div className="flex justify-between items-baseline mb-1">
              <div className="text-xs font-semibold">{n.author?.full_name || "—"}</div>
              <div className="text-[10.5px] text-text-muted">{new Date(n.created_at).toLocaleString()}</div>
            </div>
            <div className="text-xs text-text-secondary whitespace-pre-wrap">{n.content}</div>
          </div>
        ))}
      </div>

      <textarea className="input min-h-[60px] mb-2" value={content} onChange={(e) => setContent(e.target.value)} placeholder="Add a note..." />
      <button onClick={add} disabled={loading || !content.trim()} className="btn btn-secondary w-full justify-center">
        {loading ? "..." : "+ Add Note"}
      </button>
    </div>
  );
}
