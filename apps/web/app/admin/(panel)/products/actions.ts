"use server";

import { categories } from "@sarpech/core/categories";
import { adminGuard, done, type ActionResult } from "@sarpech/backend/admin-action";
import {
  createProduct,
  deleteProduct,
  findProduct,
  listProducts,
  setProductStatus,
  slugTaken,
  updateProduct,
  type ProductInput,
} from "@sarpech/backend/products";
import type { Occasion, ProductTag } from "@sarpech/core/types";

const TAGS: ProductTag[] = ["new", "bestseller", "wedding-edit"];
const OCCASIONS: Occasion[] = ["wedding", "reception", "festive", "workwear", "everyday", "travel"];
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const HEX = /^#[0-9a-f]{6}$/i;
const IMAGE = /^(\/(media|products|logo)\/[\w./-]+|https:\/\/[\w.-]+\/\S+)$/;

const cleanList = (v: unknown, max = 20, len = 200) =>
  (Array.isArray(v) ? v : [])
    .map((s) => String(s ?? "").trim().slice(0, len))
    .filter(Boolean)
    .slice(0, max);

/** Validate and normalise editor input. Returns field errors keyed by field name. */
function validate(raw: ProductInput, id?: string): { input?: ProductInput; errors?: Record<string, string> } {
  const errors: Record<string, string> = {};
  const name = String(raw.name ?? "").trim().slice(0, 120);
  const slug = String(raw.slug ?? "").trim().toLowerCase();
  const price = Math.round(Number(raw.price));

  if (name.length < 2) errors.name = "Enter a product name.";
  if (!SLUG.test(slug)) errors.slug = "Use lowercase letters, numbers and hyphens only.";
  else if (slugTaken(slug, id)) errors.slug = "Another product already uses this URL.";
  if (!categories.some((c) => c.slug === raw.category)) errors.category = "Choose a category.";
  if (!Number.isFinite(price) || price < 1 || price > 10_000_000) errors.price = "Enter a price between ₹1 and ₹1,00,00,000.";

  const sizes = [...new Set(cleanList(raw.sizes, 30, 20))];
  if (!sizes.length) errors.sizes = "Add at least one size.";

  const colors = (Array.isArray(raw.colors) ? raw.colors : []).slice(0, 20).map((c) => ({
    name: String(c?.name ?? "").trim().slice(0, 40),
    hex: String(c?.hex ?? "").trim(),
    images: cleanList(c?.images, 12, 300).filter((u) => IMAGE.test(u)),
  }));
  if (!colors.length) errors.colors = "Add at least one colour.";
  else if (colors.some((c) => !c.name || !HEX.test(c.hex))) errors.colors = "Every colour needs a name and a valid colour.";
  else if (new Set(colors.map((c) => c.name.toLowerCase())).size !== colors.length) errors.colors = "Colour names must be unique.";

  const fabric = String(raw.fabric ?? "").trim().slice(0, 200);
  if (!fabric) errors.fabric = "Describe the fabric.";
  const description = String(raw.description ?? "").trim().slice(0, 2000);
  if (description.length < 10) errors.description = "Write a short description (10+ characters).";

  const images = cleanList(raw.images, 12, 300);
  if (images.some((u) => !IMAGE.test(u))) errors.images = "One of the images has an invalid address.";

  // Stock: whole numbers per size; sizes left blank are not tracked.
  let stock: Record<string, number> | undefined;
  if (raw.stock && typeof raw.stock === "object") {
    stock = {};
    for (const s of sizes) {
      const v = (raw.stock as Record<string, unknown>)[s];
      if (v === undefined || v === null || v === "") continue;
      const n = Number(v);
      if (!Number.isInteger(n) || n < 0 || n > 99_999) {
        errors.stock = `Stock for size ${s} must be a whole number from 0 to 99,999.`;
        break;
      }
      stock[s] = n;
    }
    if (!Object.keys(stock).length) stock = undefined;
  }

  const all = listProducts({ includeDrafts: true });
  const completeTheLook = cleanList(raw.completeTheLook, 8, 100).filter((s) => s !== slug && all.some((p) => p.slug === s));

  if (Object.keys(errors).length) return { errors };
  return {
    input: {
      name,
      slug,
      category: raw.category,
      subcategory: String(raw.subcategory ?? "").trim().slice(0, 60) || undefined,
      price,
      sizes,
      colors: colors.map((c) => (c.images.length ? c : { name: c.name, hex: c.hex })),
      fabric,
      description,
      details: cleanList(raw.details),
      care: cleanList(raw.care),
      tags: TAGS.filter((t) => (raw.tags ?? []).includes(t)),
      occasions: OCCASIONS.filter((o) => (raw.occasions ?? []).includes(o)),
      images: images.length ? images : undefined,
      completeTheLook: completeTheLook.length ? completeTheLook : undefined,
      status: raw.status === "draft" ? "draft" : "active",
      madeToMeasure: typeof raw.madeToMeasure === "boolean" ? raw.madeToMeasure : undefined,
      stock,
    },
  };
}

export async function saveProductAction(raw: ProductInput, id?: string): Promise<ActionResult> {
  const admin = await adminGuard();
  if (id && !findProduct(id)) return { ok: false, error: "This product no longer exists." };
  const { input, errors } = validate(raw, id);
  if (!input) return { ok: false, error: "Please fix the highlighted fields.", fieldErrors: errors };
  const saved = id ? updateProduct(id, input) : createProduct(input);
  done(admin, {
    action: id ? "update" : "create",
    entity: "product",
    id: saved.id,
    summary: `${id ? "Updated" : "Created"} product ${saved.name}${saved.status === "draft" ? " (draft)" : ""}`,
    refresh: ["catalog"],
  });
  return { ok: true, id: saved.id };
}

export async function duplicateProductAction(id: string): Promise<ActionResult> {
  const admin = await adminGuard();
  const p = findProduct(id);
  if (!p) return { ok: false, error: "Product not found." };
  let slug = `${p.slug}-copy`;
  for (let n = 2; slugTaken(slug); n++) slug = `${p.slug}-copy-${n}`;
  const copy = createProduct({
    slug,
    name: `${p.name} (Copy)`,
    status: "draft",
    category: p.category,
    subcategory: p.subcategory,
    price: p.price,
    sizes: p.sizes,
    colors: p.colors,
    fabric: p.fabric,
    description: p.description,
    details: p.details,
    care: p.care,
    tags: p.tags,
    occasions: p.occasions,
    images: p.images,
    completeTheLook: p.completeTheLook,
    madeToMeasure: p.madeToMeasure,
  });
  done(admin, { action: "create", entity: "product", id: copy.id, summary: `Duplicated ${p.name} as a draft`, refresh: ["catalog"] });
  return { ok: true, id: copy.id };
}

export async function toggleProductStatusAction(id: string): Promise<ActionResult> {
  const admin = await adminGuard();
  const p = findProduct(id);
  if (!p) return { ok: false, error: "Product not found." };
  const next = p.status === "active" ? "draft" : "active";
  setProductStatus(id, next);
  done(admin, { action: next === "active" ? "publish" : "unpublish", entity: "product", id, summary: `${next === "active" ? "Published" : "Unpublished"} ${p.name}`, refresh: ["catalog"] });
  return { ok: true };
}

export async function deleteProductAction(id: string): Promise<ActionResult> {
  const admin = await adminGuard();
  const p = findProduct(id);
  if (!p) return { ok: false, error: "Product not found." };
  deleteProduct(id);
  done(admin, { action: "delete", entity: "product", id, summary: `Deleted product ${p.name}`, refresh: ["catalog"] });
  return { ok: true };
}
