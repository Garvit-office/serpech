import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { GridSkeleton } from "@/components/shop/GridSkeleton";
import { SearchView } from "@/components/shop/SearchView";

export const metadata: Metadata = {
  title: "Search",
  description: "Search the SARPECH collection.",
  robots: { index: false },
};

export default function SearchPage() {
  return (
    <>
      <PageHeader eyebrow="Find a Piece" title="Search" />
      <Suspense fallback={<GridSkeleton />}>
        <SearchView />
      </Suspense>
    </>
  );
}
