import type { MetadataRoute } from "next";
import { categories, getAllProducts } from "@/lib/catalog";
import { SITE } from "@/lib/format";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await getAllProducts();
  const base = SITE.url;
  const pages = ["", "/shop", "/wedding-edit", "/royal-fit", "/our-story", "/contact", "/faq", "/shipping-returns", "/size-guide"];
  return [
    ...pages.map((p) => ({ url: `${base}${p}`, changeFrequency: "weekly" as const, priority: p === "" ? 1 : 0.7 })),
    ...categories.map((c) => ({ url: `${base}/shop/${c.slug}`, changeFrequency: "weekly" as const, priority: 0.8 })),
    ...products.map((p) => ({ url: `${base}/product/${p.slug}`, changeFrequency: "weekly" as const, priority: 0.6 })),
  ];
}
