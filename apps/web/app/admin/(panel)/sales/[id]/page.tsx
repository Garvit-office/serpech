import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminLoading } from "@/components/admin/catalog/Loading";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SaleForm } from "@/components/admin/catalog/SaleForm";
import { AdminHeader } from "@/components/admin/ui";
import { requireAdmin } from "@sarpech/backend/auth";
import { listProducts } from "@sarpech/backend/products";
import { findSale } from "@sarpech/backend/sales";

export const metadata: Metadata = { title: "Edit sale" };

async function EditSalePageContent(props: PageProps<"/admin/sales/[id]">) {
  await requireAdmin();
  const { id } = await props.params;
  const sale = findSale(id);
  if (!sale) notFound();
  const products = listProducts().map(({ slug, name, category, price }) => ({ slug, name, category, price }));
  const initial = {
    name: sale.name,
    badge: sale.badge,
    percent: sale.percent,
    scope: sale.scope,
    targets: sale.targets,
    startsAt: sale.startsAt,
    endsAt: sale.endsAt,
    active: sale.active,
  };
  return (
    <>
      <p className="mb-2 text-base">
        <Link href="/admin/sales" className="underline decoration-gold/60 underline-offset-4">
          ← Sales
        </Link>
      </p>
      <AdminHeader title={sale.name} />
      <SaleForm initial={initial} id={sale.id} products={products} />
    </>
  );
}

export default function EditSalePage(props: PageProps<"/admin/sales/[id]">) {
  return (
    <Suspense fallback={<AdminLoading />}>
      <EditSalePageContent {...props} />
    </Suspense>
  );
}
