import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminLoading } from "@/components/admin/catalog/Loading";
import Link from "next/link";
import { CopyButton, RowAction, SavedNotice } from "@/components/admin/catalog/buttons";
import { STATUS_TONE, couponStatus, couponValueLabel } from "@/components/admin/catalog/status";
import { AdminHeader, Badge, Card, EmptyState, LinkButton, Table, formatDateTime, td, th } from "@/components/admin/ui";
import { categories } from "@/data/categories";
import { formatINR } from "@/lib/format";
import { requireAdmin } from "@/lib/server/auth";
import { listCoupons } from "@/lib/server/coupons";
import { deleteCouponAction, toggleCouponAction } from "./actions";

export const metadata: Metadata = { title: "Coupons" };

const SAVED: Record<string, string> = { created: "Coupon created.", updated: "Coupon saved." };

async function CouponsPageContent(props: PageProps<"/admin/coupons">) {
  await requireAdmin();
  const sp = await props.searchParams;
  const saved = typeof sp.saved === "string" ? SAVED[sp.saved] : undefined;
  const coupons = listCoupons();

  return (
    <>
      <AdminHeader
        title="Coupons"
        description="Codes customers enter at checkout. Applied after sale prices; checked again on the server when the order is placed."
        actions={<LinkButton href="/admin/coupons/new">New coupon</LinkButton>}
      />
      {saved && <SavedNotice message={saved} />}
      <Card padded={false}>
        {coupons.length === 0 ? (
          <EmptyState title="No coupons yet.">Create a code like FESTIVE15 to offer a discount at checkout.</EmptyState>
        ) : (
          <Table label="Coupons">
            <thead>
              <tr>
                <th className={th}>Code</th>
                <th className={th}>Discount</th>
                <th className={th}>Conditions</th>
                <th className={th}>Usage</th>
                <th className={th}>Window</th>
                <th className={th}>Status</th>
                <th className={`${th} relative`}>
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((c) => {
                const st = couponStatus(c);
                return (
                  <tr key={c.id}>
                    <td className={td}>
                      <span className="flex items-center gap-3">
                        <Link href={`/admin/coupons/${c.id}`} className="font-mono text-base tracking-[0.1em] hover:underline">
                          {c.code}
                        </Link>
                        <CopyButton text={c.code} />
                      </span>
                      {c.description && <span className="block max-w-56 truncate text-sm text-ink-soft">{c.description}</span>}
                    </td>
                    <td className={`${td} whitespace-nowrap font-display`}>{couponValueLabel(c)}</td>
                    <td className={`${td} text-sm`}>
                      <span className="block">{c.minOrder ? `Min. order ${formatINR(c.minOrder)}` : "No minimum"}</span>
                      <span className="block text-ink-soft">
                        {c.categories ? c.categories.map((s) => categories.find((x) => x.slug === s)?.name ?? s).join(", ") : "Whole order"}
                      </span>
                    </td>
                    <td className={`${td} whitespace-nowrap`}>
                      {c.uses} / {c.maxUses ?? "∞"}
                    </td>
                    <td className={`${td} text-sm`}>
                      <span className="block whitespace-nowrap">From {c.startsAt ? formatDateTime(c.startsAt) : "now"}</span>
                      <span className="block whitespace-nowrap text-ink-soft">Until {c.endsAt ? formatDateTime(c.endsAt) : "no end"}</span>
                    </td>
                    <td className={td}>
                      <Badge tone={STATUS_TONE[st]}>{st}</Badge>
                    </td>
                    <td className={td}>
                      <div className="flex flex-wrap justify-end gap-x-3 gap-y-1">
                        <Link href={`/admin/coupons/${c.id}`} className="text-[0.95rem] underline decoration-gold/60 underline-offset-4">
                          Edit
                        </Link>
                        {st !== "Expired" && (
                          <RowAction action={toggleCouponAction.bind(null, c.id)} label={`${c.active ? "Pause" : "Resume"} ${c.code}`}>
                            {c.active ? "Pause" : "Resume"}
                          </RowAction>
                        )}
                        <RowAction action={deleteCouponAction.bind(null, c.id)} confirm={`Delete coupon ${c.code}?`} tone="danger" label={`Delete ${c.code}`}>
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

export default function CouponsPage(props: PageProps<"/admin/coupons">) {
  return (
    <Suspense fallback={<AdminLoading />}>
      <CouponsPageContent {...props} />
    </Suspense>
  );
}
