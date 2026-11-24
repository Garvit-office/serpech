import { Wordmark } from "./Logo";
import { SarpechEmblem } from "./SarpechEmblem";

/**
 * Branded loading state: the SARPECH emblem stitches itself in, then breathes,
 * with a gold thread running beneath. Pure CSS (see globals.css → "Brand loader"),
 * so it animates before any JavaScript arrives. Motion is skipped under
 * prefers-reduced-motion — the emblem simply appears.
 *
 * tone="light": ivory ground (store, admin). tone="dark": green ground (splash).
 */
export function BrandLoader({ tone = "light", label = "Loading", className = "" }: { tone?: "light" | "dark"; label?: string; className?: string }) {
  const dark = tone === "dark";
  return (
    <div role="status" aria-live="polite" className={`sp-loader flex flex-col items-center justify-center text-center ${className}`}>
      <div className="sp-loader-breathe">
        <SarpechEmblem tone="gold" stitch strokeWidth={1.5} className="h-24 w-24 sm:h-28 sm:w-28" />
      </div>
      <Wordmark tone={dark ? "gold" : "green"} className="mt-5 animate-fade-up text-xl [animation-delay:500ms] sm:text-2xl" />
      <span aria-hidden className={`sp-loader-thread mt-5 block h-px w-28 ${dark ? "bg-gold/25" : "bg-gold/30"}`} />
      <span className="sr-only">{label}…</span>
    </div>
  );
}

/** Full-area loader for Suspense fallbacks (e.g. My Account). Avoid a store-wide loading.tsx: it makes notFound() pages answer 200 instead of 404. */
export function PageLoader({ label }: { label?: string }) {
  return <BrandLoader label={label} className="min-h-[60vh] bg-[radial-gradient(ellipse_at_50%_40%,#fffdf9,transparent_70%)] py-24" />;
}
