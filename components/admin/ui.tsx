import Link from "next/link";
import type { ReactNode } from "react";

/* Small, consistent building blocks for admin screens. Server-safe (no hooks). */

export function AdminHeader({ title, description, actions }: { title: string; description?: ReactNode; actions?: ReactNode }) {
  return (
    <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-xl sm:text-2xl">{title}</h1>
        {description && <p className="mt-1 text-base text-ink-soft">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </header>
  );
}

export function Card({ title, actions, children, className = "", padded = true }: { title?: string; actions?: ReactNode; children: ReactNode; className?: string; padded?: boolean }) {
  return (
    <section className={`border border-mist bg-white shadow-card ${className}`}>
      {(title || actions) && (
        <div className="flex items-center justify-between gap-3 border-b border-mist px-5 py-3">
          {title && <h2 className="font-display text-[0.72rem] uppercase tracking-[0.2em]">{title}</h2>}
          {actions}
        </div>
      )}
      <div className={padded ? "p-5" : ""}>{children}</div>
    </section>
  );
}

export function StatCard({ label, value, hint }: { label: string; value: ReactNode; hint?: ReactNode }) {
  return (
    <div className="border border-mist bg-white px-5 py-4 shadow-card">
      <p className="eyebrow text-[0.62rem] text-ink-soft">{label}</p>
      <p className="mt-1 font-display text-2xl tracking-[0.04em]">{value}</p>
      {hint && <p className="mt-0.5 text-sm text-ink-soft">{hint}</p>}
    </div>
  );
}

const BADGE = {
  green: "bg-[#E4EFE8] text-[#1F5B45]",
  gold: "bg-[#F6EDD3] text-[#6E521A]",
  ruby: "bg-[#F6E1E4] text-ruby",
  grey: "bg-[#ECEBE6] text-ink-soft",
  blue: "bg-[#E3E9F3] text-[#1E2A3E]",
} as const;

export function Badge({ tone = "grey", children }: { tone?: keyof typeof BADGE; children: ReactNode }) {
  return <span className={`inline-flex items-center px-2 py-0.5 font-display text-[0.6rem] uppercase tracking-[0.14em] ${BADGE[tone]}`}>{children}</span>;
}

/** Responsive table wrapper: horizontal scroll on small screens. */
export function Table({ children, label }: { children: ReactNode; label: string }) {
  return (
    <div className="relative overflow-x-auto">
      <table aria-label={label} className="w-full min-w-[40rem] border-collapse text-left text-[0.98rem]">
        {children}
      </table>
    </div>
  );
}

export const th = "border-b border-mist px-4 py-2.5 font-display text-[0.62rem] font-medium uppercase tracking-[0.18em] text-ink-soft";
export const td = "border-b border-mist px-4 py-3 align-middle";

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="px-6 py-14 text-center">
      <p className="text-xl">{title}</p>
      {children && <div className="mt-2 text-ink-soft">{children}</div>}
    </div>
  );
}

export function LinkButton({ href, children, variant = "primary" }: { href: string; children: ReactNode; variant?: "primary" | "outline" }) {
  return (
    <Link href={href} className={`${variant === "primary" ? "btn-royal" : "btn-outline"} min-h-10 px-5 py-2`}>
      {children}
    </Link>
  );
}

export function Pagination({ page, pageSize, total, href }: { page: number; pageSize: number; total: number; href: (page: number) => string }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (pages <= 1) return null;
  return (
    <nav aria-label="Pagination" className="flex items-center justify-between gap-3 px-5 py-3 text-base">
      <span className="text-ink-soft">
        Page {page} of {pages} · {total.toLocaleString("en-IN")} total
      </span>
      <span className="flex gap-2">
        {page > 1 && (
          <Link href={href(page - 1)} className="btn-outline min-h-9 px-3 py-1">
            Previous
          </Link>
        )}
        {page < pages && (
          <Link href={href(page + 1)} className="btn-outline min-h-9 px-3 py-1">
            Next
          </Link>
        )}
      </span>
    </nav>
  );
}

export function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function formatDate(iso: string | null) {
  return iso ? new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—";
}
