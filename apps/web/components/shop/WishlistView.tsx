"use client";

import Link from "next/link";
import { useCatalog } from "@/lib/store/catalog";
import { useWishlist } from "@/lib/store/wishlist";
import type { Product } from "@sarpech/core/types";
import { ProductCard } from "./ProductCard";

export function WishlistView() {
  const wl = useWishlist();
  const { getProduct } = useCatalog();
  if (!wl.ready) return <div className="h-64" aria-busy="true" />;
  const items = wl.slugs.map(getProduct).filter((p): p is Product => !!p);

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-xl px-4 pb-24 text-center">
        <p className="text-2xl">Nothing set aside yet.</p>
        <p className="mt-2 text-lg text-ink-soft">Tap the heart on any piece to keep it here.</p>
        <Link href="/shop" className="btn-royal mt-8">
          Shop the Collection
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
      <p className="mb-6 text-center text-lg text-ink-soft">
        {items.length} {items.length === 1 ? "piece" : "pieces"}
      </p>
      <ul className="grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 md:grid-cols-3 lg:grid-cols-4">
        {items.map((p) => (
          <li key={p.id}>
            <ProductCard product={p} />
          </li>
        ))}
      </ul>
    </div>
  );
}
