import { SarpechEmblem } from "@/components/brand/SarpechEmblem";

/**
 * Centred small sarpech with fine gold threads and dots running out to each
 * side. Use between sections on white or green.
 */
export function SectionDivider({ className, size = "md" }: { className?: string; size?: "sm" | "md" }) {
  const emblem = size === "sm" ? "h-7 w-7" : "h-10 w-10";
  return (
    <div role="presentation" className={`flex items-center justify-center gap-2 sm:gap-3 ${className ?? ""}`}>
      <Thread side="left" />
      <SarpechEmblem tone="gold" ring={false} className={`${emblem} shrink-0`} strokeWidth={3} />
      <Thread side="right" />
    </div>
  );
}

function Thread({ side }: { side: "left" | "right" }) {
  const dir = side === "left" ? "bg-gradient-to-l" : "bg-gradient-to-r";
  return (
    <div className={`flex max-w-56 flex-1 items-center gap-1.5 ${side === "left" ? "flex-row-reverse" : ""}`}>
      <span className="size-1.5 shrink-0 rotate-45 border border-gold" />
      <span className="size-1 shrink-0 rounded-full bg-gold" />
      <span className="flex flex-1 flex-col gap-[3px]">
        <span className={`h-px ${dir} from-gold to-transparent`} />
        <span className={`h-px ${dir} from-gold/50 via-gold/20 to-transparent`} />
      </span>
    </div>
  );
}
