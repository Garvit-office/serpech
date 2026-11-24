import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminLoading } from "@/components/admin/catalog/Loading";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductForm } from "@/components/admin/catalog/ProductForm";
import { AdminHeader, Badge, formatDateTime } from "@/components/admin/ui";
import { requireAdmin } from "@sarpech/backend/auth";
import { findProduct, listProducts } from "@sarpech/backend/products";

export const metadata: Metadata = { title: "Edit product" };

async function EditProductPageContent(props: PageProps<"/admin/products/[id]">) {
  await requireAdmin();
  const { id } = await props.params;
  const p = findProduct(id);
  if (!p) notFound();
  const others = listProducts({ includeDrafts: true }).map(({ slug, name, category }) => ({ slug, name, category }));
  const initial = {
    name: p.name,
    slug: p.slug,
    category: p.category,
    subcategory: p.subcategory ?? "",
    price: p.price,
    sizes: p.sizes,
    colors: p.colors,
    fabric: p.fabric,
    description: p.description,
    details: p.details ?? [],
    care: p.care ?? [],
    tags: p.tags ?? [],
    occasions: p.occasions ?? [],
    images: p.images ?? [],
    completeTheLook: p.completeTheLook ?? [],
    madeToMeasure: p.madeToMeasure,
    stock: p.stock,
    status: p.status,
  };
  return (
    <>
      <p className="mb-2 text-base">
        <Link href="/admin/products" className="underline decoration-gold/60 underline-offset-4">
          ← Products
        </Link>
      </p>
      <AdminHeader
        title={p.name}
        description={
          <>
            {p.id} · last updated {formatDateTime(p.updatedAt)} <Badge tone={p.status === "active" ? "green" : "grey"}>{p.status}</Badge>
          </>
        }
        actions={
          p.status === "active" ? (
            <Link href={`/product/${p.slug}`} target="_blank" className="btn-outline min-h-10 px-5 py-2">
              View in store ↗
            </Link>
          ) : undefined
        }
      />
      <ProductForm key={p.updatedAt} initial={initial} id={p.id} others={others} />
    </>
  );
}

export default function EditProductPage(props: PageProps<"/admin/products/[id]">) {
  return (
    <Suspense fallback={<AdminLoading />}>
      <EditProductPageContent {...props} />
    </Suspense>
  );
}
