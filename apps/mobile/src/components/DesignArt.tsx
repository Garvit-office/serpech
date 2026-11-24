import { memo, useId } from "react";
import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, Pattern, RadialGradient, Rect, Stop } from "react-native-svg";
import { MIRROR, ZARI, ZONES, drawGarment, patternTile, shade, type DesignSpec, type Fabric, type Prim } from "@sarpech/core/designer";

/**
 * Draws a Design Studio design with react-native-svg from the shared drawing
 * data in @sarpech/core/designer — the website's <DesignArt/> draws the same data,
 * so a design looks identical in the app, on the site and on the tailor's sheet.
 */
function PrimEl({ p, color }: { p: Prim; color: string }) {
  if (p.kind === "rect") return <Rect x={p.x} y={p.y} width={p.w} height={p.h} fill={color} opacity={p.opacity} />;
  if (p.kind === "circle") return <Circle cx={p.cx} cy={p.cy} r={p.r} fill={p.fill ? color : "none"} stroke={p.fill ? undefined : color} strokeWidth={p.sw} opacity={p.opacity} />;
  return <Path d={p.d} fill={p.fill ? color : "none"} stroke={p.fill ? undefined : color} strokeWidth={p.sw} strokeLinecap="round" strokeLinejoin="round" opacity={p.opacity} />;
}

export function FabricPattern({ id, fabric, transparent = false }: { id: string; fabric: Fabric; transparent?: boolean }) {
  const tile = patternTile(fabric.pattern);
  const size = tile.size * fabric.scale;
  return (
    <Pattern id={id} patternUnits="userSpaceOnUse" x="0" y="0" width={size} height={size} patternTransform={fabric.angle ? `rotate(${fabric.angle})` : undefined}>
      {!transparent && <Rect x="0" y="0" width={size} height={size} fill={fabric.color} />}
      <G scale={fabric.scale}>
        {tile.prims.map((p, i) => (
          <PrimEl key={i} p={p} color={fabric.accent} />
        ))}
      </G>
    </Pattern>
  );
}

function DesignArtImpl({ spec, width, height }: { spec: DesignSpec; width: number; height: number }) {
  const uid = `da${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const d = drawGarment(spec);
  const zari = Array.from(new Set(d.zari.map((z) => z.pattern)));
  return (
    <Svg width={width} height={height} viewBox={`0 0 ${d.width} ${d.height}`} accessibilityLabel="Garment design">
      <Defs>
        {ZONES.map(({ key }) => (
          <FabricPattern key={key} id={`${uid}-${key}`} fabric={spec.fabrics[key]} />
        ))}
        {zari.map((p) => (
          <FabricPattern key={p} id={`${uid}-zari-${p}`} fabric={{ color: "#000000", accent: ZARI, pattern: p, scale: p === "booti" ? 0.8 : 0.6, angle: 0 }} transparent />
        ))}
        <LinearGradient id={`${uid}-shade`} gradientUnits="userSpaceOnUse" x1="40" y1="0" x2="260" y2="0">
          <Stop offset="0" stopColor="#000" stopOpacity={0.22} />
          <Stop offset="0.28" stopColor="#000" stopOpacity={0} />
          <Stop offset="0.5" stopColor="#fff" stopOpacity={0.07} />
          <Stop offset="0.72" stopColor="#000" stopOpacity={0} />
          <Stop offset="1" stopColor="#000" stopOpacity={0.22} />
        </LinearGradient>
        <RadialGradient id={`${uid}-ground`} cx="0.5" cy="0.5" r="0.5">
          <Stop offset="0" stopColor="#0E1A15" stopOpacity={0.22} />
          <Stop offset="1" stopColor="#0E1A15" stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Ellipse cx={d.width / 2} cy={d.height - 8} rx={110} ry={7} fill={`url(#${uid}-ground)`} />
      {d.pieces.map((p) => {
        const f = spec.fabrics[p.zone];
        const fill = `url(#${uid}-${p.zone})`;
        const stroke = shade(f.color, -0.35);
        return (
          <G key={p.id}>
            <Path d={p.d} fill={fill} stroke={stroke} strokeWidth={1} strokeLinejoin="round" />
            <Path d={p.d} fill={`url(#${uid}-shade)`} />
            {p.mirror && (
              <G transform={MIRROR}>
                <Path d={p.d} fill={fill} stroke={stroke} strokeWidth={1} strokeLinejoin="round" />
                <Path d={p.d} fill={`url(#${uid}-shade)`} />
              </G>
            )}
          </G>
        );
      })}
      {d.zari.map((z, i) => (
        <G key={`z${i}`}>
          <Path d={z.d} fill={`url(#${uid}-zari-${z.pattern})`} />
          {z.mirror && <Path d={z.d} fill={`url(#${uid}-zari-${z.pattern})`} transform={MIRROR} />}
        </G>
      ))}
      <G fill="none" stroke="#0E1A15" strokeWidth={1} strokeLinecap="round">
        {d.lines.map((l, i) => (
          <G key={`l${i}`} opacity={l.opacity}>
            <Path d={l.d} />
            {l.mirror && <Path d={l.d} transform={MIRROR} />}
          </G>
        ))}
      </G>
      <G fill="none" stroke={ZARI} strokeWidth={1.6} strokeDasharray={[3, 2]} strokeLinecap="round">
        {d.zariLines.map((l, i) => (
          <G key={`zl${i}`}>
            <Path d={l.d} />
            {l.mirror && <Path d={l.d} transform={MIRROR} />}
          </G>
        ))}
      </G>
      <G fill="none" stroke={spec.fabrics.trim.accent} strokeWidth={2} strokeLinecap="round">
        {d.tipping.map((t, i) => (
          <G key={`t${i}`}>
            <Path d={t.d} />
            {t.mirror && <Path d={t.d} transform={MIRROR} />}
          </G>
        ))}
      </G>
      {d.buttons.map((b, i) => (
        <G key={`b${i}`}>
          <Circle cx={b.cx} cy={b.cy} r={b.r} fill={d.buttonColor} stroke={shade(d.buttonColor, -0.4)} strokeWidth={0.6} />
          <Circle cx={b.cx - b.r * 0.3} cy={b.cy - b.r * 0.3} r={b.r * 0.35} fill="#fff" opacity={0.45} />
        </G>
      ))}
    </Svg>
  );
}

export const DesignArt = memo(DesignArtImpl);

/** Small square fabric swatch (pattern picker). */
export function FabricSwatch({ fabric, size = 52 }: { fabric: Fabric; size?: number }) {
  const id = `sw${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Defs>
        <FabricPattern id={id} fabric={fabric} />
      </Defs>
      <Rect x="0" y="0" width="48" height="48" fill={`url(#${id})`} />
    </Svg>
  );
}
