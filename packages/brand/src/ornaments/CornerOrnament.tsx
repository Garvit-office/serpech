import { GoldGradient, stitch, useSvgId } from "./GoldGradient";

export type Corner = "tl" | "tr" | "bl" | "br";

const ROTATE: Record<Corner, string> = {
  tl: "",
  tr: "translate(80 0) scale(-1 1)",
  bl: "translate(0 80) scale(1 -1)",
  br: "translate(80 80) scale(-1 -1)",
};

const POSITION: Record<Corner, string> = {
  tl: "left-0 top-0",
  tr: "right-0 top-0",
  bl: "left-0 bottom-0",
  br: "right-0 bottom-0",
};

/** Filigree corner: double bracket, a curling tendril, leaf sprays and a buta. */
export function CornerOrnament({
  corner = "tl",
  className = "h-16 w-16",
  animate = false,
  absolute = true,
}: {
  corner?: Corner;
  className?: string;
  animate?: boolean;
  absolute?: boolean;
}) {
  const gid = useSvgId("corner");
  const s = animate ? stitch : {};
  const paint = `url(#${gid})`;
  return (
    <svg
      viewBox="0 0 80 80"
      aria-hidden
      focusable="false"
      className={`pointer-events-none ${absolute ? `absolute ${POSITION[corner]}` : ""} ${className}`}
    >
      <defs>
        <GoldGradient id={gid} />
      </defs>
      <g transform={ROTATE[corner]} fill="none" stroke={paint} strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 77V20Q3 3 20 3h57" strokeWidth="1.3" {...s} />
        <path d="M9 62V24Q9 9 24 9h38" strokeWidth="0.7" strokeDasharray="1.6 2.2" />
        <path d="M22 22c10-3 17 5 12 12-3.6 4.6-10 2-8-2.4 1.3-2.6 4.8-2 4.8.6" strokeWidth="1" {...s} />
        <path d="M9 42c8-1 13-6 14-14M42 9c-1 8-6 13-14 14" strokeWidth="0.9" {...s} />
        <path d="M15 52c4-1 6-4 6-8M52 15c-1 4-4 6-8 6" strokeWidth="0.8" {...s} />
        {/* buta in the corner */}
        <path d="M13.5 18.5c-3-3-1.5-7.5 2.2-7.3 2.4.1 3.4 2.6 5.6 1.6-.6 3.4-4.4 6-7.8 5.7z" strokeWidth="0.9" {...s} />
        <g fill={paint} stroke="none">
          <circle cx="3" cy="77" r="1.6" />
          <circle cx="77" cy="3" r="1.6" />
          <circle cx="9" cy="67" r="1.1" />
          <circle cx="67" cy="9" r="1.1" />
          <circle cx="15" cy="57" r="0.9" />
          <circle cx="57" cy="15" r="0.9" />
          <circle cx="15.6" cy="15.2" r="1" />
        </g>
      </g>
    </svg>
  );
}

/** All four corners, for framing a positioned container. */
export function FourCorners({ className, animate }: { className?: string; animate?: boolean }) {
  return (
    <>
      {(["tl", "tr", "bl", "br"] as Corner[]).map((c) => (
        <CornerOrnament key={c} corner={c} className={className} animate={animate} />
      ))}
    </>
  );
}
