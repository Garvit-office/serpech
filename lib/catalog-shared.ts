/**
 * Pure catalogue helpers shared by server and client code. No data access.
 */
import type { Occasion, Product } from "./types";

export function effectivePrice(p: Product) {
  return p.salePrice ?? p.price;
}

export function searchIn(products: Product[], query: string, limit = 24): Product[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const terms = q.split(/\s+/);
  return products
    .map((p) => {
      const hay = [p.name, p.category, p.subcategory, p.fabric, p.description, ...p.colors.map((c) => c.name), ...p.tags]
        .join(" ")
        .toLowerCase();
      const name = p.name.toLowerCase();
      const score = terms.reduce((s, t) => s + (hay.includes(t) ? (name.includes(t) ? 3 : 1) : -10), 0);
      return { p, score };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((r) => r.p);
}

export function completeTheLook(all: Product[], product: Product, limit = 4): Product[] {
  const bySlug = new Map(all.map((p) => [p.slug, p]));
  const picked = (product.completeTheLook ?? []).map((s) => bySlug.get(s)).filter((p): p is Product => !!p);
  if (picked.length >= limit) return picked.slice(0, limit);
  const fill = all.filter(
    (p) =>
      p.slug !== product.slug &&
      p.category !== product.category &&
      !picked.includes(p) &&
      p.occasions.some((o) => product.occasions.includes(o)),
  );
  return [...picked, ...fill].slice(0, limit);
}

export const OCCASIONS: { value: Occasion; label: string }[] = [
  { value: "wedding", label: "Wedding" },
  { value: "reception", label: "Reception" },
  { value: "festive", label: "Festive" },
  { value: "workwear", label: "Workwear" },
  { value: "everyday", label: "Everyday" },
  { value: "travel", label: "Travel" },
];

/** Colour families for filtering, matched against colour names. */
export const COLOR_FAMILIES: { value: string; label: string; swatch: string; match: RegExp }[] = [
  { value: "ivory", label: "Ivory & White", swatch: "#F2EBDC", match: /ivory|white|pearl/i },
  { value: "gold", label: "Gold & Sand", swatch: "#D6B56A", match: /gold|sand|kesariya|tan/i },
  { value: "red", label: "Red & Maroon", swatch: "#7A1E2A", match: /red|maroon|wine|ruby/i },
  { value: "pink", label: "Pink", swatch: "#D9A0A8", match: /pink|blush|rose/i },
  { value: "blue", label: "Blue", swatch: "#1E2A3E", match: /blue|navy/i },
  { value: "green", label: "Green", swatch: "#1F5B45", match: /green|emerald|olive|mint/i },
  { value: "black", label: "Black & Grey", swatch: "#2A2C2E", match: /black|onyx|charcoal|grey/i },
  { value: "brown", label: "Brown", swatch: "#7A4A2A", match: /cognac|brown/i },
];

export const PRICE_BUCKETS: { value: string; label: string; min: number; max: number }[] = [
  { value: "u5", label: "Under ₹5,000", min: 0, max: 4999 },
  { value: "5-15", label: "₹5,000 – ₹15,000", min: 5000, max: 15000 },
  { value: "15-40", label: "₹15,000 – ₹40,000", min: 15001, max: 40000 },
  { value: "40", label: "Above ₹40,000", min: 40001, max: Infinity },
];

export const SIZE_OPTIONS = ["S", "M", "L", "XL", "XXL", "36", "38", "40", "42", "44", "46", "30", "32", "34", "UK 7", "UK 8", "UK 9", "UK 10", "One Size"];

/* ───────────── Stock ───────────── */

/** At or below this many units a size shows "Only N left". */
export const LOW_STOCK = 3;

/** Units left in a size, or null when that size isn't stock-tracked (always available). */
export function stockLeft(p: Pick<Product, "stock">, size: string): number | null {
  const n = p.stock?.[size];
  return typeof n === "number" ? Math.max(0, n) : null;
}

/** Every standard size is tracked and at zero. (Made to measure may still be available.) */
export function allSizesSoldOut(p: Pick<Product, "stock" | "sizes">) {
  return p.sizes.length > 0 && p.sizes.every((s) => stockLeft(p, s) === 0);
}
