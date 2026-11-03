import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminLoading } from "@/components/admin/catalog/Loading";
import Link from "next/link";
import { RowAction, SavedNotice } from "@/components/admin/catalog/buttons";
import { STATUS_TONE, windowStatus } from "@/components/admin/catalog/status";
import { AdminHeader, Badge, Card, EmptyState, LinkButton, Table, formatDateTime, td, th } from "@/components/admin/ui";
import { categories } from "@/data/categories";
import { requireAdmin } from "@/lib/server/auth";
import { listProducts } from "@/lib/server/products";
import { listSales } from "@/lib/server/sales";
import type { Sale } from "@/lib/types";
import { deleteSaleAction, toggleSaleAction } from "./actions";

export const metadata: Metadata = { title: "Sales" };

const SAVED: Record<string, string> = { created: "Sale created.", updated: "Sale saved." };

async function SalesPageContent(props: PageProps<"/admin/sales">) {
  await requireAdmin();
  const sp = await props.searchParams;
  const saved = typeof sp.saved === "string" ? SAVED[sp.saved] : undefined;
  const sales = listSales();
  const products = listProducts();

  const affected = (s: Sale) =>
    products.filter((p) => s.scope === "all" || (s.scope === "categories" ? s.targets.includes(p.category) : s.targets.includes(p.slug))).length;
  const scopeLabel = (s: Sale) =>
    s.scope === "all"
      ? "Entire store"
      : s.scope === "categories"
        ? s.targets.map((t) => categories.find((c) => c.slug === t)?.name ?? t).join(", ")
        : `${s.targets.length} selected product${s.targets.length === 1 ? "" : "s"}`;

  return (
    <>
      <AdminHeader
        title="Sales"
        description="Percentage discounts on the whole store, categories or chosen products. The best live sale applies."
        actions={<LinkButton href="/admin/sales/new">New sale</LinkButton>}
      />
      {saved && <SavedNotice message={`${saved} Store prices update within a minute.`} />}
      <Card padded={false}>
        {sales.length === 0 ? (
          <EmptyState title="No sales yet.">Create one to show sale prices and badges in the store.</EmptyState>
        ) : (
          <Table label="Sales">
            <thead>
              <tr>
                <th className={th}>Sale</th>
                <th className={th}>Discount</th>
                <th className={th}>Applies to</th>
                <th className={th}>Window</th>
                <th className={th}>Status</th>
                <th className={`${th} relative`}>
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {sales.map((s) => {
                const st = windowStatus(s);
                return (
                  <tr key={s.id}>
                    <td className={td}>
                      <Link href={`/admin/sales/${s.id}`} className="font-display text-[0.74rem] uppercase tracking-[0.12em] hover:underline">
                        {s.name}
                      </Link>
                      <span className="block text-sm text-ink-soft">Badge: {s.badge}</span>
                    </td>
                    <td className={`${td} whitespace-nowrap font-display`}>{s.percent}% off</td>
                    <td className={td}>
                      <span className="block max-w-64 truncate" title={scopeLabel(s)}>
                        {scopeLabel(s)}
                      </span>
                      <span className="block text-sm text-ink-soft">{affected(s)} active products</span>
                    </td>
                    <td className={`${td} text-sm`}>
                      <span className="block whitespace-nowrap">From {s.startsAt ? formatDateTime(s.startsAt) : "now"}</span>
                      <span className="block whitespace-nowrap text-ink-soft">Until {s.endsAt ? formatDateTime(s.endsAt) : "no end"}</span>
                    </td>
                    <td className={td}>
                      <Badge tone={STATUS_TONE[st]}>{st}</Badge>
                    </td>
                    <td className={td}>
                      <div className="flex flex-wrap justify-end gap-x-3 gap-y-1">
                        <Link href={`/admin/sales/${s.id}`} className="text-[0.95rem] underline decoration-gold/60 underline-offset-4">
                          Edit
                        </Link>
                        {st !== "Expired" && (
                          <RowAction action={toggleSaleAction.bind(null, s.id)} label={`${s.active ? "Pause" : "Resume"} ${s.name}`}>
                            {s.active ? "Pause" : "Resume"}
                          </RowAction>
                        )}
                        <RowAction action={deleteSaleAction.bind(null, s.id)} confirm={`Delete the sale “${s.name}”?`} tone="danger" label={`Delete ${s.name}`}>
                          Delete
                        </RowAction>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        )}
      </Card>
    </>
  );
}

export default function SalesPage(props: PageProps<"/admin/sales">) {
  return (
    <Suspense fallback={<AdminLoading />}>
      <SalesPageContent {...props} />
    </Suspense>
  );
}
