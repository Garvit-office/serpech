"use client";

import Link from "next/link";
import { useState } from "react";
import { CheckIcon, PlusIcon } from "@/components/ui/icons";
import { allSizesSoldOut, stockLeft } from "@/lib/catalog-shared";
import type { Product } from "@/lib/types";
import { useCart } from "@/lib/store/cart";
import { Price } from "./Price";
import { ProductImage, productImages } from "./ProductImage";
import { WishlistButton } from "./WishlistButton";

const TAG_LABEL = { new: "New", bestseller: "Bestseller", "wedding-edit": "Wedding Edit" } as const;

/**
 * Product tile: off-white card, soft shadow, a stitched double gold frame on
 * hover/focus, wishlist toggle and a quick-add size picker.
 */
export function ProductCard({ product, priority = false }: { product: Product; priority?: boolean }) {
  const cart = useCart();
  const [picking, setPicking] = useState(false);
  const [added, setAdded] = useState<string | null>(null);
  const color = product.colors[0];
  const onSale = !!product.salePrice;
  const off = onSale ? Math.round((1 - product.salePrice! / product.price) * 100) : 0;
  const soldOut = allSizesSoldOut(product);
  const available = product.sizes.filter((s) => stockLeft(product, s) !== 0);
  const badge = soldOut ? "Sold out" : onSale ? `${product.saleLabel ?? "Sale"} · ${off}% off` : product.tags[0] ? TAG_LABEL[product.tags[0]] : null;
  const hasAlt = productImages(product).length > 1;
  const href = `/product/${product.slug}`;

  const quickAdd = (size: string) => {
    cart.add({ productId: product.id, slug: product.slug, size, color: color.name }, { openDrawer: false });
    setAdded(size);
    setPicking(false);
    window.setTimeout(() => setAdded(null), 1800);
  };

  return (
    <article className="group stitch-frame flex flex-col bg-pearl shadow-card transition-shadow duration-300 hover:shadow-lift">
      <div className="relative aspect-[5/6] overflow-hidden">
        <Link href={href} tabIndex={-1} aria-hidden className="relative block h-full w-full transition-transform duration-500 group-hover:scale-[1.03]">
          <ProductImage product={product} priority={priority} />
          {hasAlt && (
            <span className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
              <ProductImage product={product} index={1} />
            </span>
          )}
        </Link>
        {badge && (
          <span
            className={`absolute left-4 top-4 z-[4] px-2 py-0.5 font-display text-[0.6rem] uppercase tracking-[0.2em] ${
              soldOut ? "bg-brand-green text-ivory" : onSale ? "bg-ruby text-white" : "bg-white/90 text-brand-green"
            }`}
          >
            {badge}
          </span>
        )}
        <WishlistButton slug={product.slug} name={product.name} className="absolute right-3 top-3 z-[4]" />

        {/* Quick add */}
        <div className={`absolute inset-x-3 bottom-3 z-[4] ${soldOut ? "hidden" : ""}`}>
          {picking ? (
            <div role="group" aria-label={`Choose a size for ${product.name}`} className="bg-white p-2 shadow-card">
              <div className="flex flex-wrap justify-center gap-1">
                {available.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => quickAdd(s)}
                    className="min-h-9 min-w-9 border border-brand-green/30 px-2 font-display text-[0.65rem] tracking-[0.1em] hover:border-brand-green hover:bg-brand-green hover:text-ivory"
                  >
                    {s}
                  </button>
                ))}
              </div>
              <button type="button" onClick={() => setPicking(false)} className="mt-1 w-full text-sm text-ink-soft underline">
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => (available.length === 1 && product.sizes.length === 1 ? quickAdd(available[0]) : setPicking(true))}
              aria-label={`Quick add ${product.name}`}
              className="flex h-10 w-full translate-y-1 items-center justify-center gap-2 bg-brand-green font-display text-[0.65rem] uppercase tracking-[0.22em] text-ivory opacity-100 transition duration-300 hover:bg-brand-green-2 focus-visible:translate-y-0 focus-visible:opacity-100 sm:opacity-0 sm:group-hover:translate-y-0 sm:group-hover:opacity-100"
            >
              {added ? (
                <>
                  <CheckIcon /> Added · {added}
                </>
              ) : (
                <>
                  <PlusIcon /> Quick Add
                </>
              )}
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col px-4 pb-4 pt-3">
        <h3 className="font-display text-[0.74rem] font-medium leading-snug tracking-[0.14em]">
          <Link href={href} className="after:absolute after:inset-0 after:z-[2] focus-visible:outline-none">
            {product.name}
          </Link>
        </h3>
        <p className="mt-0.5 text-[0.95rem] text-ink-soft">{product.fabric.split(" with ")[0]}</p>
        <div className="mt-auto flex items-center justify-between pt-2">
          <Price product={product} />
          <ul className="flex gap-1" aria-label={`${product.colors.length} colours`}>
            {product.colors.slice(0, 4).map((c) => (
              <li key={c.name} title={c.name} className="size-3 rounded-full border border-brand-green/25" style={{ background: c.hex }}>
                <span className="sr-only">{c.name}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </article>
  );
}
