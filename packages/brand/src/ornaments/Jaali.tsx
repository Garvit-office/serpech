import { useSvgId } from "./GoldGradient";

/**
 * Mughal jaali lattice — eight-point stars linked by octagons — as a
 * full-bleed texture. Keep opacity around 0.05–0.08 on green grounds.
 */
export function Jaali({
  className,
  opacity = 0.07,
  color = "#C9A04A",
  size = 64,
}: {
  className?: string;
  opacity?: number;
  color?: string;
  size?: number;
}) {
  const pid = useSvgId("jaali");
  const k = size / 64;
  return (
    <svg aria-hidden focusable="false" className={`pointer-events-none absolute inset-0 h-full w-full ${className ?? ""}`}>
      <defs>
        <pattern id={pid} width={size} height={size} patternUnits="userSpaceOnUse">
          <g transform={`scale(${k})`} fill="none" stroke={color} strokeWidth="1">
            {/* eight-point star from two rotated squares */}
            <rect x="20" y="20" width="24" height="24" />
            <rect x="20" y="20" width="24" height="24" transform="rotate(45 32 32)" />
            <circle cx="32" cy="32" r="5" />
            {/* connecting bars */}
            <path d="M32 15V0M32 49v15M15 32H0M49 32h15" />
            {/* quarter rosettes at tile corners */}
            <path d="M0 10a10 10 0 0 0 10-10M54 0a10 10 0 0 0 10 10M64 54a10 10 0 0 0-10 10M10 64A10 10 0 0 0 0 54" />
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${pid})`} opacity={opacity} />
    </svg>
  );
}
