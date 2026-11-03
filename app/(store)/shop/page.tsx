import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { GridSkeleton } from "@/components/shop/GridSkeleton";
import { ShopView } from "@/components/shop/ShopView";
import { getAllProducts } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Shop the Collection",
  description: "Sherwanis, bandhgalas, kurtas, Nehru jackets, shirts, polos and accessories — royal Indian menswear by SARPECH.",
  alternates: { canonical: "/shop" },
};

export default async function ShopPage() {
  const products = await getAllProducts();
  return (
    <>
      <PageHeader
        eyebrow="The Collection"
        title="Shop All"
        intro="Every piece, from the wedding sherwani to the weekend polo — each carrying the sarpech."
      />
      <Suspense fallback={<GridSkeleton />}>
        <ShopView products={products} />
      </Suspense>
    </>
  );
}
