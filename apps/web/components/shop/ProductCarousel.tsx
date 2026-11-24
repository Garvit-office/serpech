"use client";

import { useRef } from "react";
import { ChevronIcon } from "@/components/ui/icons";
import type { Product } from "@sarpech/core/types";
import { ProductCard } from "./ProductCard";

/** Horizontally scrolling, snap-aligned product rail with prev/next controls. */
export function ProductCarousel({ products, label }: { products: Product[]; label: string }) {
  const rail = useRef<HTMLUListElement>(null);
  const scroll = (dir: 1 | -1) => {
    const el = rail.current;
    if (!el) return;
    const card = el.querySelector("li");
    const step = card ? card.getBoundingClientRect().width + 20 : el.clientWidth * 0.8;
    el.scrollBy({ left: dir * step * 2, behavior: "smooth" });
  };
  return (
    <div className="relative" role="region" aria-roledescription="carousel" aria-label={label}>
      <ul
        ref={rail}
        className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-px-4 px-4 pb-6 pt-1 sm:-mx-6 sm:scroll-px-6 sm:px-6"
      >
        {products.map((p, i) => (
          <li key={p.id} className="w-[68%] shrink-0 snap-start sm:w-[42%] md:w-[30%] lg:w-[23%]" aria-label={`${i + 1} of ${products.length}`}>
            <ProductCard product={p} />
          </li>
        ))}
      </ul>
      <div className="mt-2 flex justify-center gap-3">
        <button type="button" onClick={() => scroll(-1)} aria-label="Previous products" className="grid size-11 place-items-center border border-brand-green/40 hover:border-gold hover:bg-pearl">
          <ChevronIcon dir="left" />
        </button>
        <button type="button" onClick={() => scroll(1)} aria-label="Next products" className="grid size-11 place-items-center border border-brand-green/40 hover:border-gold hover:bg-pearl">
          <ChevronIcon dir="right" />
        </button>
      </div>
    </div>
  );
}
