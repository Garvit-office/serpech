"use client";

import type { ReactNode } from "react";
import { formatINR } from "@sarpech/core/format";
import { lineKey, useCart } from "@/lib/store/cart";
import { ProductImage } from "./ProductImage";

/** Totals box shared by the cart page and checkout. `shippingOverride` lets checkout apply express shipping. */
export function OrderSummary({
  children,
  showItems = false,
  shippingOverride,
  discount = 0,
  couponCode,
}: {
  children?: ReactNode;
  showItems?: boolean;
  shippingOverride?: number;
  discount?: number;
  couponCode?: string;
}) {
  const cart = useCart();
  const shipping = shippingOverride ?? cart.shipping;
  return (
    <div className="relative border border-mist bg-white p-6 shadow-card">
      <span aria-hidden className="pointer-events-none absolute inset-1.5 border border-dashed border-gold/40" />
      <h2 className="font-display text-sm tracking-[0.24em]">Order Summary</h2>
      {showItems && (
        <ul className="mt-4 divide-y divide-mist">
          {cart.items.map((i) => (
            <li key={lineKey(i)} className="flex items-center gap-3 py-3">
              <span className="relative block h-16 w-14 shrink-0 bg-pearl">
                <ProductImage product={i.product} colorName={i.color} sizes="56px" />
                <span className="absolute -right-2 -top-2 grid size-5 place-items-center rounded-full bg-brand-green font-display text-[0.6rem] text-ivory">
                  {i.qty}
                </span>
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-display text-[0.68rem] uppercase tracking-[0.12em]">{i.product.name}</span>
                <span className="block text-sm text-ink-soft">
                  {i.design ? "Your design" : i.color} · {i.size}
                </span>
              </span>
              <span className="text-base">{formatINR(i.lineTotal)}</span>
            </li>
          ))}
        </ul>
      )}
      <dl className="mt-4 space-y-2 text-lg">
        <div className="flex justify-between">
          <dt>Subtotal</dt>
          <dd>{formatINR(cart.subtotal)}</dd>
        </div>
        {discount > 0 && (
          <div className="flex justify-between text-ruby">
            <dt>Coupon {couponCode}</dt>
            <dd>−{formatINR(discount)}</dd>
          </div>
        )}
        <div className="flex justify-between">
          <dt>Shipping</dt>
          <dd>{shipping === 0 ? "Complimentary" : formatINR(shipping)}</dd>
        </div>
        <div className="flex justify-between border-t border-mist pt-3 font-semibold">
          <dt className="font-display text-sm tracking-[0.2em]">Total</dt>
          <dd className="text-xl">{formatINR(cart.subtotal - discount + shipping)}</dd>
        </div>
      </dl>
      <p className="mt-2 text-sm text-ink-soft">Prices include GST.</p>
      {children}
    </div>
  );
}
