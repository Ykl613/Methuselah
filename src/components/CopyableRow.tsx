"use client";
import { useState } from "react";

interface CopyableRowProps {
  label: string;
  value: string | null;
  mono?: boolean;
}

export function CopyableRow({ label, value, mono }: CopyableRowProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = value;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand("copy");
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      } catch {
        // ignore
      }
      document.body.removeChild(textarea);
    }
  };

  const hasValue = value !== null && value !== undefined && value !== "";

  return (
    <div className="flex py-1.5 text-xs items-center gap-2 group">
      <div className="w-28 text-text-muted flex-shrink-0">{label}</div>
      <div className={`flex-1 font-medium min-w-0 truncate ${mono ? "font-mono text-[11px]" : ""}`}>
        {hasValue ? value : <span className="text-text-subtle">—</span>}
      </div>
      {hasValue && (
        <button
          onClick={handleCopy}
          title={copied ? "Copied!" : "Copy to clipboard"}
          className={`w-6 h-6 rounded-md flex items-center justify-center transition-all flex-shrink-0 ${
            copied
              ? "bg-green-soft text-green-text"
              : "opacity-0 group-hover:opacity-100 hover:bg-bg-elevated text-text-muted hover:text-text-primary"
          }`}
        >
          {copied ? (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M5 12l5 5l10 -10" />
            </svg>
          ) : (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M9 5H7a2 2 0 0 0 -2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-2" />
              <rect x="9" y="3" width="10" height="14" rx="2" />
            </svg>
          )}
        </button>
      )}
    </div>
  );
}
