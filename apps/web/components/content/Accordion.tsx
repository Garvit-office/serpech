import type { ReactNode } from "react";

/** Native <details> accordion with a gold chevron. Keyboard-accessible by default. */
export function AccordionItem({ question, children, open = false }: { question: string; children: ReactNode; open?: boolean }) {
  return (
    <details open={open} className="group border-b border-mist">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 text-left [&::-webkit-details-marker]:hidden">
        <span className="text-xl font-medium">{question}</span>
        <svg
          viewBox="0 0 24 24"
          aria-hidden
          className="size-5 shrink-0 text-gold-dark transition-transform duration-300 group-open:rotate-180"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </summary>
      <div className="pb-6 pr-10 text-lg leading-relaxed text-ink-soft [&_a]:text-brand-green [&_a]:underline">{children}</div>
    </details>
  );
}
