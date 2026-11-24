import { useId } from "react";

/** Unique, SSR-safe id for gradient/pattern defs inside inline SVGs. */
export function useSvgId(prefix: string) {
  return `${prefix}-${useId().replace(/:/g, "")}`;
}

/** Zari gold gradient #F3DFA2 → #C9A04A → #8E6A22. */
export function GoldGradient({ id, vertical = true }: { id: string; vertical?: boolean }) {
  return (
    <linearGradient id={id} x1="0" y1="0" x2={vertical ? "0" : "1"} y2={vertical ? "1" : "0"}>
      <stop offset="0" stopColor="#F3DFA2" />
      <stop offset="0.5" stopColor="#C9A04A" />
      <stop offset="1" stopColor="#8E6A22" />
    </linearGradient>
  );
}

/** Props that opt an SVG element into the stitch-in stroke animation. */
export const stitch = { pathLength: 1, "data-stitch": "" } as const;
