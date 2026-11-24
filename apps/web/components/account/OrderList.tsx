import Link from "next/link";
import { ProductImage } from "@/components/shop/ProductImage";
import { designProduct } from "@sarpech/core/designer";
import { formatINR } from "@sarpech/core/format";
import type { Order, Product } from "@sarpech/core/types";
import { StatusBadge, orderDate } from "./shared";

/** Order cards for the account area. `products` resolves thumbnails by slug. */
export function OrderList({ orders, products }: { orders: Order[]; products: Map<string, Product> }) {
  return (
    <ul className="divide-y divide-mist">
      {orders.map((o) => {
        const pieces = o.items.reduce((s, i) => s + i.qty, 0);
        const thumbs = o.items.slice(0, 3);
        return (
          <li key={o.id}>
            <Link
              href={`/account/orders/${o.id}`}
              className="group flex flex-col gap-4 py-5 transition-colors sm:flex-row sm:items-center"
            >
              <div className="flex shrink-0 -space-x-3">
                {thumbs.map((i, n) => {
                  const p = i.design ? designProduct(i.design) : products.get(i.slug);
                  return (
                    <span key={`${i.slug}-${n}`} className="block h-16 w-14 overflow-hidden border-2 border-white bg-pearl shadow-card">
                      {p ? <ProductImage product={p} colorName={i.color} sizes="56px" /> : null}
                    </span>
                  );
                })}
              </div>
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="font-display text-xs tracking-[0.16em]">{o.id}</span>
                  <StatusBadge status={o.status} />
                </p>
                <p className="mt-1 truncate text-lg">{o.items.map((i) => i.name).join(", ")}</p>
                <p className="text-base text-ink-soft">
                  {orderDate(o.createdAt)} · {pieces} {pieces === 1 ? "piece" : "pieces"}
                </p>
              </div>
              <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end">
                <span className="font-display text-sm">{formatINR(o.total)}</span>
                <span className="link-thread font-display text-[0.62rem] uppercase tracking-[0.2em] text-ink-soft group-hover:text-brand-green">
                  View order →
                </span>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
