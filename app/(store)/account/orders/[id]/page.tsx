import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Panel, StatusBadge, orderDate } from "@/components/account/shared";
import { ProductImage } from "@/components/shop/ProductImage";
import { getAllProducts } from "@/lib/catalog";
import { FIT_STYLES } from "@/lib/fit";
import { formatINR } from "@/lib/format";
import { requireCustomer } from "@/lib/server/customer-auth";
import { findOrder } from "@/lib/server/orders";
import type { OrderStatus } from "@/lib/types";

export const metadata: Metadata = { title: "Order", robots: { index: false, follow: false } };

// Private, per-customer page: always rendered at request time, never prerendered.
export const instant = false;

const STEPS: { status: OrderStatus; label: string }[] = [
  { status: "placed", label: "Placed" },
  { status: "processing", label: "Being prepared" },
  { status: "shipped", label: "Shipped" },
  { status: "delivered", label: "Delivered" },
];
const STEP_INDEX: Partial<Record<OrderStatus, number>> = { placed: 0, paid: 0, processing: 1, shipped: 2, delivered: 3 };

// Rendered without a Suspense boundary on purpose: the ownership check runs
// before any HTML is sent, so a missing or someone else's order returns a real 404.
export default async function AccountOrderPage(props: PageProps<"/account/orders/[id]">) {
  const id = decodeURIComponent((await props.params).id);
  const c = await requireCustomer(`/account/orders/${encodeURIComponent(id)}`);
  const order = findOrder(id);
  // Only the owner sees an order: linked to this account, or an earlier guest order with the same email.
  const mine = order && (order.customerId === c.id || (!order.customerId && order.customer.email.toLowerCase() === c.email.toLowerCase()));
  if (!order || !mine) notFound();

  const products = new Map((await getAllProducts()).map((p) => [p.slug, p]));
  const a = order.customer;
  const step = STEP_INDEX[order.status];
  const ended = order.status === "cancelled" || order.status === "refunded";

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <Link href="/account?tab=orders" className="link-thread text-base text-ink-soft">
        ← All orders
      </Link>
      <header className="mt-4 flex flex-col gap-3 border-b border-mist pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow text-gold-dark">Order</p>
          <h1 className="mt-2 text-2xl tracking-[0.12em] sm:text-3xl">{order.id}</h1>
          <p className="mt-2 text-lg text-ink-soft">Placed {orderDate(order.createdAt)}</p>
        </div>
        <StatusBadge status={order.status} />
      </header>

      {!ended && step !== undefined && (
        <ol className="mt-8 grid grid-cols-4 gap-2" aria-label="Order progress">
          {STEPS.map((s, i) => (
            <li key={s.status} aria-current={i === step ? "step" : undefined} className="text-center">
              <span className={`block h-1 ${i <= step ? "bg-gold" : "bg-mist"}`} />
              <span className={`mt-2 block font-display text-[0.6rem] uppercase tracking-[0.16em] ${i <= step ? "text-brand-green" : "text-ink-soft"}`}>{s.label}</span>
            </li>
          ))}
        </ol>
      )}
      {order.status === "placed" && order.paymentRef && !order.paymentId && (
        <p className="mt-6 border border-gold/60 bg-pearl px-4 py-3 text-lg">
          Payment for this order wasn&apos;t completed, so it isn&apos;t confirmed yet. Unpaid orders are released after an hour; you&apos;re welcome to
          order again from your bag.
        </p>
      )}
      {ended && (
        <p className="mt-8 border border-mist bg-pearl px-4 py-3 text-lg">
          This order was {order.status}. Questions?{" "}
          <Link href="/contact" className="underline decoration-gold underline-offset-4">
            Contact us
          </Link>
          .
        </p>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <Panel title="PIECES">
          <ul className="divide-y divide-mist">
            {order.items.map((i, n) => {
              const p = products.get(i.slug);
              return (
                <li key={`${i.slug}-${i.size}-${n}`} className="flex gap-4 py-4 first:pt-0 last:pb-0">
                  <span className="block h-24 w-20 shrink-0 overflow-hidden bg-pearl">{p ? <ProductImage product={p} colorName={i.color} sizes="80px" /> : null}</span>
                  <div className="min-w-0 flex-1">
                    {p ? (
                      <Link href={`/product/${i.slug}`} className="text-lg underline decoration-gold/0 underline-offset-4 hover:decoration-gold">
                        {i.name}
                      </Link>
                    ) : (
                      <p className="text-lg">{i.name}</p>
                    )}
                    <p className="text-base text-ink-soft">
                      {i.color} · {i.size} · qty {i.qty}
                    </p>
                    {i.fit && (
                      <p className="mt-1 text-sm text-ink-soft">
                        Made to measure · {FIT_STYLES.find((f) => f.value === i.fit!.preferences.fit)?.label} fit
                      </p>
                    )}
                  </div>
                  <p className="font-display text-sm" style={{ fontVariantNumeric: "tabular-nums" }}>
                    {formatINR(i.unitPrice * i.qty)}
                  </p>
                </li>
              );
            })}
          </ul>
        </Panel>

        <div className="space-y-6">
          <Panel title="SUMMARY">
            <dl className="space-y-2 text-lg" style={{ fontVariantNumeric: "tabular-nums" }}>
              <div className="flex justify-between">
                <dt>Subtotal</dt>
                <dd>{formatINR(order.subtotal)}</dd>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between">
                  <dt>Coupon {order.couponCode}</dt>
                  <dd>−{formatINR(order.discount)}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt>Shipping ({order.shippingMethod})</dt>
                <dd>{order.shipping ? formatINR(order.shipping) : "Complimentary"}</dd>
              </div>
              <div className="flex justify-between border-t border-mist pt-2 font-semibold">
                <dt>Total</dt>
                <dd>{formatINR(order.total)}</dd>
              </div>
            </dl>
          </Panel>
          <Panel title="DELIVERING TO">
            <address className="text-lg not-italic leading-snug">
              {a.firstName} {a.lastName}
              <br />
              {a.line1}
              {a.line2 && (
                <>
                  <br />
                  {a.line2}
                </>
              )}
              <br />
              {a.city}, {a.state} {a.pin}
              <span className="mt-2 block text-base text-ink-soft">
                {a.email}
                {a.phone ? ` · ${a.phone}` : ""}
              </span>
            </address>
          </Panel>
          <p className="text-base text-ink-soft">
            Need to change something?{" "}
            <Link href="/contact" className="underline decoration-gold underline-offset-4">
              Contact our atelier
            </Link>{" "}
            and quote {order.id}.
          </p>
        </div>
      </div>
    </div>
  );
}
