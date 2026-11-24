"use client";

import Link from "next/link";
import { Lockup } from "@sarpech/brand/Logo";
import { CornerOrnament } from "@sarpech/brand/ornaments/CornerOrnament";
import { ZariBorder } from "@sarpech/brand/ornaments/ZariBorder";
import { Dialog } from "@/components/ui/Dialog";
import { categories } from "@sarpech/core/categories";
import { PRIMARY_NAV } from "@/lib/nav";

/** The embroidered drawer: green ground, jaali texture, zari edges and corners. */
export function MobileNav({
  open,
  onClose,
  isActive,
  customerName,
}: {
  open: boolean;
  onClose: () => void;
  isActive: (h: string) => boolean;
  customerName: string | null;
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      label="Menu"
      variant="left"
      className="on-dark jaali-bg bg-brand-green text-ivory"
      closeClassName="text-ivory"
    >
      <div className="relative flex min-h-full flex-col">
        <CornerOrnament corner="bl" className="h-20 w-20 opacity-80" />
        <CornerOrnament corner="br" className="h-20 w-20 opacity-80" />
        <div className="px-6 pb-4 pt-6">
          <Lockup tone="ivory" emblemClassName="h-10 w-10" textClassName="text-lg" />
        </div>
        <ZariBorder />
        <nav aria-label="Site menu" className="flex-1 px-6 py-6">
          <ul className="space-y-1">
            {PRIMARY_NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onClose}
                  aria-current={isActive(item.href) ? "page" : undefined}
                  className="flex items-center gap-3 py-2.5 font-display text-sm uppercase tracking-[0.22em] aria-[current=page]:text-gold-light"
                >
                  <span aria-hidden className="size-1.5 rotate-45 border border-gold" />
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
          <p className="eyebrow mt-8 text-gold-light">Categories</p>
          <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-lg">
            {categories.map((c) => (
              <li key={c.slug}>
                <Link href={`/shop/${c.slug}`} onClick={onClose} className="link-thread">
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="px-6 pb-24 text-base text-ivory/80">
          <Link href={customerName ? "/account" : "/account/login"} onClick={onClose} className="btn-outline mb-3 w-full">
            {customerName ? `My Account · ${customerName.split(" ")[0]}` : "Sign in / Create account"}
          </Link>
          <Link href="/contact" onClick={onClose} className="btn-royal btn-royal-gold w-full">
            Book a Fitting
          </Link>
          <p className="mt-4 text-center italic">Crowned in Heritage</p>
        </div>
      </div>
    </Dialog>
  );
}
