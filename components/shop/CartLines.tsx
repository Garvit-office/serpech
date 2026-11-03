"use client";

import Link from "next/link";
import { QuantityStepper } from "@/components/ui/QuantityStepper";
import { FIT_STYLES } from "@/lib/fit";
import { formatINR } from "@/lib/format";
import { lineKey, useCart } from "@/lib/store/cart";
import { ProductImage } from "./ProductImage";

/** Cart line items, shared by the drawer and the full cart page. */
export function CartLines({ compact = false, onNavigate }: { compact?: boolean; onNavigate?: () => void }) {
  const cart = useCart();
  return (
    <ul className="divide-y divide-mist">
      {cart.items.map((item) => {
        const key = lineKey(item);
        return (
          <li key={key} className="flex gap-4 py-5">
            <Link
              href={`/product/${item.slug}`}
              onClick={onNavigate}
              className={`block shrink-0 bg-pearl shadow-card ${compact ? "h-28 w-24" : "h-40 w-32 sm:h-48 sm:w-40"}`}
            >
              <ProductImage product={item.product} colorName={item.color} sizes="160px" />
            </Link>
            <div className="flex min-w-0 flex-1 flex-col">
              <div className="flex items-start justify-between gap-3">
                <Link
                  href={`/product/${item.slug}`}
                  onClick={onNavigate}
                  className="font-display text-[0.78rem] uppercase leading-snug tracking-[0.14em] hover:underline"
                >
                  {item.product.name}
                </Link>
                <span className="shrink-0 font-display text-sm">{formatINR(item.lineTotal)}</span>
              </div>
              <p className="mt-1 text-base text-ink-soft">
                {item.color} · {item.fit ? "Made to measure" : `Size ${item.size}`}
              </p>
              {item.fit && (
                <p className="text-sm text-ink-soft">
                  {FIT_STYLES.find((f) => f.value === item.fit!.preferences.fit)?.label} fit · chest {item.fit.measurements.chest} · waist{" "}
                  {item.fit.measurements.waist} cm
                </p>
              )}
              {item.product.salePrice && (
                <p className="text-sm text-ruby">
                  {formatINR(item.unitPrice)} each <s className="text-ink-soft">{formatINR(item.product.price)}</s>
                </p>
              )}
              <div className="mt-auto flex items-center justify-between pt-3">
                <QuantityStepper
                  size="sm"
                  min={0}
                  value={item.qty}
                  onChange={(v) => cart.setQty(key, v)}
                  label={`Quantity for ${item.product.name}`}
                />
                <button type="button" onClick={() => cart.remove(key)} className="link-thread text-base text-ink-soft">
                  Remove
                </button>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
