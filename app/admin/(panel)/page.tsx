import type { Metadata } from "next";
import { Suspense } from "react";
import { PageSkeleton } from "@/components/admin/ops/Skeleton";
import Link from "next/link";
import { ActivityFeed, Funnel, LinkTabs, RankList } from "@/components/admin/ops/blocks";
import { ColumnChart, LineChart } from "@/components/admin/ops/charts";
import { ORDER_TONE } from "@/components/admin/ops/describe";
import { RANGES, bucketLabel, count, dateTime, money, parseRange, pct, rangeWindow } from "@/components/admin/ops/format";
import { productNamer } from "@/components/admin/ops/names";
import { AdminHeader, Badge, Card, EmptyState, StatCard, Table, td, th } from "@/components/admin/ui";
import { activitySummary, recentEvents } from "@/lib/server/activity";
import { requireAdmin } from "@/lib/server/auth";
import { newFittingsCount } from "@/lib/server/inbox";
import { recentOrders } from "@/lib/server/orders";

export const metadata: Metadata = { title: "Dashboard" };

const GREEN = "#1F3A2E";
const GOLD = "#C9A04A";

export default function AdminDashboard(props: PageProps<"/admin">) {
  return (
    <Suspense fallback={<PageSkeleton title="Dashboard" />}>
      <AdminDashboardContent {...props} />
    </Suspense>
  );
}

