import type { ReactNode } from "react";
import { Wordmark } from "@sarpech/brand/Logo";
import { SarpechEmblem } from "@sarpech/brand/SarpechEmblem";
import { FourCorners } from "@sarpech/brand/ornaments/CornerOrnament";
import { Jaali } from "@sarpech/brand/ornaments/Jaali";
import { StitchIn } from "@sarpech/brand/ornaments/StitchIn";

/**
 * Royal-modern sign-in layout shared by the admin and customer accounts.
 * Desktop: a deep-green ceremonial panel (jaali, framed emblem that stitches
 * itself in) beside an airy white form. Mobile: a compact green band on top.
 *
 * `variant="page"` fills the viewport (admin, outside the store chrome);
 * `variant="card"` is a framed two-column card inside the store layout.
 */
export function AuthShell({
  variant = "card",
  eyebrow,
  motto,
  tagline,
  points,
  title,
  intro,
  children,
  footer,
}: {
  variant?: "page" | "card";
  /** Small label above the wordmark on the green panel, e.g. "The Atelier". */
  eyebrow: string;
  /** Italic line under the wordmark. */
  motto: string;
  /** Short paragraph on the green panel. */
  tagline?: string;
  /** Optional benefit list on the green panel. */
  points?: string[];
  title: string;
  intro?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const page = variant === "page";

  const ceremonial = (
    <div className="on-dark relative isolate hidden overflow-hidden bg-brand-green text-ivory lg:flex">
      <Jaali opacity={0.05} />
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_40%,rgb(31_58_46/0.95),transparent_70%)]" />
      <StitchIn className="relative m-6 flex flex-1 flex-col items-center justify-center px-10 py-14 text-center xl:m-8">
        <span aria-hidden className="pointer-events-none absolute inset-0 border border-gold/50" />
        <span aria-hidden className="pointer-events-none absolute inset-2 border border-dashed border-gold/25" />
        <FourCorners className="h-16 w-16 xl:h-20 xl:w-20" animate />

        <div className="gold-shimmer rounded-full">
          <SarpechEmblem tone="gold" stitch strokeWidth={1.6} className={`${page ? "h-48 w-48 xl:h-56 xl:w-56" : "h-40 w-40"} animate-fade-up`} />
        </div>
        <p className="eyebrow mt-8 animate-fade-up text-gold-light [animation-delay:120ms]">{eyebrow}</p>
        <Wordmark tone="gold" className="mt-3 animate-fade-up text-3xl [animation-delay:200ms] xl:text-4xl" />
        <p className="mt-3 animate-fade-up font-serif text-2xl italic text-ivory/90 [animation-delay:280ms]">{motto}</p>
        {tagline && <p className="mx-auto mt-6 max-w-sm animate-fade-up text-lg leading-relaxed text-ivory/75 [animation-delay:360ms]">{tagline}</p>}
        {points && (
          <ul className="mx-auto mt-7 grid max-w-xs animate-fade-up gap-2.5 text-left text-lg text-ivory/85 [animation-delay:440ms]">
            {points.map((p) => (
              <li key={p} className="flex items-start gap-3">
                <span aria-hidden className="mt-2.5 size-1.5 shrink-0 rotate-45 border border-gold" />
                {p}
              </li>
            ))}
          </ul>
        )}
      </StitchIn>
    </div>
  );

  // Compact band for small screens (the ceremonial panel is desktop-only).
  const band = (
    <div className="on-dark relative isolate overflow-hidden bg-brand-green px-6 py-7 text-center text-ivory lg:hidden">
      <Jaali opacity={0.035} size={48} />
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_30%,rgb(31_58_46/0.9),transparent_75%)]" />
      <SarpechEmblem tone="gold" className="relative mx-auto h-16 w-16" />
      <p className="eyebrow relative mt-3 text-gold-light">{eyebrow}</p>
      <p className="relative mt-1 font-serif text-lg italic text-ivory/85">{motto}</p>
    </div>
  );

  const form = (
    <div className="flex flex-col justify-center bg-[radial-gradient(ellipse_at_50%_0%,#fffdf9_0%,#f8f4ec_70%,#f3eee3_100%)] px-6 py-10 sm:px-12 lg:px-14 lg:py-14 xl:px-20">
      <div className="mx-auto w-full max-w-md">
        <h1 className="text-2xl tracking-[0.14em] sm:text-3xl">{title}</h1>
        <span aria-hidden className="mt-4 block h-px w-16 bg-gradient-to-r from-gold to-transparent" />
        {intro && <div className="mt-4 text-lg text-ink-soft">{intro}</div>}
        <div className="mt-8">{children}</div>
        {footer && <div className="mt-8 border-t border-mist pt-6 text-base text-ink-soft">{footer}</div>}
      </div>
    </div>
  );

  if (page) {
    return (
      <div className="grid min-h-dvh bg-[#f8f4ec] lg:grid-cols-[minmax(0,45fr)_minmax(0,55fr)]">
        {band}
        {ceremonial}
        {form}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <div className="relative grid overflow-hidden border border-mist bg-white shadow-lift lg:min-h-[40rem] lg:grid-cols-[minmax(0,45fr)_minmax(0,55fr)]">
        {band}
        {ceremonial}
        {form}
      </div>
    </div>
  );
}
