"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface FollowUpTask {
  id: string;
  title: string;
  status: "open" | "completed";
  created_at: string;
  created_by_label: string | null;
  completed_at: string | null;
}

interface FollowUpTasksPanelProps {
  supplierId: string;
  tasks: FollowUpTask[];
}

export function FollowUpTasksPanel({ supplierId, tasks: initialTasks }: FollowUpTasksPanelProps) {
  const router = useRouter();
  const [tasks, setTasks] = useState(initialTasks);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);
  const [completingId, setCompletingId] = useState<string | null>(null);

  const openTasks = tasks.filter((t) => t.status === "open");
  const completedTasks = tasks.filter((t) => t.status === "completed");

  const addTask = async () => {
    if (!newTitle.trim() || loading) return;
    setLoading(true);
    try {
      const res = await fetch("/api/follow-up-tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ supplier_id: supplierId, title: newTitle.trim() }),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Failed to add task");
        setLoading(false);
        return;
      }
      const { task } = await res.json();
      setTasks([task, ...tasks]);
      setNewTitle("");
      setShowAddForm(false);
      router.refresh();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  const completeTask = async (id: string) => {
    setCompletingId(id);
    try {
      const res = await fetch(`/api/follow-up-tasks/${id}`, { method: "PATCH" });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Failed");
        setCompletingId(null);
        return;
      }
      setTasks(tasks.map((t) => (t.id === id ? { ...t, status: "completed" as const, completed_at: new Date().toISOString() } : t)));
      router.refresh();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setCompletingId(null);
    }
  };

  const deleteTask = async (id: string) => {
    if (!confirm("Delete this task?")) return;
    try {
      const res = await fetch(`/api/follow-up-tasks/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Failed");
        return;
      }
      setTasks(tasks.filter((t) => t.id !== id));
      router.refresh();
    } catch (e: any) {
      alert(e.message);
    }
  };

  return (
    <div className="card mb-3">
      <div className="text-sm font-semibold mb-3 pb-2 border-b border-border flex items-center justify-between gap-2">
        <span className="flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red" aria-hidden>
            <path d="M5 7l5 5l-5 5" />
            <path d="M13 17l6 0" />
          </svg>
          Follow-up Tasks
          {openTasks.length > 0 && (
            <span className="ml-1 px-2 py-0.5 bg-red-soft text-red-text text-[10px] font-bold rounded-full">
              {openTasks.length} open
            </span>
          )}
        </span>
        {!showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            className="text-[12px] text-accent font-semibold hover:text-accent-hover flex items-center gap-1"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
              <path d="M12 5v14M5 12h14" />
            </svg>
            Add task
          </button>
        )}
      </div>

      {/* Add new task form */}
      {showAddForm && (
        <div className="mb-3 bg-bg-elevated rounded-ios p-3 border border-border">
          <input
            type="text"
            autoFocus
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") addTask();
              if (e.key === "Escape") { setShowAddForm(false); setNewTitle(""); }
            }}
            placeholder="e.g. Call supplier tomorrow about pricing"
            maxLength={200}
            className="w-full bg-white border-0 rounded-ios px-3 py-2 text-[13px] outline-none focus:ring-2 focus:ring-accent/15 mb-2"
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => { setShowAddForm(false); setNewTitle(""); }}
              disabled={loading}
              className="btn btn-secondary text-[12px] py-1.5"
            >
              Cancel
            </button>
            <button
              onClick={addTask}
              disabled={loading || !newTitle.trim()}
              className="btn btn-primary text-[12px] py-1.5"
            >
              {loading ? "Adding..." : "Add task"}
            </button>
          </div>
        </div>
      )}

      {/* Open tasks */}
      {openTasks.length === 0 && !showAddForm && (
        <div className="text-[12px] text-text-muted text-center py-3">
          No open follow-up tasks
        </div>
      )}

      {openTasks.map((task) => (
        <div
          key={task.id}
          className="flex items-start gap-2.5 py-2.5 px-3 mb-1.5 bg-red-soft/40 border border-red/20 rounded-ios animate-pulse-soft group"
        >
          <button
            onClick={() => completeTask(task.id)}
            disabled={completingId === task.id}
            title="Mark complete"
            className="w-5 h-5 rounded-full border-2 border-red hover:bg-red hover:border-red flex items-center justify-center transition-all flex-shrink-0 mt-0.5 group/check"
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-white opacity-0 group-hover/check:opacity-100" aria-hidden>
              <path d="M5 12l5 5l10 -10" />
            </svg>
          </button>
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-medium text-text-primary break-words">{task.title}</div>
            <div className="text-[10px] text-text-muted mt-0.5">
              Added {new Date(task.created_at).toLocaleDateString()} {task.created_by_label ? `by ${task.created_by_label}` : ""}
            </div>
          </div>
          <button
            onClick={() => deleteTask(task.id)}
            title="Delete"
            className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded hover:bg-red-soft flex items-center justify-center transition-opacity flex-shrink-0"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-text-muted hover:text-red" aria-hidden>
              <path d="M4 7l16 0" />
              <path d="M10 11l0 6" />
              <path d="M14 11l0 6" />
              <path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12" />
              <path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3" />
            </svg>
          </button>
        </div>
      ))}

      {/* Completed tasks (collapsible) */}
      {completedTasks.length > 0 && (
        <div className="mt-3 pt-3 border-t border-border">
          <button
            onClick={() => setShowCompleted(!showCompleted)}
            className="text-[11px] text-text-muted hover:text-text-primary font-medium flex items-center gap-1.5"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform ${showCompleted ? "rotate-90" : ""}`} aria-hidden>
              <path d="M9 6l6 6l-6 6" />
            </svg>
            {showCompleted ? "Hide" : "Show"} {completedTasks.length} completed
          </button>
          {showCompleted && (
            <div className="mt-2 space-y-1">
              {completedTasks.map((task) => (
                <div key={task.id} className="flex items-start gap-2.5 py-1.5 px-3 rounded-ios text-text-muted">
                  <div className="w-5 h-5 rounded-full bg-green-soft flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-green" aria-hidden>
                      <path d="M5 12l5 5l10 -10" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] line-through break-words">{task.title}</div>
                    <div className="text-[10px] mt-0.5">
                      Completed {task.completed_at ? new Date(task.completed_at).toLocaleDateString() : ""}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
