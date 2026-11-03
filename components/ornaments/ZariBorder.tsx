import { GoldGradient, stitch, useSvgId } from "./GoldGradient";

/**
 * A thin repeating zari band: paisley (buta), four-petal flowers and dots
 * between two fine threads. Tiles horizontally to any width.
 */
export function ZariBorder({
  className,
  tone = "gold",
  animate = false,
}: {
  className?: string;
  /** "gold" for white or green grounds; "soft" is a lighter band for dense areas. */
  tone?: "gold" | "soft";
  /** Stitch the threads in (wrap in <StitchIn>). */
  animate?: boolean;
}) {
  const pid = useSvgId("zari");
  const gid = useSvgId("zari-g");
  const s = animate ? stitch : {};
  return (
    <svg
      aria-hidden
      focusable="false"
      className={`block h-[22px] w-full ${tone === "soft" ? "opacity-70" : ""} ${className ?? ""}`}
      height="22"
    >
      <defs>
        <GoldGradient id={gid} />
        <pattern id={pid} width="64" height="22" patternUnits="userSpaceOnUse">
          {/* buta / paisley */}
          <path
            d="M13 16.5c-4.6 0-5.4-6.2-1.6-8.6 2.3-1.5 5.4-.8 5.6-3.4 2.3 3 1.6 8.4-1.4 10.8-.8.7-1.7 1.2-2.6 1.2z"
            fill="none"
            stroke={`url(#${gid})`}
            strokeWidth="0.9"
          />
          <circle cx="13" cy="12.6" r="1.1" fill={`url(#${gid})`} />
          {/* mirrored buta */}
          <path
            d="M51 16.5c4.6 0 5.4-6.2 1.6-8.6-2.3-1.5-5.4-.8-5.6-3.4-2.3 3-1.6 8.4 1.4 10.8.8.7 1.7 1.2 2.6 1.2z"
            fill="none"
            stroke={`url(#${gid})`}
            strokeWidth="0.9"
          />
          <circle cx="51" cy="12.6" r="1.1" fill={`url(#${gid})`} />
          {/* four-petal flower */}
          <g fill="none" stroke={`url(#${gid})`} strokeWidth="0.8">
            <ellipse cx="32" cy="7.6" rx="1.6" ry="2.8" />
            <ellipse cx="32" cy="14.4" rx="1.6" ry="2.8" />
            <ellipse cx="28.6" cy="11" rx="2.8" ry="1.6" />
            <ellipse cx="35.4" cy="11" rx="2.8" ry="1.6" />
          </g>
          <circle cx="32" cy="11" r="1" fill="#A3162B" />
          {/* seed dots */}
          <circle cx="22.5" cy="11" r="0.9" fill={`url(#${gid})`} />
          <circle cx="41.5" cy="11" r="0.9" fill={`url(#${gid})`} />
          <circle cx="0" cy="11" r="1.2" fill={`url(#${gid})`} />
          <circle cx="64" cy="11" r="1.2" fill={`url(#${gid})`} />
        </pattern>
      </defs>
      <line x1="0" y1="1" x2="100%" y2="1" stroke="#C9A04A" strokeWidth="0.8" {...s} />
      <line x1="0" y1="3" x2="100%" y2="3" stroke="#C9A04A" strokeWidth="0.4" strokeDasharray="2 2" />
      <rect x="0" y="0" width="100%" height="22" fill={`url(#${pid})`} />
      <line x1="0" y1="19" x2="100%" y2="19" stroke="#C9A04A" strokeWidth="0.4" strokeDasharray="2 2" />
      <line x1="0" y1="21" x2="100%" y2="21" stroke="#C9A04A" strokeWidth="0.8" {...s} />
    </svg>
  );
}
