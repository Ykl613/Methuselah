"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const STAGE_KEYS = ["stage_1", "stage_2", "stage_3", "stage_4", "stage_5"] as const;

export function StagesPanel({ supplier, tasks, settings, userId, userRole }: any) {
  const router = useRouter();
  const [loadingStage, setLoadingStage] = useState<string | null>(null);

  // APPROVED: Show only the success message, hide all stage details
  if (supplier.status === "approved") {
    return (
      <div className="card border-green-soft shadow-[0_0_0_1px_#dcfce7]">
        <div className="p-2 bg-green-soft border border-green-soft rounded-md text-sm text-green-text font-medium flex items-center gap-2.5">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M5 12l5 5l10 -10" />
          </svg>
          Supplier has completed all 5 stages and is approved for ordering.
        </div>
      </div>
    );
  }

  if (supplier.current_stage === "form_1" || supplier.current_stage === "form_2" || supplier.current_stage === "form_3") {
    return (
      <div className="card border-accent-soft shadow-[0_0_0_1px_#eef0ff]">
        <div className="text-sm font-semibold mb-3 pb-2 border-b border-border flex items-center gap-2">
          <i className="ti ti-list-check text-accent" aria-hidden /> Onboarding Progress
        </div>
        <div className="text-xs text-text-secondary">
          The supplier is still completing the public forms. The 5 onboarding stages will be created automatically after Form 3 is submitted.
        </div>
      </div>
    );
  }

  const stageNames = settings ? [settings.stage_1_name, settings.stage_2_name, settings.stage_3_name, settings.stage_4_name, settings.stage_5_name] : ["Document Review", "Quality Assessment", "Management Approval", "Contract Signing", "System Onboarding"];

  const tasksByStage: Record<string, any> = {};
  tasks.forEach((t: any) => { tasksByStage[t.stage] = t; });

  async function claim(stage: string) {
    setLoadingStage(stage);
    const res = await fetch(`/api/tasks/${tasksByStage[stage].id}/claim`, { method: "POST" });
    setLoadingStage(null);
    if (res.ok) router.refresh();
    else { const d = await res.json(); alert(d.error || "Failed"); }
  }

  async function complete(stage: string) {
    setLoadingStage(stage);
    const res = await fetch(`/api/tasks/${tasksByStage[stage].id}/complete`, { method: "POST" });
    setLoadingStage(null);
    if (res.ok) router.refresh();
    else { const d = await res.json(); alert(d.error || "Failed"); }
  }

  let foundActive = false;
  return (
    <div className="card border-accent-soft shadow-[0_0_0_1px_#eef0ff]">
      <div className="text-sm font-semibold mb-3 pb-2 border-b border-border flex items-center justify-between">
        <span className="flex items-center gap-2"><i className="ti ti-list-check text-accent" aria-hidden /> Onboarding Progress</span>
        <span className="text-[11px] text-text-muted font-medium">{tasks.filter((t: any) => t.status === "completed").length} of 5 completed</span>
      </div>

      <div className="space-y-2">
        {STAGE_KEYS.map((stage, i) => {
          const task = tasksByStage[stage];
          if (!task) return null;
          const isCompleted = task.status === "completed";
          const isClaimed = task.status === "in_progress";
          const isLocked = !isCompleted && !isClaimed && foundActive;
          if (!isCompleted && !isLocked) foundActive = true;

          let bg = "bg-bg-base", border = "border-border", num = `0${i + 1}`;
          let circle = "bg-bg-elevated border-border-strong text-text-muted";
          if (isCompleted) { bg = "bg-green-soft/30"; border = "border-green-soft"; circle = "bg-green text-white"; }
          else if (isClaimed) { bg = "bg-amber-soft/30"; border = "border-amber-soft shadow-[0_0_0_1px_#fef3c7]"; circle = "bg-amber text-white"; }

          const claimedByName = task.claimed_by_user?.full_name;
          const completedByName = task.completed_by_user?.full_name;
          const canClaim = !isCompleted && !isClaimed && !isLocked;
          const canComplete = isClaimed && (task.claimed_by === userId || userRole === "admin");

          return (
            <div key={stage} className={`flex items-center gap-3 p-2.5 rounded-lg border ${bg} ${border} ${isLocked ? "opacity-60" : ""}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${circle}`}>
                {isCompleted ? <i className="ti ti-check text-sm" aria-hidden /> : <span className="text-xs font-bold font-mono">{num}</span>}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold">Stage {i + 1} · {stageNames[i]}</div>
                <div className="text-[11px] text-text-muted">
                  {isCompleted && completedByName && <>Completed by <strong className="text-text-primary">{completedByName}</strong> · {new Date(task.completed_at).toLocaleString()}</>}
                  {isClaimed && claimedByName && <>Claimed by <strong className="text-text-primary">{claimedByName}</strong> · ongoing since {new Date(task.claimed_at).toLocaleString()}</>}
                  {!isCompleted && !isClaimed && !isLocked && <>Available to claim</>}
                  {isLocked && <>Locked · Will open after previous stage completes</>}
                </div>
              </div>
              <div className="flex-shrink-0">
                {canClaim && (
                  <button onClick={() => claim(stage)} disabled={loadingStage === stage} className="btn btn-secondary text-[11px]">
                    {loadingStage === stage ? "..." : "Claim"}
                  </button>
                )}
                {canComplete && (
                  <button onClick={() => complete(stage)} disabled={loadingStage === stage} className="btn btn-success text-[11px]">
                    <i className="ti ti-check" aria-hidden /> {loadingStage === stage ? "..." : "Mark Complete"}
                  </button>
                )}
                {isCompleted && <span className="text-[11px] text-green-text font-semibold">✓ Done</span>}
                {isLocked && <span className="text-[11px] text-text-subtle">Locked</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
