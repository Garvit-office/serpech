import "server-only";
import { randomUUID } from "node:crypto";
import type { Product, Sale } from "@/lib/types";
import { db, nowIso, parseJson } from "./db";

interface Row {
  id: string;
  name: string;
  badge: string;
  percent: number;
  scope: Sale["scope"];
  targets: string;
  starts_at: string | null;
  ends_at: string | null;
  active: number;
  created_at: string;
}

const toSale = (r: Row): Sale => ({
  id: r.id,
  name: r.name,
  badge: r.badge,
  percent: r.percent,
  scope: r.scope,
  targets: parseJson<string[]>(r.targets, []),
  startsAt: r.starts_at,
  endsAt: r.ends_at,
  active: !!r.active,
  createdAt: r.created_at,
});

export function listSales(): Sale[] {
  return (db().prepare("SELECT * FROM sales ORDER BY created_at DESC").all() as unknown as Row[]).map(toSale);
}

export function findSale(id: string) {
  const r = db().prepare("SELECT * FROM sales WHERE id = ?").get(id) as Row | undefined;
  return r ? toSale(r) : undefined;
}

export type SaleInput = Omit<Sale, "id" | "createdAt">;

export function saveSale(input: SaleInput, id?: string): Sale {
  const values = [
    input.name,
    input.badge || "Sale",
    input.percent,
    input.scope,
    JSON.stringify(input.scope === "all" ? [] : input.targets),
    input.startsAt,
    input.endsAt,
    input.active ? 1 : 0,
  ] as const;
  if (id) {
    db()
      .prepare("UPDATE sales SET name=?, badge=?, percent=?, scope=?, targets=?, starts_at=?, ends_at=?, active=? WHERE id=?")
      .run(...values, id);
    return findSale(id)!;
  }
  const newId = randomUUID();
  db()
    .prepare("INSERT INTO sales (name, badge, percent, scope, targets, starts_at, ends_at, active, id, created_at) VALUES (?,?,?,?,?,?,?,?,?,?)")
    .run(...values, newId, nowIso());
  return findSale(newId)!;
}

export function deleteSale(id: string) {
  db().prepare("DELETE FROM sales WHERE id = ?").run(id);
}

/** Is the window open right now? */
export function isLive(s: { active: boolean; startsAt: string | null; endsAt: string | null }, at = new Date()) {
  if (!s.active) return false;
  if (s.startsAt && new Date(s.startsAt) > at) return false;
  if (s.endsAt && new Date(s.endsAt) < at) return false;
  return true;
}

export function liveSales(at = new Date()) {
  return listSales().filter((s) => isLive(s, at));
}

/** Best live sale for a product → computed salePrice + badge. */
export function applySales<T extends Product>(product: T, sales: Sale[]): T {
  let best: Sale | undefined;
  for (const s of sales) {
    const applies =
      s.scope === "all" ||
      (s.scope === "categories" && s.targets.includes(product.category)) ||
      (s.scope === "products" && s.targets.includes(product.slug));
    if (applies && (!best || s.percent > best.percent)) best = s;
  }
  if (!best || best.percent <= 0) return { ...product, salePrice: undefined, saleLabel: undefined };
  const salePrice = Math.round((product.price * (100 - best.percent)) / 100);
  return { ...product, salePrice, saleLabel: best.badge };
}
