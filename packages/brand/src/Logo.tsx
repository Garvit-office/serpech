import { SarpechEmblem, type EmblemTone } from "./SarpechEmblem";

/** Full primary logo: gold emblem inside its ring on the deep-green ground. */
export function LogoRoundel({ className, title = "SARPECH" }: { className?: string; title?: string }) {
  return (
    <span className={`inline-block rounded-full bg-brand-green ${className ?? ""}`}>
      <SarpechEmblem tone="gold" title={title} className="h-full w-full" />
    </span>
  );
}

/** Wordmark set in Cinzel with wide tracking. */
export function Wordmark({
  className,
  tone = "green",
  devanagari = false,
}: {
  className?: string;
  tone?: "green" | "ivory" | "gold";
  devanagari?: boolean;
}) {
  const color = tone === "green" ? "text-brand-green" : tone === "ivory" ? "text-ivory" : "text-zari";
  return (
    <span className={`inline-flex flex-col leading-none ${className ?? ""}`}>
      <span className={`font-display font-semibold tracking-[0.32em] ${color}`}>SARPECH</span>
      {devanagari && (
        <span
          lang="hi"
          className={`mt-1 font-serif text-[0.55em] tracking-[0.2em] ${tone === "green" ? "text-ink-soft" : "text-gold-light"}`}
        >
          सरपेच
        </span>
      )}
    </span>
  );
}

/**
 * Horizontal lockup: emblem + wordmark. Used in the header.
 * `tone` sets the wordmark colour; the emblem is gold on dark grounds and
 * green on white so it keeps contrast at small sizes.
 */
export function Lockup({
  tone = "ivory",
  className,
  emblemClassName = "h-11 w-11",
  textClassName = "text-xl",
}: {
  tone?: "ivory" | "green";
  className?: string;
  emblemClassName?: string;
  textClassName?: string;
}) {
  const emblemTone: EmblemTone = tone === "ivory" ? "gold" : "green";
  return (
    <span className={`inline-flex items-center gap-3 ${className ?? ""}`}>
      <SarpechEmblem tone={emblemTone} className={emblemClassName} ruby />
      <Wordmark tone={tone} className={textClassName} />
    </span>
  );
}
