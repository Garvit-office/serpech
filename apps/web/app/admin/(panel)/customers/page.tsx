import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { FilterBar } from "@/components/admin/catalog/FilterBar";
import { count, money } from "@/components/admin/ops/format";
import { PageSkeleton } from "@/components/admin/ops/Skeleton";
import { AdminHeader, Badge, Card, EmptyState, Pagination, Table, formatDate, td, th } from "@/components/admin/ui";
import { requireAdmin } from "@sarpech/backend/auth";
import { listCustomers } from "@sarpech/backend/customers";
import { orderStatsByCustomer } from "@sarpech/backend/orders";

export const metadata: Metadata = { title: "Customers" };

const PAGE_SIZE = 25;

export default function CustomersPage(props: PageProps<"/admin/customers">) {
  return (
    <Suspense fallback={<PageSkeleton title="Customers" />}>
      <CustomersContent {...props} />
    </Suspense>
  );
}

async function CustomersContent(props: PageProps<"/admin/customers">) {
  await requireAdmin();
  const sp = await props.searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim().slice(0, 80) : "";
  const page = Math.max(1, Number.parseInt(String(sp.page ?? "1"), 10) || 1);
  const { total, customers } = listCustomers({ q: q || undefined, limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE });
  const stats = new Map(orderStatsByCustomer().map((s) => [s.id, s]));
  const href = (p: number) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (p > 1) params.set("page", String(p));
    const s = params.toString();
    return s ? `/admin/customers?${s}` : "/admin/customers";
  };

  return (
    <>
      <AdminHeader title="Customers" description={`${count(total)} ${q ? "matching " : ""}registered ${total === 1 ? "customer" : "customers"}. Guest checkouts appear under Orders only.`} />
      <Card padded={false}>
        <FilterBar q={q} placeholder="Name, email or phone" resetHref="/admin/customers" />
        {customers.length ? (
          <>
            <Table label="Customers">
              <thead>
                <tr>
                  <th className={th}>Customer</th>
                  <th className={th}>Phone</th>
                  <th className={th}>Joined</th>
                  <th className={th}>Last sign-in</th>
                  <th className={`${th} text-right`}>Orders</th>
                  <th className={`${th} text-right`}>Spend</th>
                  <th className={th}>Extras</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => {
                  const s = stats.get(c.id);
                  return (
                    <tr key={c.id} className="hover:bg-pearl">
                      <td className={td}>
                        <Link href={`/admin/customers/${c.id}`} className="underline decoration-gold underline-offset-4">
                          {c.name}
                        </Link>
                        <span className="block text-sm text-ink-soft">{c.email}</span>
                      </td>
                      <td className={`${td} whitespace-nowrap`}>{c.phone || <span className="text-ink-soft">—</span>}</td>
                      <td className={`${td} whitespace-nowrap text-ink-soft`}>{formatDate(c.createdAt)}</td>
                      <td className={`${td} whitespace-nowrap text-ink-soft`}>{formatDate(c.lastLoginAt)}</td>
                      <td className={`${td} text-right`}>{count(s?.orders ?? 0)}</td>
                      <td className={`${td} text-right`} style={{ fontVariantNumeric: "tabular-nums" }}>
                        {money(s?.spend ?? 0)}
                      </td>
                      <td className={td}>
                        <span className="flex flex-wrap gap-1">
                          {c.fitProfile && <Badge tone="gold">Royal Fit</Badge>}
                          {c.marketing && <Badge tone="green">Newsletter</Badge>}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
            <Pagination page={page} pageSize={PAGE_SIZE} total={total} href={href} />
          </>
        ) : (
          <EmptyState title={q ? "No customers match" : "No customers yet"}>
            {q ? (
              <Link href="/admin/customers" className="underline">
                Clear search
              </Link>
            ) : (
              "Customers who create an account on the store appear here."
            )}
          </EmptyState>
        )}
      </Card>
    </>
  );
}
