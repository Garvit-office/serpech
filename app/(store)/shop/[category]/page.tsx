import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { GridSkeleton } from "@/components/shop/GridSkeleton";
import { ShopView } from "@/components/shop/ShopView";
import { categories, getCategory, getProductsByCategory } from "@/lib/catalog";

export function generateStaticParams() {
  return categories.map((c) => ({ category: c.slug }));
}

export async function generateMetadata(props: PageProps<"/shop/[category]">): Promise<Metadata> {
  const { category } = await props.params;
  const c = getCategory(category);
  if (!c) return {};
  return {
    title: c.name,
    description: c.description,
    alternates: { canonical: `/shop/${c.slug}` },
  };
}

// Resolve the category before streaming so unknown slugs get a real 404 status.
export const instant = false;

export default async function CategoryPage(props: PageProps<"/shop/[category]">) {
  const { category } = await props.params;
  const c = getCategory(category);
  if (!c) notFound();
  const products = await getProductsByCategory(c.slug);
  return (
    <>
      <PageHeader eyebrow={c.short} title={c.name} intro={c.description} />
      <Suspense fallback={<GridSkeleton />}>
        <ShopView products={products} lockedCategory={c.slug} />
      </Suspense>
    </>
  );
}
