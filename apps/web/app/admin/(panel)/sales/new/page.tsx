import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminLoading } from "@/components/admin/catalog/Loading";
import Link from "next/link";
import { SaleForm } from "@/components/admin/catalog/SaleForm";
import { AdminHeader } from "@/components/admin/ui";
import { requireAdmin } from "@sarpech/backend/auth";
import { listProducts } from "@sarpech/backend/products";

export const metadata: Metadata = { title: "New sale" };

async function NewSalePageContent() {
  await requireAdmin();
  const products = listProducts().map(({ slug, name, category, price }) => ({ slug, name, category, price }));
  return (
    <>
      <p className="mb-2 text-base">
        <Link href="/admin/sales" className="underline decoration-gold/60 underline-offset-4">
          ← Sales
        </Link>
      </p>
      <AdminHeader title="New sale" />
      <SaleForm
        initial={{ name: "", badge: "Sale", percent: 10, scope: "all", targets: [], startsAt: null, endsAt: null, active: true }}
        products={products}
      />
    </>
  );
}

export default function NewSalePage() {
  return (
    <Suspense fallback={<AdminLoading />}>
      <NewSalePageContent />
    </Suspense>
  );
}
