import type { Metadata } from "next";
import { Suspense } from "react";
import { PageSkeleton } from "@/components/admin/ops/Skeleton";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SarpechEmblem } from "@sarpech/brand/SarpechEmblem";
import { ActivityFeed } from "@/components/admin/ops/blocks";
import { ORDER_TONE } from "@/components/admin/ops/describe";
import { dateLong, dateTime, money } from "@/components/admin/ops/format";
import { productNamer } from "@/components/admin/ops/names";
import { OrderNotesForm, OrderStatusForm, PrintButton } from "@/components/admin/ops/OrderControls";
import { AdminHeader, Badge, Card, Table, td, th } from "@/components/admin/ui";
import { listAudit, listEvents } from "@sarpech/backend/activity";
import { DesignArt } from "@/components/design/DesignArt";
import { designPrice, designSpecLines } from "@sarpech/core/designer";
import { FIT_STYLES, MEASUREMENT_FIELDS } from "@sarpech/core/fit";
import { requireAdmin } from "@sarpech/backend/auth";
import { ORDER_STATUSES, findOrder } from "@sarpech/backend/orders";

export async function generateMetadata(props: PageProps<"/admin/orders/[id]">): Promise<Metadata> {
  const { id } = await props.params;
  return { title: `Order ${id}` };
}

const PRINT_CSS = `
@media print {
  aside, .no-print { display: none !important; }
  body, main { background: #fff !important; }
  #admin-main { padding: 0 !important; }
  .print-only { display: block !important; }
  section { box-shadow: none !important; break-inside: avoid; }
}
`;

export default function OrderDetailPage(props: PageProps<"/admin/orders/[id]">) {
  return (
    <Suspense fallback={<PageSkeleton title="Order" />}>
      <OrderDetailPageContent {...props} />
    </Suspense>
  );
}

