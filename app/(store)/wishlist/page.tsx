import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/PageHeader";
import { WishlistView } from "@/components/shop/WishlistView";

export const metadata: Metadata = {
  title: "Wishlist",
  description: "The pieces you have set aside.",
  robots: { index: false },
};

export default function WishlistPage() {
  return (
    <>
      <PageHeader eyebrow="Set Aside" title="Your Wishlist" />
      <WishlistView />
    </>
  );
}
