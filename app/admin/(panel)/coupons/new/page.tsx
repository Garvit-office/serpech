import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminLoading } from "@/components/admin/catalog/Loading";
import Link from "next/link";
import { CouponForm } from "@/components/admin/catalog/CouponForm";
import { AdminHeader } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/server/auth";

export const metadata: Metadata = { title: "New coupon" };

async function NewCouponPageContent() {
  await requireAdmin();
  return (
    <>
      <p className="mb-2 text-base">
        <Link href="/admin/coupons" className="underline decoration-gold/60 underline-offset-4">
          ← Coupons
        </Link>
      </p>
      <AdminHeader title="New coupon" />
      <CouponForm
        initial={{ code: "", description: "", type: "percent", value: 10, minOrder: 0, maxUses: null, categories: null, startsAt: null, endsAt: null, active: true }}
      />
    </>
  );
}

export default function NewCouponPage() {
  return (
    <Suspense fallback={<AdminLoading />}>
      <NewCouponPageContent />
    </Suspense>
  );
}
