import "server-only";
/**
 * Storefront catalogue access (server). Products come from the database with
 * live Sales applied, cached under the "catalog" tag. Admin mutations call
 * updateTag("catalog") so changes appear on the next request.
 */
import { cacheLife, cacheTag } from "next/cache";
import { categories, getCategory } from "@/data/categories";
import { listProducts } from "./server/products";
import { applySales, liveSales } from "./server/sales";
import { readSettings } from "./server/settings";
import { completeTheLook } from "./catalog-shared";
import type { CategorySlug, Product, StoreSettings } from "./types";

export { categories, getCategory };
export * from "./catalog-shared";

export const CATALOG_TAG = "catalog";
export const SETTINGS_TAG = "settings";

/** Strip admin-only fields so they never reach the client. */
function toPublic({ id, slug, name, category, subcategory, price, salePrice, saleLabel, sizes, colors, fabric, description, details, care, tags, occasions, images, completeTheLook, madeToMeasure, stock }: Product): Product {
  // `stock` is public on purpose: the store greys out sold-out sizes and shows "Only N left".
  return { id, slug, name, category, subcategory, price, salePrice, saleLabel, sizes, colors, fabric, description, details, care, tags, occasions, images, completeTheLook, madeToMeasure, stock };
}

export async function getAllProducts(): Promise<Product[]> {
  "use cache";
  cacheTag(CATALOG_TAG);
  cacheLife("minutes"); // sale windows open/close within a minute
  const sales = liveSales();
  return listProducts().map((p) => toPublic(applySales(p, sales)));
}

export async function getProduct(slug: string): Promise<Product | undefined> {
  return (await getAllProducts()).find((p) => p.slug === slug);
}

export async function getProductsByCategory(category: CategorySlug): Promise<Product[]> {
  return (await getAllProducts()).filter((p) => p.category === category);
}

export async function getBestsellers(limit = 10): Promise<Product[]> {
  return (await getAllProducts()).filter((p) => p.tags.includes("bestseller")).slice(0, limit);
}

export async function getWeddingEdit(): Promise<Product[]> {
  return (await getAllProducts()).filter((p) => p.tags.includes("wedding-edit"));
}

export async function getCompleteTheLook(product: Product, limit = 4): Promise<Product[]> {
  return completeTheLook(await getAllProducts(), product, limit);
}

export async function getStoreSettings(): Promise<StoreSettings> {
  "use cache";
  cacheTag(SETTINGS_TAG);
  cacheLife("hours");
  return readSettings();
}
