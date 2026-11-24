import { useId } from "react";
import { MIRROR, ZARI, ZONES, drawGarment, patternTile, shade, type DesignSpec, type Fabric, type PatternKind, type Prim } from "@sarpech/core/designer";

/**
 * Draws a Design Studio design as SVG from the shared drawing data in
 * @sarpech/core/designer (the mobile app draws the same data with
 * react-native-svg). Server-safe: no state, so it works in emails-to-be,
 * order pages and the admin as well as the live studio.
 */
export function DesignArt({ spec, className = "", title }: { spec: DesignSpec; className?: string; title?: string }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const d = drawGarment(spec);
  const zoneFill = (z: keyof DesignSpec["fabrics"]) => `url(#${uid}-${z})`;
  const zari = Array.from(new Set(d.zari.map((z) => z.pattern)));

  return (
    <svg viewBox={`0 0 ${d.width} ${d.height}`} role="img" aria-label={title ?? "Garment design"} className={className}>
      <defs>
        {ZONES.map(({ key }) => (
          <FabricPattern key={key} id={`${uid}-${key}`} fabric={spec.fabrics[key]} />
        ))}
        {zari.map((p) => (
          <FabricPattern key={p} id={`${uid}-zari-${p}`} fabric={{ color: "#000000", accent: ZARI, pattern: p, scale: p === "booti" ? 0.8 : 0.6, angle: 0 }} transparent />
        ))}
        <linearGradient id={`${uid}-shade`} gradientUnits="userSpaceOnUse" x1="40" y1="0" x2="260" y2="0">
          <stop offset="0" stopColor="#000" stopOpacity="0.22" />
          <stop offset="0.28" stopColor="#000" stopOpacity="0" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0.07" />
          <stop offset="0.72" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.22" />
        </linearGradient>
        <radialGradient id={`${uid}-ground`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#0E1A15" stopOpacity="0.22" />
          <stop offset="1" stopColor="#0E1A15" stopOpacity="0" />
        </radialGradient>
      </defs>

      <ellipse cx={d.width / 2} cy={d.height - 8} rx="110" ry="7" fill={`url(#${uid}-ground)`} />

      {d.pieces.map((p) => {
        const f = spec.fabrics[p.zone];
        const props = { d: p.d, fill: zoneFill(p.zone), stroke: shade(f.color, -0.35), strokeWidth: 1, strokeLinejoin: "round" as const };
        return (
          <g key={p.id}>
            <path {...props} />
            <path d={p.d} fill={`url(#${uid}-shade)`} />
            {p.mirror && (
              <g transform={MIRROR}>
                <path {...props} />
                <path d={p.d} fill={`url(#${uid}-shade)`} />
              </g>
            )}
          </g>
        );
      })}

      {d.zari.map((z, i) => (
        <g key={`z${i}`}>
          <path d={z.d} fill={`url(#${uid}-zari-${z.pattern})`} />
          {z.mirror && <path d={z.d} fill={`url(#${uid}-zari-${z.pattern})`} transform={MIRROR} />}
        </g>
      ))}

      <g fill="none" stroke="#0E1A15" strokeWidth="1" strokeLinecap="round">
        {d.lines.map((l, i) => (
          <g key={`l${i}`} opacity={l.opacity}>
            <path d={l.d} />
            {l.mirror && <path d={l.d} transform={MIRROR} />}
          </g>
        ))}
      </g>

      <g fill="none" stroke={ZARI} strokeWidth="1.6" strokeDasharray="3 2" strokeLinecap="round">
        {d.zariLines.map((l, i) => (
          <g key={`zl${i}`}>
            <path d={l.d} />
            {l.mirror && <path d={l.d} transform={MIRROR} />}
          </g>
        ))}
      </g>

      <g fill="none" stroke={spec.fabrics.trim.accent} strokeWidth="2" strokeLinecap="round">
        {d.tipping.map((t, i) => (
          <g key={`t${i}`}>
            <path d={t.d} />
            {t.mirror && <path d={t.d} transform={MIRROR} />}
          </g>
        ))}
      </g>

      {d.buttons.map((b, i) => (
        <g key={`b${i}`}>
          <circle cx={b.cx} cy={b.cy} r={b.r} fill={d.buttonColor} stroke={shade(d.buttonColor, -0.4)} strokeWidth="0.6" />
          <circle cx={b.cx - b.r * 0.3} cy={b.cy - b.r * 0.3} r={b.r * 0.35} fill="#fff" opacity="0.45" />
        </g>
      ))}
    </svg>
  );
}

function PrimEl({ p, color }: { p: Prim; color: string }) {
  if (p.kind === "rect") return <rect x={p.x} y={p.y} width={p.w} height={p.h} fill={color} opacity={p.opacity} />;
  if (p.kind === "circle")
    return <circle cx={p.cx} cy={p.cy} r={p.r} fill={p.fill ? color : "none"} stroke={p.fill ? undefined : color} strokeWidth={p.sw} opacity={p.opacity} />;
  return <path d={p.d} fill={p.fill ? color : "none"} stroke={p.fill ? undefined : color} strokeWidth={p.sw} strokeLinecap="round" strokeLinejoin="round" opacity={p.opacity} />;
}

/** One fabric as an SVG <pattern>; `transparent` leaves out the ground (for zari overlays). */
export function FabricPattern({ id, fabric, transparent = false }: { id: string; fabric: Fabric; transparent?: boolean }) {
  const tile = patternTile(fabric.pattern);
  const size = tile.size * fabric.scale;
  return (
    <pattern id={id} patternUnits="userSpaceOnUse" width={size} height={size} patternTransform={fabric.angle ? `rotate(${fabric.angle})` : undefined}>
      {!transparent && <rect width={size} height={size} fill={fabric.color} />}
      <g transform={`scale(${fabric.scale})`}>
        {tile.prims.map((p, i) => (
          <PrimEl key={i} p={p} color={fabric.accent} />
        ))}
      </g>
    </pattern>
  );
}

/** Small square swatch of a fabric (pattern pickers). */
export function FabricSwatch({ fabric, className = "" }: { fabric: Fabric; className?: string }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  return (
    <svg viewBox="0 0 48 48" aria-hidden className={className}>
      <defs>
        <FabricPattern id={`${uid}-f`} fabric={fabric} />
      </defs>
      <rect width="48" height="48" fill={`url(#${uid}-f)`} />
    </svg>
  );
}

export type { PatternKind };
