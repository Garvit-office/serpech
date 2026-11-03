"use client";

import Link from "next/link";
import { SarpechEmblem } from "@/components/brand/SarpechEmblem";
import { formatINR } from "@/lib/format";
import { useCatalog } from "@/lib/store/catalog";
import { useCart } from "@/lib/store/cart";
import { CartLines } from "./CartLines";
import { OrderSummary } from "./OrderSummary";

export function CartPageView() {
  const cart = useCart();
  const { settings } = useCatalog();

  if (!cart.ready) return <div className="mx-auto h-64 max-w-6xl" aria-busy="true" />;

  if (cart.items.length === 0) {
    return (
      <div className="mx-auto max-w-xl px-4 pb-24 text-center">
        <SarpechEmblem tone="green" ruby={false} className="mx-auto h-24 w-24 opacity-80" />
        <p className="mt-6 text-2xl">Your bag awaits its first treasure.</p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/shop" className="btn-royal">
            Shop the Collection
          </Link>
          <Link href="/wishlist" className="btn-outline">
            View Wishlist
          </Link>
        </div>
      </div>
    );
  }

  const remaining = settings.freeShippingThreshold - cart.subtotal;
  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-4 pb-24 sm:px-6 lg:grid-cols-[1fr_22rem] lg:px-8">
      <section aria-label="Items in your bag">
        {remaining > 0 && (
          <p className="border border-gold/50 bg-pearl px-4 py-3 text-center text-lg">
            Add <strong>{formatINR(remaining)}</strong> more for complimentary insured shipping.
          </p>
        )}
        <CartLines />
        <Link href="/shop" className="link-thread mt-4 inline-block font-display text-xs uppercase tracking-[0.22em]">
          ← Continue shopping
        </Link>
      </section>
      <aside aria-label="Order summary" className="lg:sticky lg:top-32 lg:self-start">
        <OrderSummary>
          <Link href="/checkout" className="btn-royal mt-6 w-full">
            Proceed to Checkout
          </Link>
        </OrderSummary>
      </aside>
    </div>
  );
}
