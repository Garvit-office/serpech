import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ORDER_TONE } from "@/components/admin/ops/describe";
import { count, dateTime, money } from "@/components/admin/ops/format";
import { productNamer } from "@/components/admin/ops/names";
import { PageSkeleton } from "@/components/admin/ops/Skeleton";
import { AdminHeader, Badge, Card, EmptyState, StatCard, Table, formatDate, td, th } from "@/components/admin/ui";
import { FIT_STYLES, MEASUREMENT_FIELDS } from "@/lib/fit";
import { requireAdmin } from "@/lib/server/auth";
import { findCustomer } from "@/lib/server/customers";
import { listOrdersForCustomer } from "@/lib/server/orders";

export const metadata: Metadata = { title: "Customer" };

export default function CustomerDetailPage(props: PageProps<"/admin/customers/[id]">) {
  return (
    <Suspense fallback={<PageSkeleton title="Customer" />}>
      <CustomerDetail {...props} />
    </Suspense>
  );
}

async function CustomerDetail(props: PageProps<"/admin/customers/[id]">) {
  await requireAdmin();
  const c = findCustomer(decodeURIComponent((await props.params).id));
  if (!c) notFound();
  const orders = listOrdersForCustomer(c.id, c.email);
  const live = orders.filter((o) => o.status !== "cancelled" && o.status !== "refunded");
  const spend = live.reduce((s, o) => s + o.total, 0);
  const nameOf = productNamer();
  const fit = c.fitProfile;

  return (
    <>
      <div className="mb-3">
        <Link href="/admin/customers" className="link-thread text-base text-ink-soft">
          ← All customers
        </Link>
      </div>
      <AdminHeader
        title={c.name}
        description={
          <>
            <a href={`mailto:${c.email}`} className="underline decoration-gold underline-offset-2">
              {c.email}
            </a>
            {c.phone && (
              <>
                {" · "}
                <a href={`tel:${c.phone.replace(/\s/g, "")}`} className="underline decoration-gold underline-offset-2">
                  {c.phone}
                </a>
              </>
            )}
            {" · "}joined {formatDate(c.createdAt)} · last sign-in {formatDate(c.lastLoginAt)}
          </>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard label="Orders" value={count(orders.length)} hint={orders.length !== live.length ? `${orders.length - live.length} cancelled/refunded` : undefined} />
        <StatCard label="Spend" value={money(spend)} />
        <StatCard label="Average order" value={money(live.length ? spend / live.length : 0)} />
        <StatCard label="Wishlist" value={count(c.wishlist.length)} hint={c.marketing ? "Opted in to marketing" : "No marketing"} />
      </div>

      <div className="grid gap-6 2xl:grid-cols-[1.6fr_1fr] [&>*]:min-w-0">
        <div className="space-y-6">
          <Card title="Orders" padded={false}>
            {orders.length ? (
              <Table label="Customer orders">
                <thead>
                  <tr>
                    <th className={th}>Order</th>
                    <th className={th}>Placed</th>
                    <th className={th}>Pieces</th>
                    <th className={`${th} text-right`}>Total</th>
                    <th className={th}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o.id} className="hover:bg-pearl">
                      <td className={td}>
                        <Link href={`/admin/orders/${o.id}`} className="whitespace-nowrap font-display text-xs tracking-[0.1em] underline decoration-gold underline-offset-4">
                          {o.id}
                        </Link>
                        {!o.customerId && <span className="block text-sm text-ink-soft">guest checkout</span>}
                      </td>
                      <td className={`${td} whitespace-nowrap text-ink-soft`}>{dateTime(o.createdAt)}</td>
                      <td className={`${td} max-w-xs truncate`}>{o.items.map((i) => i.name).join(", ")}</td>
                      <td className={`${td} text-right`} style={{ fontVariantNumeric: "tabular-nums" }}>
                        {money(o.total)}
                      </td>
                      <td className={td}>
                        <Badge tone={ORDER_TONE[o.status]}>{o.status}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            ) : (
              <EmptyState title="No orders yet" />
            )}
          </Card>

          <Card title="Royal Fit">
            {fit ? (
              <>
                <p className="text-base text-ink-soft">
                  {FIT_STYLES.find((f) => f.value === fit.preferences.fit)?.label} fit · length {fit.preferences.length} · sleeve {fit.preferences.sleeve} · source:{" "}
                  {fit.method === "camera" ? "camera Fit Check" : fit.method === "quick" ? "estimate" : "customer-entered"} · height {fit.heightCm} cm
                  {fit.weightKg ? ` · ${fit.weightKg} kg` : ""} · saved {formatDate(fit.updatedAt)}
                </p>
                <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1.5 text-base sm:grid-cols-4" style={{ fontVariantNumeric: "tabular-nums" }}>
                  {MEASUREMENT_FIELDS.map((m) => (
                    <div key={m.key} className="flex justify-between gap-2 border-b border-mist py-1">
                      <dt className="text-ink-soft">{m.label}</dt>
                      <dd>{fit.measurements[m.key]} cm</dd>
                    </div>
                  ))}
                </dl>
                {fit.preferences.notes && <p className="mt-3 border-l-2 border-gold pl-3 text-base italic">“{fit.preferences.notes}”</p>}
              </>
            ) : (
              <p className="text-base text-ink-soft">No measurements saved.</p>
            )}
          </Card>
        </div>

        <div className="grid content-start gap-6 md:grid-cols-2 2xl:grid-cols-1">
          <Card title="Addresses">
            {c.addresses.length ? (
              <ul className="space-y-4">
                {c.addresses.map((a) => (
                  <li key={a.id} className="text-base leading-relaxed">
                    <p className="font-display text-xs uppercase tracking-[0.16em]">
                      {a.label}
                      {a.isDefault && <span className="ml-2 text-gold-dark">· default</span>}
                    </p>
                    <address className="not-italic">
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
                      {a.phone && (
                        <>
                          <br />
                          {a.phone}
                        </>
                      )}
                    </address>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-base text-ink-soft">No saved addresses.</p>
            )}
          </Card>
          <Card title="Wishlist">
            {c.wishlist.length ? (
              <ul className="space-y-1.5 text-base">
                {c.wishlist.map((slug) => (
                  <li key={slug}>
                    <Link href={`/product/${slug}`} target="_blank" className="underline decoration-gold underline-offset-2">
                      {nameOf(slug)}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-base text-ink-soft">Empty.</p>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
