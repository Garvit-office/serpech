"use client";

import Link from "next/link";
import { SarpechEmblem } from "@sarpech/brand/SarpechEmblem";
import { CartLines } from "@/components/shop/CartLines";
import { ZariBorder } from "@sarpech/brand/ornaments/ZariBorder";
import { Dialog } from "@/components/ui/Dialog";
import { formatINR } from "@sarpech/core/format";
import { useCatalog } from "@/lib/store/catalog";
import { useCart } from "@/lib/store/cart";

export function CartDrawer() {
  const cart = useCart();
  const { settings } = useCatalog();
  const remaining = settings.freeShippingThreshold - cart.subtotal;

  return (
    <Dialog open={cart.isOpen} onClose={cart.close} label="Shopping bag" variant="right" closeClassName="text-ivory">
      <div className="flex min-h-full flex-col">
        <div className="bg-brand-green px-6 pb-4 pt-5 text-ivory">
          <h2 className="font-display text-sm tracking-[0.26em]">Your Bag ({cart.count})</h2>
        </div>
        <ZariBorder />

        {cart.items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
            <SarpechEmblem tone="green" className="h-20 w-20 opacity-80" ruby={false} />
            <p className="mt-4 text-xl">Your bag awaits its first treasure.</p>
            <Link href="/shop" onClick={cart.close} className="btn-royal mt-6">
              Shop the Collection
            </Link>
          </div>
        ) : (
          <>
            <p className="border-b border-mist px-6 py-3 text-center text-base text-ink-soft">
              {remaining > 0 ? (
                <>
                  Add <strong className="text-brand-green">{formatINR(remaining)}</strong> for complimentary shipping
                </>
              ) : (
                "Your order ships complimentary, insured."
              )}
            </p>
            <div className="flex-1 px-6">
              <CartLines compact onNavigate={cart.close} />
            </div>
            <div className="sticky bottom-0 border-t border-mist bg-white px-6 py-5">
              <div className="flex items-baseline justify-between">
                <span className="eyebrow">Subtotal</span>
                <span className="font-display text-lg">{formatINR(cart.subtotal)}</span>
              </div>
              <p className="mt-1 text-sm text-ink-soft">Taxes included. Shipping calculated at checkout.</p>
              <div className="mt-4 grid gap-2">
                <Link href="/checkout" onClick={cart.close} className="btn-royal w-full">
                  Checkout
                </Link>
                <Link href="/cart" onClick={cart.close} className="btn-outline w-full">
                  View Bag
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </Dialog>
  );
}