async function AdminDashboardContent(props: PageProps<"/admin">) {
  await requireAdmin();
  const range = parseRange((await props.searchParams).range);
  const win = rangeWindow(range);
  const s = activitySummary(win.since, win.bucket);
  const nameOf = productNamer();
  const orders = recentOrders(6);
  const feed = recentEvents(15);
  const pendingFittings = newFittingsCount();

  // align sparse rows to every bucket in the window
  const byKey = <T extends { k: string }>(rows: T[]) => new Map(rows.map((r) => [r.k, r]));
  const traffic = byKey(s.series);
  const sales = byKey(s.orderSeries);
  const labels = win.keys.map((k) => bucketLabel(k, win.bucket));
  const longLabels = win.keys.map((k) => bucketLabel(k, win.bucket, true));
  const views = win.keys.map((k) => traffic.get(k)?.views ?? 0);
  const visitors = win.keys.map((k) => traffic.get(k)?.visitors ?? 0);
  const orderCounts = win.keys.map((k) => sales.get(k)?.orders ?? 0);
  const revenue = win.keys.map((k) => sales.get(k)?.revenue ?? 0);
  const rangeLabel = RANGES.find((r) => r.key === range)!.label.toLowerCase();

  return (
    <>
      <AdminHeader
        title="Dashboard"
        description={`Store performance for ${range === "today" ? "today" : `the last ${rangeLabel}`} (IST).`}
        actions={
          <LinkTabs
            label="Date range"
            items={RANGES.map((r) => ({ href: r.key === "30d" ? "/admin" : `/admin?range=${r.key}`, label: r.label, active: r.key === range }))}
          />
        }
      />

      {pendingFittings > 0 && (
        <p className="mb-6 flex flex-wrap items-center justify-between gap-2 border border-gold/60 bg-[#FBF6E6] px-4 py-3 text-base">
          <span>
            <strong>{pendingFittings}</strong> new fitting {pendingFittings === 1 ? "request is" : "requests are"} waiting for a call back.
          </span>
          <Link href="/admin/inbox" className="link-thread font-display text-xs uppercase tracking-[0.18em]">
            Open inbox →
          </Link>
        </p>
      )}

      <section aria-label="Key figures" className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4 [&>*]:min-w-0">
        <StatCard label="Revenue" value={money(s.revenue)} hint={`${count(s.orders)} orders`} />
        <StatCard label="Orders" value={count(s.orders)} hint="excl. cancelled & refunded" />
        <StatCard label="Average order" value={money(s.aov)} />
        <StatCard label="Visitors" value={count(s.visitors)} hint="unique browsers" />
        <StatCard label="Conversion" value={pct(s.conversion)} hint="of visitors placed an order" />
        <StatCard label="Page views" value={count(s.counts.page_view ?? 0)} />
        <StatCard label="Added to bag" value={count(s.counts.add_to_cart ?? 0)} hint={`${count(s.counts.wishlist_add ?? 0)} wishlisted`} />
        <StatCard label="Discounts given" value={money(s.discounts)} hint={`${count(s.counts.coupon_applied ?? 0)} codes applied`} />
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-2 [&>*]:min-w-0">
        <Card title="Traffic">
          <LineChart
            title={win.bucket === "hour" ? "Visitors and page views by hour" : "Visitors and page views by day"}
            labels={labels}
            longLabels={longLabels}
            series={[
              { name: "Page views", color: GREEN, values: views },
              { name: "Visitors", color: GOLD, values: visitors },
            ]}
          />
        </Card>
        <Card title="Sales">
          <div className="grid gap-6 sm:grid-cols-2 [&>*]:min-w-0">
            <ColumnChart title="Orders" labels={labels} longLabels={longLabels} series={{ name: "Orders", color: GREEN, values: orderCounts }} />
            <ColumnChart title="Revenue" fmt="money" labels={labels} longLabels={longLabels} series={{ name: "Revenue", color: GREEN, values: revenue }} />
          </div>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3 [&>*]:min-w-0">
        <Card title="Conversion funnel">
          <Funnel
            steps={[
              { label: "Visited the store", value: s.funnel.visitors },
              { label: "Added to bag", value: s.funnel.sessionsWithCart },
              { label: "Started checkout", value: s.funnel.sessionsWithCheckout },
              { label: "Placed an order", value: s.funnel.sessionsWithOrder },
            ]}
          />
        </Card>
        <Card title="Most viewed">
          <RankList
            unit="views"
            rows={s.topViewed.map((r) => ({ key: r.k, label: nameOf(r.k), value: r.n, href: `/product/${r.k}` }))}
            empty="No product views yet."
          />
        </Card>
        <Card title="Most added to bag">
          <RankList
            unit="adds"
            rows={s.topAdded.map((r) => ({ key: r.k, label: nameOf(r.k), value: r.n, href: `/product/${r.k}` }))}
            empty="Nothing added to bag yet."
          />
        </Card>
        <Card title="Top searches">
          <RankList
            unit="searches"
            rows={s.topSearches.map((r) => ({
              key: r.k,
              label: `“${r.k}”`,
              value: r.n,
              note: r.results === 0 ? <Badge tone="ruby">No results</Badge> : undefined,
            }))}
            empty="No searches yet."
          />
        </Card>
        <Card title="Top pages">
          <RankList unit="views" rows={s.topPages.map((r) => ({ key: r.k, label: r.k, value: r.n }))} empty="No page views yet." />
        </Card>
        <Card title="Devices & coupons">
          <RankList unit="visitors" rows={s.devices.map((r) => ({ key: r.k, label: r.k.charAt(0).toUpperCase() + r.k.slice(1), value: r.n }))} empty="No visitors yet." />
          <h3 className="mt-6 font-display text-[0.65rem] uppercase tracking-[0.18em] text-ink-soft">Coupon performance</h3>
          {s.coupons.length ? (
            <ul className="mt-2 divide-y divide-mist text-base">
              {s.coupons.map((c) => (
                <li key={c.k} className="flex justify-between gap-3 py-1.5">
                  <span className="font-display text-xs tracking-[0.14em]">{c.k}</span>
                  <span className="text-ink-soft">
                    {count(c.n)} uses · <span className="text-brand-green">−{money(c.d)}</span>
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-base text-ink-soft">No coupons used in this period.</p>
          )}
          {s.failedCoupons > 0 && <p className="mt-2 text-sm text-ink-soft">{count(s.failedCoupons)} rejected code attempts.</p>}
        </Card>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_1fr] [&>*]:min-w-0">
        <Card
          title="Recent orders"
          padded={false}
          actions={
            <Link href="/admin/orders" className="link-thread text-sm">
              All orders →
            </Link>
          }
        >
          {orders.length ? (
            <Table label="Recent orders">
              <thead>
                <tr>
                  <th className={th}>Order</th>
                  <th className={th}>Customer</th>
                  <th className={th}>Placed</th>
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
                    </td>
                    <td className={td}>
                      {o.customer.firstName} {o.customer.lastName}
                    </td>
                    <td className={`${td} text-ink-soft`}>{dateTime(o.createdAt)}</td>
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
            <EmptyState title="No orders yet">Orders placed at checkout appear here.</EmptyState>
          )}
        </Card>
        <Card
          title="Live activity"
          actions={
            <Link href="/admin/activity" className="link-thread text-sm">
              Full log →
            </Link>
          }
        >
          <ActivityFeed events={feed} nameOf={nameOf} />
        </Card>
      </div>
    </>
  );
}
