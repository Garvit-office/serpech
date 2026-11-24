import Link from "next/link";
import type { ReactNode } from "react";
import { Badge } from "@/components/admin/ui";
import type { ActivityEvent } from "@sarpech/core/types";
import { EVENT_LABEL, EVENT_TONE, describeEvent, visitorLabel } from "./describe";
import { count, pct, timeAgo } from "./format";

/** Segmented link tabs (works without JS; state lives in the URL). */
export function LinkTabs({ items, label }: { items: { href: string; label: ReactNode; active: boolean }[]; label: string }) {
  return (
    <nav aria-label={label} className="flex flex-wrap gap-1 border border-mist bg-white p-1">
      {items.map((t) => (
        <Link
          key={t.href}
          href={t.href}
          aria-current={t.active ? "page" : undefined}
          className="inline-flex min-h-9 items-center gap-2 px-3 font-display text-[0.65rem] uppercase tracking-[0.16em] text-ink-soft transition-colors hover:text-brand-green aria-[current=page]:bg-brand-green aria-[current=page]:text-ivory"
        >
          {t.label}
        </Link>
      ))}
    </nav>
  );
}

/** Horizontal funnel: each step as a bar of the first step, with drop-off from the previous one. */
export function Funnel({ steps }: { steps: { label: string; value: number }[] }) {
  const top = Math.max(1, steps[0]?.value ?? 1);
  return (
    <ol className="space-y-4">
      {steps.map((s, i) => {
        const prev = i ? steps[i - 1].value : null;
        const drop = prev ? 1 - s.value / prev : null;
        return (
          <li key={s.label}>
            <div className="flex items-baseline justify-between gap-3 text-base">
              <span>{s.label}</span>
              <span className="text-ink-soft" style={{ fontVariantNumeric: "tabular-nums" }}>
                <strong className="font-semibold text-brand-green">{count(s.value)}</strong> · {pct(s.value / top, 0)}
              </span>
            </div>
            <div className="mt-1.5 h-2.5 w-full bg-[#EEF1EE]" aria-hidden>
              <div className="h-full rounded-r-[4px] bg-brand-green-2" style={{ width: `${Math.max(s.value ? 1.5 : 0, (s.value / top) * 100)}%` }} />
            </div>
            {drop !== null && prev! > 0 && (
              <p className="mt-1 text-sm text-ink-soft">{pct(Math.max(0, drop), 0)} dropped off from the previous step</p>
            )}
          </li>
        );
      })}
    </ol>
  );
}

/** Ranked list with a proportional bar behind the count. */
export function RankList({
  rows,
  empty = "No data yet.",
  unit,
}: {
  rows: { key: string; label: ReactNode; value: number; note?: ReactNode; href?: string }[];
  empty?: string;
  unit?: string;
}) {
  if (!rows.length) return <p className="py-6 text-center text-base text-ink-soft">{empty}</p>;
  const max = Math.max(...rows.map((r) => r.value), 1);
  return (
    <ol className="space-y-2.5">
      {rows.map((r, i) => (
        <li key={r.key} className="grid grid-cols-[1.25rem_1fr_auto] items-center gap-x-3 gap-y-1">
          <span className="font-display text-[0.65rem] text-ink-soft">{i + 1}</span>
          <span className="min-w-0 truncate text-base">
            {r.href ? (
              <Link href={r.href} className="hover:underline">
                {r.label}
              </Link>
            ) : (
              r.label
            )}
            {r.note && <span className="ml-2">{r.note}</span>}
          </span>
          <span className="text-base font-semibold" style={{ fontVariantNumeric: "tabular-nums" }}>
            {count(r.value)}
            {unit && <span className="sr-only"> {unit}</span>}
          </span>
          <span aria-hidden className="col-start-2 col-end-4 h-1 bg-[#EEF1EE]">
            <span className="block h-full rounded-r-[4px] bg-gold" style={{ width: `${(r.value / max) * 100}%` }} />
          </span>
        </li>
      ))}
    </ol>
  );
}

/** Humanised event feed. */
export function ActivityFeed({ events, nameOf, sessionLinks = true }: { events: ActivityEvent[]; nameOf: (slug: string) => string; sessionLinks?: boolean }) {
  if (!events.length) return <p className="py-6 text-center text-base text-ink-soft">No activity yet.</p>;
  return (
    <ol className="divide-y divide-mist">
      {events.map((e) => (
        <li key={e.id} className="flex items-start gap-3 py-2.5">
          <span className="mt-0.5 shrink-0 whitespace-nowrap">
            <Badge tone={EVENT_TONE[e.type]}>{EVENT_LABEL[e.type]}</Badge>
          </span>
          <span className="min-w-0 flex-1 text-base">
            {describeEvent(e, nameOf)}
            <span className="block text-sm text-ink-soft">
              <time dateTime={e.ts} title={new Date(e.ts).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}>
                {timeAgo(e.ts)}
              </time>
              {e.device && ` · ${e.device}`}
              {sessionLinks && e.sessionId && (
                <>
                  {" · "}
                  <Link href={`/admin/activity?session=${encodeURIComponent(e.sessionId)}`} className="underline decoration-gold underline-offset-2">
                    {visitorLabel(e.sessionId)}
                  </Link>
                </>
              )}
            </span>
          </span>
        </li>
      ))}
    </ol>
  );
}
