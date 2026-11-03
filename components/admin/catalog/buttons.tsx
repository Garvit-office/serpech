"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type ReactNode } from "react";
import type { ActionResult } from "@/lib/server/admin-action";

/**
 * Runs a server action from a list row (delete, duplicate, pause…), with an
 * optional confirm prompt, pending state and inline error.
 */
export function RowAction({
  action,
  children,
  confirm,
  tone = "default",
  label,
}: {
  action: () => Promise<ActionResult>;
  children: ReactNode;
  confirm?: string;
  tone?: "default" | "danger";
  label?: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <span className="inline-flex flex-col">
      <button
        type="button"
        aria-label={label}
        disabled={pending}
        onClick={() => {
          if (confirm && !window.confirm(confirm)) return;
          setError(null);
          start(async () => {
            const res = await action();
            if (!res.ok) setError(res.error);
            else router.refresh();
          });
        }}
        className={`whitespace-nowrap text-[0.95rem] underline decoration-1 underline-offset-4 disabled:opacity-50 ${
          tone === "danger" ? "text-ruby decoration-ruby/40 hover:decoration-ruby" : "text-brand-green decoration-gold/60 hover:decoration-gold"
        }`}
      >
        {pending ? "…" : children}
      </button>
      {error && (
        <span role="alert" className="text-sm text-ruby">
          {error}
        </span>
      )}
    </span>
  );
}

export function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1500);
        } catch {
          /* clipboard blocked */
        }
      }}
      className="text-sm text-ink-soft underline decoration-gold/60 underline-offset-4 hover:text-brand-green"
      aria-label={`Copy ${text}`}
    >
      <span aria-live="polite">{copied ? "Copied" : label}</span>
    </button>
  );
}

/** Success banner shown after a save redirect (?saved=1). */
export function SavedNotice({ message }: { message: string }) {
  const [show, setShow] = useState(true);
  if (!show) return null;
  return (
    <div role="status" className="mb-5 flex items-center justify-between gap-3 border border-[#1F5B45]/30 bg-[#E4EFE8] px-4 py-2.5 text-base text-[#1F5B45]">
      {message}
      <button type="button" onClick={() => setShow(false)} className="text-sm underline underline-offset-4" aria-label="Dismiss">
        Dismiss
      </button>
    </div>
  );
}
