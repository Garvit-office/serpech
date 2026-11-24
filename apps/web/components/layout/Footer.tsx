import Link from "next/link";
import { SarpechEmblem } from "@sarpech/brand/SarpechEmblem";
import { Wordmark } from "@sarpech/brand/Logo";
import { ZariBorder } from "@sarpech/brand/ornaments/ZariBorder";
import { FOOTER_NAV } from "@/lib/nav";
import { SITE } from "@sarpech/core/format";

export function Footer() {
  return (
    <footer className="mt-auto">
      <ZariBorder className="bg-white" />
      <div className="on-dark jaali-bg bg-brand-green text-ivory">
        <div className="mx-auto grid max-w-7xl gap-12 px-6 py-16 md:grid-cols-[1.3fr_2fr] lg:px-8">
          <div className="flex flex-col items-start">
            <SarpechEmblem tone="gold" className="h-24 w-24" title="SARPECH emblem" />
            <Wordmark tone="ivory" devanagari className="mt-5 text-2xl" />
            <p className="mt-4 max-w-xs text-lg italic text-ivory/85">{SITE.tagline}</p>
            <p className="eyebrow mt-2 text-gold-light">{SITE.secondary}</p>
          </div>
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            {Object.entries(FOOTER_NAV).map(([title, links]) => (
              <nav key={title} aria-label={title}>
                <h2 className="eyebrow text-gold-light">{title}</h2>
                <ul className="mt-4 space-y-2.5 text-lg">
                  {links.map((l) => (
                    <li key={l.label}>
                      <Link href={l.href} className="link-thread text-ivory/90 hover:text-ivory">
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </div>
        <div className="border-t border-gold/25">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-6 py-6 text-base text-ivory/75 sm:flex-row lg:px-8">
            <p>© 2026 SARPECH Royal Heritage Wear. Made in India.</p>
            <p className="flex items-center gap-2">
              <SarpechEmblem tone="white" ring={false} ruby={false} className="h-5 w-5 opacity-80" />
              Jaipur · Jodhpur · New Delhi
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