async function OrderDetailPageContent(props: PageProps<"/admin/orders/[id]">) {
  await requireAdmin();
  const { id } = await props.params;
  const order = findOrder(decodeURIComponent(id));
  if (!order) notFound();
  const nameOf = productNamer();
  const journey = order.sessionId ? listEvents({ sessionId: order.sessionId, limit: 60 }).events : [];
  const history = listAudit({ entity: "order", entityId: order.id, limit: 20 }).entries;
  const c = order.customer;
  const units = order.items.reduce((s, i) => s + i.qty, 0);
  const listTotal = order.items.reduce((s, i) => s + (i.listPrice + (i.mtmFee ?? 0)) * i.qty, 0);
  const tailored = order.items.filter((i) => i.fit);
  const designs = order.items.flatMap((item, idx) => (item.design ? [{ item, idx }] : []));
  const saleSavings = listTotal - order.subtotal;

  return (
    <>
      <style>{PRINT_CSS}</style>
      <div className="no-print mb-3">
        <Link href="/admin/orders" className="link-thread text-base text-ink-soft">
          ← All orders
        </Link>
      </div>
      <div className="print-only mb-6 hidden">
        <div className="flex items-center gap-3">
          <SarpechEmblem tone="green" className="h-12 w-12" />
          <div>
            <p className="font-display tracking-[0.3em]">SARPECH</p>
            <p className="text-sm">Packing slip</p>
          </div>
        </div>
      </div>
      <AdminHeader
        title={`Order ${order.id}`}
        description={
          <>
            Placed {dateLong(order.createdAt)} · {units} {units === 1 ? "item" : "items"} · <Badge tone={ORDER_TONE[order.status]}>{order.status}</Badge>
          </>
        }
        actions={
          <span className="no-print">
            <PrintButton />
          </span>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr] [&>*]:min-w-0">
        <div className="space-y-6">
          <Card title="Items" padded={false}>
            <Table label="Order items">
              <thead>
                <tr>
                  <th className={th}>Piece</th>
                  <th className={th}>Size</th>
                  <th className={th}>Colour</th>
                  <th className={`${th} text-right`}>Qty</th>
                  <th className={`${th} text-right`}>Unit</th>
                  <th className={`${th} text-right`}>Line total</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((i, idx) => (
                  <tr key={`${i.slug}-${i.size}-${i.color}-${idx}`}>
                    <td className={td}>
                      {i.design ? (
                        <a href={`#design-${idx}`} className="underline decoration-gold underline-offset-4">
                          {i.name}
                        </a>
                      ) : (
                        <Link href={`/product/${i.slug}`} target="_blank" className="underline decoration-gold underline-offset-4">
                          {i.name}
                        </Link>
                      )}
                      <span className="block text-sm text-ink-soft">{i.design ? "Design Studio · made to order" : i.productId}</span>
                    </td>
                    <td className={td}>{i.size}</td>
                    <td className={td}>{i.design ? "See design sheet" : i.color}</td>
                    <td className={`${td} text-right`}>{i.qty}</td>
                    <td className={`${td} text-right`} style={{ fontVariantNumeric: "tabular-nums" }}>
                      {money(i.unitPrice)}
                      {i.listPrice + (i.mtmFee ?? 0) > i.unitPrice && <s className="block text-sm text-ink-soft">{money(i.listPrice + (i.mtmFee ?? 0))}</s>}
                      {i.mtmFee ? <span className="block text-sm text-ink-soft">incl. MTM {money(i.mtmFee)}</span> : null}
                    </td>
                    <td className={`${td} text-right`} style={{ fontVariantNumeric: "tabular-nums" }}>
                      {money(i.unitPrice * i.qty)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
            <dl className="ml-auto max-w-sm space-y-1.5 px-5 py-4 text-base" style={{ fontVariantNumeric: "tabular-nums" }}>
              {saleSavings > 0 && (
                <div className="flex justify-between text-ink-soft">
                  <dt>Sale savings (included)</dt>
                  <dd>−{money(saleSavings)}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt>Subtotal</dt>
                <dd>{money(order.subtotal)}</dd>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between">
                  <dt>Coupon {order.couponCode}</dt>
                  <dd>−{money(order.discount)}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt>Shipping ({order.shippingMethod})</dt>
                <dd>{order.shipping ? money(order.shipping) : "Complimentary"}</dd>
              </div>
              <div className="flex justify-between border-t border-mist pt-2 text-lg font-semibold">
                <dt>Total</dt>
                <dd>{money(order.total)}</dd>
              </div>
            </dl>
          </Card>

          {designs.map(({ item: i, idx }) => (
            <Card key={`design-${idx}`} title={`Design sheet · ${i.name}`} className="break-inside-avoid">
              <div id={`design-${idx}`} className="grid gap-6 sm:grid-cols-[14rem_1fr]">
                <div className="border border-mist bg-pearl p-3">
                  <DesignArt spec={i.design!} title={i.name} className="mx-auto h-72 w-auto" />
                </div>
                <div>
                  <p className="font-display text-xs uppercase tracking-[0.16em]">
                    {i.design!.garment} · size {i.size} · qty {i.qty}
                  </p>
                  <dl className="mt-3 space-y-2 text-base">
                    {designSpecLines(i.design!).map((l) => (
                      <div key={l.label} className="grid grid-cols-[7rem_1fr] gap-3 border-b border-mist pb-1.5">
                        <dt className="text-ink-soft">{l.label}</dt>
                        <dd>{l.value}</dd>
                      </div>
                    ))}
                  </dl>
                  <p className="mt-3 text-sm text-ink-soft">
                    Price: {designPrice(i.design!).lines.map((l) => `${l.label} ${money(l.amount)}`).join(" · ")}
                  </p>
                  {!i.fit && <p className="mt-2 text-sm text-ink-soft">Cut to standard size {i.size}.</p>}
                </div>
              </div>
            </Card>
          ))}

          {tailored.length > 0 && (
            <Card title={`Tailoring sheet · ${tailored.length} made-to-measure`}>
              <div className="space-y-6">
                {tailored.map((i, n) => {
                  const f = i.fit!;
                  return (
                    <div key={`${i.slug}-${n}`} className="break-inside-avoid">
                      <p className="font-display text-xs uppercase tracking-[0.16em]">
                        {i.name} · {i.color} · qty {i.qty}
                      </p>
                      <p className="mt-0.5 text-sm text-ink-soft">
                        {FIT_STYLES.find((x) => x.value === f.preferences.fit)?.label} fit · length {f.preferences.length} · sleeve {f.preferences.sleeve} ·
                        source: {f.method === "camera" ? "camera Fit Check — confirm with customer" : f.method === "quick" ? "estimate from height/weight — confirm with customer" : "customer-entered"}
                        {f.heightCm ? ` · height ${f.heightCm} cm` : ""}
                        {f.weightKg ? ` · ${f.weightKg} kg` : ""}
                      </p>
                      <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1.5 text-base sm:grid-cols-4" style={{ fontVariantNumeric: "tabular-nums" }}>
                        {MEASUREMENT_FIELDS.map((m) => (
                          <div key={m.key} className="flex justify-between gap-2 border-b border-mist py-1">
                            <dt className="text-ink-soft">{m.label}</dt>
                            <dd>
                              {f.measurements[m.key]} cm <span className="text-ink-soft">({(f.measurements[m.key] / 2.54).toFixed(1)}″)</span>
                            </dd>
                          </div>
                        ))}
                      </dl>
                      {f.preferences.notes && <p className="mt-2 border-l-2 border-gold pl-3 text-base italic">“{f.preferences.notes}”</p>}
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          <Card title="Customer journey" className="no-print">
            {order.sessionId ? (
              <>
                <p className="mb-2 text-sm text-ink-soft">
                  What this customer did on the store before ordering (newest first).{" "}
                  <Link href={`/admin/activity?session=${encodeURIComponent(order.sessionId)}`} className="underline decoration-gold underline-offset-2">
                    Open full journey
                  </Link>
                </p>
                <ActivityFeed events={journey} nameOf={nameOf} sessionLinks={false} />
              </>
            ) : (
              <p className="text-base text-ink-soft">No browsing session was linked to this order.</p>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Ship to">
            <address className="not-italic text-base leading-relaxed">
              <strong className="font-semibold">
                {c.firstName} {c.lastName}
              </strong>
              <br />
              {c.line1}
              {c.line2 && (
                <>
                  <br />
                  {c.line2}
                </>
              )}
              <br />
              {c.city}, {c.state} {c.pin}
            </address>
            <p className="mt-3 space-x-3 text-base">
              <a href={`mailto:${c.email}`} className="underline decoration-gold underline-offset-2">
                {c.email}
              </a>
              {c.phone && (
                <a href={`tel:${c.phone.replace(/\s/g, "")}`} className="underline decoration-gold underline-offset-2">
                  {c.phone}
                </a>
              )}
            </p>
          </Card>
          <Card title="Payment" className="no-print">
            {order.paymentId ? (
              <p className="text-base">
                Paid via Razorpay
                <span className="block text-sm text-ink-soft">
                  Payment <span className="font-mono">{order.paymentId}</span>
                  <br />
                  Razorpay order <span className="font-mono">{order.paymentRef}</span>
                </span>
              </p>
            ) : order.paymentRef ? (
              <p className="text-base">
                {order.status === "cancelled" ? "Payment was never completed." : "Waiting for the customer to pay in Razorpay."}
                <span className="block text-sm text-ink-soft">
                  Razorpay order <span className="font-mono">{order.paymentRef}</span>
                  {order.status === "placed" ? " · cancelled automatically after an hour unpaid, and its stock released." : ""}
                </span>
              </p>
            ) : (
              <p className="text-base text-ink-soft">No online payment. Placed while Razorpay was not switched on; collect payment directly.</p>
            )}
          </Card>
          <Card title="Fulfilment" className="no-print">
            <OrderStatusForm id={order.id} status={order.status} statuses={ORDER_STATUSES} />
            <div className="mt-6">
              <OrderNotesForm id={order.id} notes={order.notes} />
            </div>
          </Card>
          {order.notes && (
            <section className="print-only hidden">
              <h2 className="font-display text-xs tracking-[0.2em]">Notes</h2>
              <p className="whitespace-pre-wrap">{order.notes}</p>
            </section>
          )}
          <Card title="History" className="no-print">
            {history.length ? (
              <ol className="space-y-2 text-base">
                {history.map((h) => (
                  <li key={h.id}>
                    {h.summary}
                    <span className="block text-sm text-ink-soft">
                      {dateTime(h.ts)} · {h.actor}
                    </span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-base text-ink-soft">No changes since the order was placed.</p>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
