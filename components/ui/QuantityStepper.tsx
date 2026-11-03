"use client";

import { MinusIcon, PlusIcon } from "./icons";

export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = 10,
  label = "Quantity",
  size = "md",
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  label?: string;
  size?: "sm" | "md";
}) {
  const h = size === "sm" ? "h-9" : "h-12";
  const w = size === "sm" ? "w-9" : "w-11";
  return (
    <div role="group" aria-label={label} className={`inline-flex items-stretch border border-brand-green/40 ${h}`}>
      <button
        type="button"
        className={`grid ${w} place-items-center disabled:opacity-40`}
        onClick={() => onChange(Math.max(min, value - 1))}
        aria-label="Decrease quantity"
        disabled={value <= min}
      >
        <MinusIcon />
      </button>
      <output aria-live="polite" className="grid min-w-8 place-items-center font-display text-sm">
        {value}
      </output>
      <button
        type="button"
        className={`grid ${w} place-items-center disabled:opacity-40`}
        onClick={() => onChange(Math.min(max, value + 1))}
        aria-label="Increase quantity"
        disabled={value >= max}
      >
        <PlusIcon />
      </button>
    </div>
  );
}
