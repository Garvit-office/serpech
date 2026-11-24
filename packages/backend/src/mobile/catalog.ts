/* Mobile API v1 — catalog. Mounted by apps/web/app/api/mobile/v1/catalog/route.ts. */
import { connection } from "next/server";
import { categories, getAllProducts, getStoreSettings } from "../catalog";
import { paymentModeNow } from "../checkout";
import { json } from "../mobile-api";

/**
 * Everything the app needs to browse: published products (with live sale
 * prices and stock), categories and store settings. Image paths are relative
 * to the site (e.g. /media/…); the app prefixes its API host.
 */
export async function GET() {
  await connection(); // stock and sales change; always read the (tag-cached) catalogue fresh
  const [products, settings] = await Promise.all([getAllProducts(), getStoreSettings()]);
  return json({ products, categories, settings, paymentMode: paymentModeNow(), fetchedAt: new Date().toISOString() });
}
