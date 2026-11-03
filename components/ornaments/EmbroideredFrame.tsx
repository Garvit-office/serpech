import type { ReactNode } from "react";
import { FourCorners } from "./CornerOrnament";
import { StitchIn } from "./StitchIn";

/**
 * A double gold frame — a solid thread and a dashed "stitch" line — with
 * filigree corners. Corners stitch themselves in when scrolled into view.
 */
export function EmbroideredFrame({
  children,
  className,
  cornerClassName = "h-14 w-14 sm:h-16 sm:w-16",
  animate = true,
}: {
  children: ReactNode;
  className?: string;
  cornerClassName?: string;
  animate?: boolean;
}) {
  const body = (
    <>
      <span aria-hidden className="pointer-events-none absolute inset-3 border border-gold/70" />
      <span aria-hidden className="pointer-events-none absolute inset-[18px] border border-dashed border-gold/60" />
      <FourCorners className={cornerClassName} animate={animate} />
      <div className="relative">{children}</div>
    </>
  );
  if (!animate) return <div className={`relative ${className ?? ""}`}>{body}</div>;
  return <StitchIn className={`relative ${className ?? ""}`}>{body}</StitchIn>;
}
