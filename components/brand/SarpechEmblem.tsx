import { useId } from "react";
import {
  CENTRE_STROKES,
  CENTRE_STROKE_SCALE,
  FINIAL_PATH,
  GOLD,
  GREEN,
  IVORY,
  MIRRORED_STROKES,
  PEARLS,
  RING,
  RUBY,
  RUBY_GLINT,
  RUBY_PATH,
  mirrored,
} from "./emblem-geometry";

export type EmblemTone = "gold" | "green" | "ivory" | "white";

const TONE: Record<Exclude<EmblemTone, "gold">, string> = {
  green: GREEN,
  ivory: IVORY,
  white: "#FFFFFF",
};

export interface SarpechEmblemProps {
  tone?: EmblemTone;
  /** Draw the outer ring and finial. */
  ring?: boolean;
  /** Show the ruby (pass false for single-colour marks). */
  ruby?: boolean;
  /** Mark strokes for the stitch-in animation (parent needs .stitch-in). */
  stitch?: boolean;
  /** Base stroke width on the 200-unit grid (master artwork = 1.3). */
  strokeWidth?: number;
  /** Accessible title; omit for decorative use. */
  title?: string;
  className?: string;
}

/**
 * The official SARPECH emblem (see public/logo), drawn inline so it can take
 * any brand tone and stitch itself in. Central kalgi with chevron barbs and a
 * curled tip, two side plumes, scroll arms, ruby in an almond setting, pearls.
 */
export function SarpechEmblem({
  tone = "gold",
  ring = true,
  ruby = true,
  stitch = false,
  strokeWidth = 1.3,
  title,
  className,
}: SarpechEmblemProps) {
  const id = useId().replace(/:/g, "");
  const gid = `emb-gold-${id}`;
  const paint = tone === "gold" ? `url(#${gid})` : TONE[tone];
  const stitchProps = stitch ? ({ pathLength: 1, "data-stitch": "" } as const) : {};

  return (
    <svg
      viewBox="0 0 200 200"
      className={className}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      focusable="false"
    >
      {title ? <title>{title}</title> : null}
      {tone === "gold" && (
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={GOLD.light} />
            <stop offset="0.5" stopColor={GOLD.mid} />
            <stop offset="1" stopColor={GOLD.dark} />
          </linearGradient>
        </defs>
      )}
      {ring && (
        <>
          <circle cx="100" cy="100" r={RING.r} fill="none" stroke={paint} strokeWidth={1} {...stitchProps} />
          <circle
            cx="100"
            cy="100"
            r={RING.inner}
            fill="none"
            stroke={paint}
            strokeWidth={0.4}
            strokeDasharray="0.5 2.5"
            strokeLinecap="round"
          />
          <path d={FINIAL_PATH} fill={paint} />
        </>
      )}
      <g fill="none" stroke={paint} strokeLinecap="round" strokeLinejoin="round">
        {CENTRE_STROKES.map((d, i) => (
          <path key={d} d={d} strokeWidth={strokeWidth * CENTRE_STROKE_SCALE[i]} {...stitchProps} />
        ))}
        {MIRRORED_STROKES.map((d) => (
          <path key={d} d={d} strokeWidth={strokeWidth} {...stitchProps} />
        ))}
        <g transform="translate(200 0) scale(-1 1)">
          {MIRRORED_STROKES.map((d) => (
            <path key={d} d={d} strokeWidth={strokeWidth} {...stitchProps} />
          ))}
        </g>
      </g>
      {ruby ? (
        <>
          <path d={RUBY_PATH} fill={RUBY} stroke={paint} strokeWidth={1} />
          <ellipse {...RUBY_GLINT} fill="#fff" opacity={0.45} />
        </>
      ) : (
        <path d={RUBY_PATH} fill="none" stroke={paint} strokeWidth={1} />
      )}
      <g fill={paint}>
        {mirrored(PEARLS).map(([x, y, r]) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r={r} />
        ))}
      </g>
    </svg>
  );
}
