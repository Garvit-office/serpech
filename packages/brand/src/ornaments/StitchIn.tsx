"use client";

import { useEffect, useRef, type ElementType, type ReactNode } from "react";

/**
 * Adds `.is-stitched` when the element scrolls into view, which animates every
 * descendant SVG stroke marked with `data-stitch` from 0 to full length.
 */
export function StitchIn({
  children,
  className,
  as: Tag = "div",
  threshold = 0.25,
}: {
  children: ReactNode;
  className?: string;
  as?: ElementType;
  threshold?: number;
}) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const stitch = () => el.classList.add("is-stitched");
    if (typeof IntersectionObserver === "undefined") return stitch();
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          stitch();
          io.disconnect();
        }
      },
      { threshold },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);

  return (
    <Tag ref={ref} className={`stitch-in ${className ?? ""}`}>
      {children}
    </Tag>
  );
}
