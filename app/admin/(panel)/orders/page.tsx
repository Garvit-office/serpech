import type { Metadata } from "next";
import { Suspense } from "react";
import { PageSkeleton } from "@/components/admin/ops/Skeleton";
import Link from "next/link";
import { LinkTabs } from "@/components/admin/ops/blocks";
import { ORDER_TONE } from "@/components/admin/ops/describe";
import { count, dateTime, money } from "@/components/admin/ops/format";
import { AdminHeader, Badge, Card, EmptyState, Pagination, Table, td, th } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/server/auth";
import { ORDER_STATUSES, listOrders, orderStatusCounts } from "@/lib/server/orders";
import type { OrderStatus } from "@/lib/types";

export const metadata: Metadata = { title: "Orders" };

const PAGE_SIZE = 25;

export default function OrdersPage(props: PageProps<"/admin/orders">) {
  return (
    <Suspense fallback={<PageSkeleton title="Orders" />}>
      <OrdersPageContent {...props} />
    </Suspense>
  );
}

async function OrdersPageContent(props: PageProps<"/admin/orders">) {
  await requireAdmin();
  const sp = await props.searchParams;
  const status = ORDER_STATUSES.includes(sp.status as OrderStatus) ? (sp.status as OrderStatus) : undefined;
  const q = typeof sp.q === "string" ? sp.q.trim().slice(0, 80) : "";
  const page = Math.max(1, Number.parseInt(String(sp.page ?? "1"), 10) || 1);
  const { total, orders } = listOrders({ status, q: q || undefined, limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE });
  const counts = orderStatusCounts();
  const all = Object.values(counts).reduce((a, b) => a + (b ?? 0), 0);

  const href = (patch: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    const merged = { status, q: q || undefined, ...patch };
    for (const [k, v] of Object.entries(merged)) if (v) p.set(k, v);
    const s = p.toString();
    return s ? `/admin/orders?${s}` : "/admin/orders";
  };
  const exportHref = `/api/admin/export/orders${status || q ? `?${new URLSearchParams({ ...(status ? { status } : {}), ...(q ? { q } : {}) })}` : ""}`;

  return (
    <>
      <AdminHeader
        title="Orders"
        description={`${count(all)} orders in total.`}
        actions={
          <a href={exportHref} className="btn-outline min-h-10 px-5 py-2" download>
            Export CSV
          </a>
        }
      />

      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <LinkTabs
          label="Filter by status"
          items={[
            { href: href({ status: undefined, page: undefined }), label: `All · ${count(all)}`, active: !status },
            ...ORDER_STATUSES.filter((s) => counts[s] || s === status).map((s) => ({
              href: href({ status: s, page: undefined }),
              label: `${s} · ${count(counts[s] ?? 0)}`,
              active: s === status,
            })),
          ]}
        />
        <form role="search" action="/admin/orders" className="flex gap-2">
          {status && <input type="hidden" name="status" value={status} />}
          <label htmlFor="order-q" className="sr-only">
            Search orders
          </label>
          <input id="order-q" name="q" defaultValue={q} placeholder="Order id, name or email" className="field min-h-10 w-full py-1.5 lg:w-72" />
          <button type="submit" className="btn-royal min-h-10 px-4 py-1.5">
            Search
          </button>
        </form>
      </div>

      <Card padded={false}>
        {orders.length ? (
          <>
            <Table label="Orders">
              <thead>
                <tr>
                  <th className={th}>Order</th>
                  <th className={th}>Placed</th>
                  <th className={th}>Customer</th>
                  <th className={`${th} text-right`}>Items</th>
                  <th className={`${th} text-right`}>Total</th>
                  <th className={th}>Coupon</th>
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
                    </td>
                    <td className={`${td} whitespace-nowrap text-ink-soft`}>{dateTime(o.createdAt)}</td>
                    <td className={td}>
                      <span className="block">
                        {o.customer.firstName} {o.customer.lastName}
                      </span>
                      <span className="block text-sm text-ink-soft">{o.customer.email}</span>
                    </td>
                    <td className={`${td} text-right`}>{o.items.reduce((s, i) => s + i.qty, 0)}</td>
                    <td className={`${td} text-right`} style={{ fontVariantNumeric: "tabular-nums" }}>
                      {money(o.total)}
                    </td>
                    <td className={td}>{o.couponCode ? <span className="font-display text-xs tracking-[0.12em]">{o.couponCode}</span> : <span className="text-ink-soft">—</span>}</td>
                    <td className={td}>
                      <Badge tone={ORDER_TONE[o.status]}>{o.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
            <Pagination page={page} pageSize={PAGE_SIZE} total={total} href={(p) => href({ page: p > 1 ? String(p) : undefined })} />
          </>
        ) : (
          <EmptyState title={q || status ? "No orders match" : "No orders yet"}>
            {q || status ? (
              <Link href="/admin/orders" className="underline">
                Clear filters
              </Link>
            ) : (
              "Orders placed at checkout appear here."
            )}
          </EmptyState>
        )}
      </Card>
    </>
  );
}
