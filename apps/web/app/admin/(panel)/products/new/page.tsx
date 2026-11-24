import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminLoading } from "@/components/admin/catalog/Loading";
import Link from "next/link";
import { EMPTY_PRODUCT, ProductForm } from "@/components/admin/catalog/ProductForm";
import { AdminHeader } from "@/components/admin/ui";
import { requireAdmin } from "@sarpech/backend/auth";
import { listProducts } from "@sarpech/backend/products";

export const metadata: Metadata = { title: "Add product" };

async function NewProductPageContent() {
  await requireAdmin();
  const others = listProducts({ includeDrafts: true }).map(({ slug, name, category }) => ({ slug, name, category }));
  return (
    <>
      <p className="mb-2 text-base">
        <Link href="/admin/products" className="underline decoration-gold/60 underline-offset-4">
          ← Products
        </Link>
      </p>
      <AdminHeader title="Add product" description="New products are saved as drafts until you publish them." />
      <ProductForm initial={EMPTY_PRODUCT} others={others} />
    </>
  );
}

export default function NewProductPage() {
  return (
    <Suspense fallback={<AdminLoading />}>
      <NewProductPageContent />
    </Suspense>
  );
}
