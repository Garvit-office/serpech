import "server-only";
import { randomBytes } from "node:crypto";
import type { AdminProduct, Product, ProductStatus } from "@sarpech/core/types";
import { db, nowIso, parseJson } from "./db";

interface Row {
  id: string;
  slug: string;
  status: ProductStatus;
  sort: number;
  data: string;
  created_at: string;
  updated_at: string;
}

function toProduct(r: Row): AdminProduct {
  const data = parseJson<Omit<Product, "id" | "slug">>(r.data, {} as Omit<Product, "id" | "slug">);
  return {
    ...data,
    id: r.id,
    slug: r.slug,
    status: r.status,
    sort: r.sort,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

/** All products, optionally only the ones visible in the store. */
export function listProducts(opts: { includeDrafts?: boolean } = {}): AdminProduct[] {
  const sql = opts.includeDrafts
    ? "SELECT * FROM products ORDER BY sort, created_at"
    : "SELECT * FROM products WHERE status = 'active' ORDER BY sort, created_at";
  return (db().prepare(sql).all() as unknown as Row[]).map(toProduct);
}

export function findProduct(idOrSlug: string): AdminProduct | undefined {
  const r = db().prepare("SELECT * FROM products WHERE id = ? OR slug = ?").get(idOrSlug, idOrSlug) as Row | undefined;
  return r ? toProduct(r) : undefined;
}

export type ProductInput = Omit<Product, "id" | "salePrice" | "saleLabel"> & { status: ProductStatus };

function split(input: ProductInput) {
  const { slug, status, ...rest } = input;
  return { slug, status, data: JSON.stringify(rest) };
}

export function createProduct(input: ProductInput): AdminProduct {
  const id = `SP-${randomBytes(3).toString("hex").toUpperCase()}`;
  const { slug, status, data } = split(input);
  const now = nowIso();
  const { m } = db().prepare("SELECT COALESCE(MAX(sort), 0) + 1 AS m FROM products").get() as { m: number };
  db()
    .prepare("INSERT INTO products (id, slug, status, sort, data, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)")
    .run(id, slug, status, m, data, now, now);
  return findProduct(id)!;
}

export function updateProduct(id: string, input: ProductInput): AdminProduct {
  const { slug, status, data } = split(input);
  db().prepare("UPDATE products SET slug = ?, status = ?, data = ?, updated_at = ? WHERE id = ?").run(slug, status, data, nowIso(), id);
  return findProduct(id)!;
}

export function setProductStatus(id: string, status: ProductStatus) {
  db().prepare("UPDATE products SET status = ?, updated_at = ? WHERE id = ?").run(status, nowIso(), id);
}

export function deleteProduct(id: string) {
  db().prepare("DELETE FROM products WHERE id = ?").run(id);
}

export function slugTaken(slug: string, exceptId?: string) {
  const r = db().prepare("SELECT id FROM products WHERE slug = ?").get(slug) as { id: string } | undefined;
  return !!r && r.id !== exceptId;
}
