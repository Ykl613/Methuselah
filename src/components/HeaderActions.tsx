"use client";
import Link from "next/link";
import { NotificationBell } from "./NotificationBell";

interface HeaderActionsProps {
  userId: string;
  showTasksButton?: boolean; // default: true (hide if you're already on the Tasks page)
}

export function HeaderActions({ userId, showTasksButton = true }: HeaderActionsProps) {
  return (
    <div className="flex gap-2.5 items-center">
      <NotificationBell userId={userId} />
      {showTasksButton && (
        <Link href="/in-progress" className="btn btn-primary">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M3 17l6 -6l4 4l8 -8" />
            <path d="M14 7l7 0l0 7" />
          </svg>
          Tasks
        </Link>
      )}
      <form action="/api/logout" method="post">
        <button
          type="submit"
          title="Sign out"
          className="w-10 h-10 bg-white border border-border rounded-ios hover:bg-red-soft hover:border-red/30 flex items-center justify-center transition-all active:scale-95 group"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-text-primary group-hover:text-red transition-colors"
            aria-hidden
          >
            <path d="M14 8v-2a2 2 0 0 0 -2 -2h-7a2 2 0 0 0 -2 2v12a2 2 0 0 0 2 2h7a2 2 0 0 0 2 -2v-2" />
            <path d="M9 12h12l-3 -3" />
            <path d="M18 15l3 -3" />
          </svg>
        </button>
      </form>
    </div>
  );
}
