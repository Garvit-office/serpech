import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/PageHeader";
import { CartPageView } from "@/components/shop/CartPageView";

export const metadata: Metadata = {
  title: "Your Bag",
  description: "Review the pieces in your SARPECH bag.",
  robots: { index: false },
};

export default function CartPage() {
  return (
    <>
      <PageHeader eyebrow="Your Selection" title="Your Bag" />
      <CartPageView />
    </>
  );
}
