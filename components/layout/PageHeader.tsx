import type { ReactNode } from "react";
import { FourCorners } from "@/components/ornaments/CornerOrnament";
import { SectionDivider } from "@/components/ornaments/SectionDivider";
import { StitchIn } from "@/components/ornaments/StitchIn";

/**
 * Page title block. `tone="white"` (default) is a quiet header on the white
 * page; `tone="green"` is a framed band with jaali for feature pages.
 */
export function PageHeader({
  eyebrow,
  title,
  intro,
  tone = "white",
  children,
}: {
  eyebrow?: string;
  title: string;
  intro?: ReactNode;
  tone?: "white" | "green";
  children?: ReactNode;
}) {
  if (tone === "green") {
    return (
      <section className="on-dark jaali-bg bg-brand-green px-4 py-6 text-ivory sm:px-6">
        <StitchIn className="relative mx-auto max-w-7xl px-6 py-14 text-center sm:py-20">
          <span aria-hidden className="pointer-events-none absolute inset-0 border border-gold/40" />
          <FourCorners className="h-14 w-14 sm:h-20 sm:w-20" animate />
          {eyebrow && <p className="eyebrow text-gold-light">{eyebrow}</p>}
          <h1 className="mt-3 text-3xl text-ivory sm:text-5xl">{title}</h1>
          {intro && <div className="mx-auto mt-5 max-w-2xl text-xl text-ivory/85">{intro}</div>}
          {children}
        </StitchIn>
      </section>
    );
  }
  return (
    <header className="mx-auto max-w-4xl px-4 pb-6 pt-12 text-center sm:px-6 sm:pt-16">
      {eyebrow && <p className="eyebrow text-ink-soft">{eyebrow}</p>}
      <h1 className="mt-3 text-3xl sm:text-4xl">{title}</h1>
      {intro && <div className="mx-auto mt-4 max-w-2xl text-xl text-ink-soft">{intro}</div>}
      <SectionDivider className="mt-8" />
      {children}
    </header>
  );
}
