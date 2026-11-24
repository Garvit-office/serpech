import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminLoading } from "@/components/admin/catalog/Loading";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CouponForm } from "@/components/admin/catalog/CouponForm";
import { AdminHeader } from "@/components/admin/ui";
import { requireAdmin } from "@sarpech/backend/auth";
import { findCoupon } from "@sarpech/backend/coupons";

export const metadata: Metadata = { title: "Edit coupon" };

async function EditCouponPageContent(props: PageProps<"/admin/coupons/[id]">) {
  await requireAdmin();
  const { id } = await props.params;
  const c = findCoupon(id);
  if (!c) notFound();
  return (
    <>
      <p className="mb-2 text-base">
        <Link href="/admin/coupons" className="underline decoration-gold/60 underline-offset-4">
          ← Coupons
        </Link>
      </p>
      <AdminHeader title={c.code} description={`Used ${c.uses} time${c.uses === 1 ? "" : "s"}`} />
      <CouponForm
        id={c.id}
        initial={{
          code: c.code,
          description: c.description,
          type: c.type,
          value: c.value,
          minOrder: c.minOrder,
          maxUses: c.maxUses,
          categories: c.categories,
          startsAt: c.startsAt,
          endsAt: c.endsAt,
          active: c.active,
        }}
      />
    </>
  );
}

export default function EditCouponPage(props: PageProps<"/admin/coupons/[id]">) {
  return (
    <Suspense fallback={<AdminLoading />}>
      <EditCouponPageContent {...props} />
    </Suspense>
  );
}
