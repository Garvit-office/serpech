/** Line drawing of a figure with gold measurement guides for the size guide. */
export function MeasureDiagram({ className }: { className?: string }) {
  const label = (x: number, y: number, t: string, anchor: "start" | "end" | "middle" = "start") => (
    <text x={x} y={y} textAnchor={anchor} fontFamily="var(--font-display), serif" fontSize="10" letterSpacing="1.5" fill="#0E1A15">
      {t}
    </text>
  );
  return (
    <svg viewBox="0 0 320 480" className={className} role="img" aria-labelledby="measure-title">
      <title id="measure-title">How to measure: chest, waist, shoulder, sleeve and inseam</title>
      <defs>
        <marker id="measure-tick" viewBox="0 0 6 6" refX="3" refY="3" markerWidth="6" markerHeight="6" orient="auto">
          <circle cx="3" cy="3" r="2" fill="#8E6A22" />
        </marker>
      </defs>
      {/* figure */}
      <g fill="#FAF8F3" stroke="#0E1A15" strokeWidth="1.4" strokeLinejoin="round">
        <ellipse cx="160" cy="48" rx="22" ry="27" />
        <path d="M148 74h24v14h-24z" />
        <path d="M110 92Q160 80 210 92L224 104 238 250 226 252 208 140 206 230 210 262H110L114 230 112 140 94 252 82 250 96 104Z" />
        <path d="M114 262H206L204 452H172L160 300 148 452H116Z" />
      </g>
      <g stroke="#8E6A22" strokeWidth="1.3" fill="none" markerStart="url(#measure-tick)" markerEnd="url(#measure-tick)">
        {/* shoulder */}
        <path d="M100 96Q160 84 220 96" strokeDasharray="4 3" />
        {/* chest */}
        <path d="M108 130Q160 142 212 130" />
        {/* waist */}
        <path d="M110 214Q160 224 210 214" />
        {/* sleeve */}
        <path d="M228 106L244 246" />
        {/* inseam */}
        <path d="M168 304L180 448" />
      </g>
      <g stroke="#8E6A22" strokeWidth="0.6">
        <path d="M222 96H262M214 134H262M212 218H262M246 176H262M182 380H262" />
      </g>
      {label(266, 99, "SHOULDER")}
      {label(266, 137, "CHEST")}
      {label(266, 221, "WAIST")}
      {label(266, 179, "SLEEVE")}
      {label(266, 383, "INSEAM")}
    </svg>
  );
}
