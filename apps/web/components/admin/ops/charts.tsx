"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { count, countCompact, money, moneyCompact } from "./format";

/*
 * Small inline-SVG charts for the admin. One y-axis per chart (never dual),
 * 2px lines, ≤24px columns with 4px rounded data ends, hairline grid,
 * hover + arrow-key tooltip, legend for ≥2 series, sr-only table view.
 */

type Fmt = "count" | "money";
const FULL: Record<Fmt, (n: number) => string> = { count, money };
const TICK: Record<Fmt, (n: number) => string> = { count: countCompact, money: moneyCompact };

const INK = "#0E1A15";
const MUTED = "#5B6660";
const GRID = "#E9E4D8";
const SURFACE = "#FFFFFF";

export interface Series {
  name: string;
  color: string;
  values: number[];
}

/** Axis max with four equal, clean steps (1/2/2.5/5 × 10ⁿ); whole-number steps for counts. */
function niceMax(v: number, fmt: Fmt) {
  if (v <= 0) return 4;
  const raw = v / 4;
  const exp = 10 ** Math.floor(Math.log10(raw));
  const f = raw / exp;
  let step = (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * exp;
  if (fmt === "count") step = Math.max(1, Math.ceil(step));
  return step * 4;
}

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [w, setW] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(Math.round(e.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, w] as const;
}

function Frame({
  title,
  series,
  labels,
  longLabels,
  fmt,
  children,
}: {
  title: string;
  series: Series[];
  labels: string[];
  longLabels: string[];
  fmt: Fmt;
  children: (w: number) => ReactNode;
}) {
  const [ref, w] = useWidth<HTMLDivElement>();
  const titleId = useId();
  return (
    <figure aria-labelledby={titleId} className="min-w-0">
      <figcaption id={titleId} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <span className="font-display text-[0.7rem] uppercase tracking-[0.18em]">{title}</span>
        {series.length > 1 && (
          <span className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-soft" aria-hidden>
            {series.map((s) => (
              <span key={s.name} className="inline-flex items-center gap-1.5">
                <span className="inline-block h-0.5 w-4 rounded" style={{ background: s.color }} />
                {s.name}
              </span>
            ))}
          </span>
        )}
      </figcaption>
      <div ref={ref} className="relative mt-3 h-52 w-full">
        {w > 0 && children(w)}
      </div>
      <table className="sr-only">
        <caption>{title}</caption>
        <thead>
          <tr>
            <th scope="col">Period</th>
            {series.map((s) => (
              <th key={s.name} scope="col">
                {s.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {labels.map((l, i) => (
            <tr key={l + i}>
              <th scope="row">{longLabels[i] ?? l}</th>
              {series.map((s) => (
                <td key={s.name}>{FULL[fmt](s.values[i] ?? 0)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

const H = 208;
const PAD = { top: 10, right: 12, bottom: 24, left: 48 };

function Axes({ w, max, fmt, labels }: { w: number; max: number; fmt: Fmt; labels: string[] }) {
  const ih = H - PAD.top - PAD.bottom;
  const iw = w - PAD.left - PAD.right;
  const ticks = [0, 0.25, 0.5, 0.75, 1];
  const every = Math.max(1, Math.ceil(labels.length / Math.max(2, Math.floor(iw / 64))));
  const x = (i: number) => PAD.left + (labels.length <= 1 ? iw / 2 : (i * iw) / (labels.length - 1));
  return (
    <g aria-hidden fontSize="11" fontFamily="var(--font-serif), serif">
      {ticks.map((t) => {
        const y = PAD.top + ih - t * ih;
        return (
          <g key={t}>
            <line x1={PAD.left} x2={w - PAD.right} y1={y} y2={y} stroke={GRID} strokeWidth="1" />
            <text x={PAD.left - 8} y={y + 4} textAnchor="end" fill={MUTED} style={{ fontVariantNumeric: "tabular-nums" }}>
              {TICK[fmt](max * t)}
            </text>
          </g>
        );
      })}
      {labels.map((l, i) =>
        i % every === 0 || i === labels.length - 1 ? (
          <text key={l + i} x={x(i)} y={H - 6} textAnchor={i === 0 ? "start" : i === labels.length - 1 ? "end" : "middle"} fill={MUTED}>
            {i % every === 0 && labels.length - 1 - i < every && i !== labels.length - 1 ? "" : l}
          </text>
        ) : null,
      )}
    </g>
  );
}

function Tooltip({ x, w, title, rows }: { x: number; w: number; title: string; rows: { name: string; color: string; value: string }[] }) {
  const left = Math.min(Math.max(x - 80, 0), Math.max(0, w - 168));
  return (
    <div
      role="status"
      className="pointer-events-none absolute top-0 z-10 w-[168px] border border-mist bg-white px-3 py-2 text-sm shadow-card"
      style={{ left }}
    >
      <p className="font-display text-[0.62rem] uppercase tracking-[0.14em] text-ink-soft">{title}</p>
      {rows.map((r) => (
        <p key={r.name} className="mt-0.5 flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 text-ink-soft">
            <span className="inline-block size-2 rounded-full" style={{ background: r.color }} />
            {r.name}
          </span>
          <span className="font-semibold text-brand-green" style={{ fontVariantNumeric: "tabular-nums" }}>
            {r.value}
          </span>
        </p>
      ))}
    </div>
  );
}

/** Shared hover/keyboard index handling. */
function useActive(n: number) {
  const [active, setActive] = useState<number | null>(null);
  const onKey = (e: KeyboardEvent) => {
    if (e.key === "ArrowRight") setActive((a) => Math.min(n - 1, (a ?? -1) + 1));
    else if (e.key === "ArrowLeft") setActive((a) => Math.max(0, (a ?? n) - 1));
    else if (e.key === "Escape") setActive(null);
    else return;
    e.preventDefault();
  };
  return { active, setActive, onKey };
}

/** Multi-series line chart on one shared axis (e.g. visitors & page views). */
export function LineChart({ title, series, labels, longLabels, fmt = "count" }: { title: string; series: Series[]; labels: string[]; longLabels: string[]; fmt?: Fmt }) {
  const n = labels.length;
  const { active, setActive, onKey } = useActive(n);
  const max = niceMax(Math.max(0, ...series.flatMap((s) => s.values)), fmt);
  return (
    <Frame title={title} series={series} labels={labels} longLabels={longLabels} fmt={fmt}>
      {(w) => {
        const iw = w - PAD.left - PAD.right;
        const ih = H - PAD.top - PAD.bottom;
        const x = (i: number) => PAD.left + (n <= 1 ? iw / 2 : (i * iw) / (n - 1));
        const y = (v: number) => PAD.top + ih - (v / max) * ih;
        const band = n <= 1 ? iw : iw / (n - 1);
        return (
          <>
            <svg
              width={w}
              height={H}
              role="img"
              aria-label={`${title}. Use left and right arrow keys to read values.`}
              tabIndex={0}
              onKeyDown={onKey}
              onBlur={() => setActive(null)}
              className="overflow-visible focus-visible:outline-2 focus-visible:outline-gold-dark"
            >
              <Axes w={w} max={max} fmt={fmt} labels={labels} />
              {series.map((s, si) => {
                const d = s.values.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join("");
                return (
                  <g key={s.name}>
                    {si === 0 && n > 1 && (
                      <path d={`${d}L${x(n - 1)},${y(0)}L${x(0)},${y(0)}Z`} fill={s.color} opacity="0.08" />
                    )}
                    <path d={d} fill="none" stroke={s.color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
                    {n > 0 && <circle cx={x(n - 1)} cy={y(s.values[n - 1] ?? 0)} r="4" fill={s.color} stroke={SURFACE} strokeWidth="2" />}
                  </g>
                );
              })}
              {active !== null && (
                <g aria-hidden>
                  <line x1={x(active)} x2={x(active)} y1={PAD.top} y2={PAD.top + ih} stroke={INK} strokeOpacity="0.25" strokeWidth="1" />
                  {series.map((s) => (
                    <circle key={s.name} cx={x(active)} cy={y(s.values[active] ?? 0)} r="5" fill={s.color} stroke={SURFACE} strokeWidth="2" />
                  ))}
                </g>
              )}
              {labels.map((l, i) => (
                <rect
                  key={l + i}
                  x={x(i) - band / 2}
                  y={PAD.top}
                  width={band}
                  height={ih}
                  fill="transparent"
                  onMouseEnter={() => setActive(i)}
                  onMouseLeave={() => setActive(null)}
                />
              ))}
            </svg>
            {active !== null && (
              <Tooltip
                x={x(active)}
                w={w}
                title={longLabels[active] ?? labels[active]}
                rows={series.map((s) => ({ name: s.name, color: s.color, value: FULL[fmt](s.values[active] ?? 0) }))}
              />
            )}
          </>
        );
      }}
    </Frame>
  );
}

/** Single-series column chart (e.g. orders per day, revenue per day). */
export function ColumnChart({ title, series, labels, longLabels, fmt = "count" }: { title: string; series: Series; labels: string[]; longLabels: string[]; fmt?: Fmt }) {
  const n = labels.length;
  const { active, setActive, onKey } = useActive(n);
  const max = niceMax(Math.max(0, ...series.values), fmt);
  return (
    <Frame title={title} series={[series]} labels={labels} longLabels={longLabels} fmt={fmt}>
      {(w) => {
        const iw = w - PAD.left - PAD.right;
        const ih = H - PAD.top - PAD.bottom;
        const slot = iw / Math.max(1, n);
        const bw = Math.max(2, Math.min(24, slot - 2));
        // columns sit centred in their slot; Axes labels use the same centres
        const cx = (i: number) => PAD.left + slot * i + slot / 2;
        const base = PAD.top + ih;
        return (
          <>
            <svg
              width={w}
              height={H}
              role="img"
              aria-label={`${title}. Use left and right arrow keys to read values.`}
              tabIndex={0}
              onKeyDown={onKey}
              onBlur={() => setActive(null)}
              className="overflow-visible focus-visible:outline-2 focus-visible:outline-gold-dark"
            >
              <ColumnAxes w={w} max={max} fmt={fmt} labels={labels} cx={cx} />
              {series.values.map((v, i) => {
                const h = (v / max) * ih;
                if (h <= 0) return null;
                const r = Math.min(4, h, bw / 2);
                const x0 = cx(i) - bw / 2;
                const top = base - h;
                return (
                  <path
                    key={i}
                    d={`M${x0},${base}V${top + r}Q${x0},${top} ${x0 + r},${top}H${x0 + bw - r}Q${x0 + bw},${top} ${x0 + bw},${top + r}V${base}Z`}
                    fill={series.color}
                    opacity={active === null || active === i ? 1 : 0.45}
                  />
                );
              })}
              {labels.map((l, i) => (
                <rect
                  key={l + i}
                  x={PAD.left + slot * i}
                  y={PAD.top}
                  width={slot}
                  height={ih}
                  fill="transparent"
                  onMouseEnter={() => setActive(i)}
                  onMouseLeave={() => setActive(null)}
                />
              ))}
            </svg>
            {active !== null && (
              <Tooltip
                x={cx(active)}
                w={w}
                title={longLabels[active] ?? labels[active]}
                rows={[{ name: series.name, color: series.color, value: FULL[fmt](series.values[active] ?? 0) }]}
              />
            )}
          </>
        );
      }}
    </Frame>
  );
}

function ColumnAxes({ w, max, fmt, labels, cx }: { w: number; max: number; fmt: Fmt; labels: string[]; cx: (i: number) => number }) {
  const ih = H - PAD.top - PAD.bottom;
  const iw = w - PAD.left - PAD.right;
  const every = Math.max(1, Math.ceil(labels.length / Math.max(2, Math.floor(iw / 64))));
  return (
    <g aria-hidden fontSize="11" fontFamily="var(--font-serif), serif">
      {[0, 0.25, 0.5, 0.75, 1].map((t) => {
        const y = PAD.top + ih - t * ih;
        return (
          <g key={t}>
            <line x1={PAD.left} x2={w - PAD.right} y1={y} y2={y} stroke={GRID} strokeWidth="1" />
            <text x={PAD.left - 8} y={y + 4} textAnchor="end" fill={MUTED} style={{ fontVariantNumeric: "tabular-nums" }}>
              {TICK[fmt](max * t)}
            </text>
          </g>
        );
      })}
      {labels.map((l, i) =>
        i % every === 0 ? (
          <text key={l + i} x={cx(i)} y={H - 6} textAnchor="middle" fill={MUTED}>
            {l}
          </text>
        ) : null,
      )}
    </g>
  );
}
