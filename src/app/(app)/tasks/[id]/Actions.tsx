"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function TaskDetailActions({ task, userId }: { task: any; userId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function claim() {
    setLoading(true);
    const res = await fetch(`/api/tasks/${task.id}/claim`, { method: "POST" });
    setLoading(false);
    if (res.ok) router.refresh();
    else { const d = await res.json(); alert(d.error || "Failed"); }
  }

  async function complete() {
    if (!confirm("Mark this task as complete? This will unlock the next stage.")) return;
    setLoading(true);
    const res = await fetch(`/api/tasks/${task.id}/complete`, { method: "POST" });
    setLoading(false);
    if (res.ok) router.push("/my-tasks");
    else { const d = await res.json(); alert(d.error || "Failed"); }
  }

  if (task.status === "open") {
    return <button onClick={claim} disabled={loading} className="btn btn-primary">{loading ? "..." : "Claim Task →"}</button>;
  }
  if (task.status === "in_progress" && task.claimed_by === userId) {
    return <button onClick={complete} disabled={loading} className="btn btn-success"><i className="ti ti-check" aria-hidden /> {loading ? "..." : "Mark Complete"}</button>;
  }
  return null;
}
