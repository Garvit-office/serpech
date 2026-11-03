import "server-only";
import { randomUUID } from "node:crypto";
import type { CategorySlug, Coupon } from "@/lib/types";
import { db, nowIso, parseJson } from "./db";
import { isLive } from "./sales";

interface Row {
  id: string;
  code: string;
  description: string;
  type: Coupon["type"];
  value: number;
  min_order: number;
  max_uses: number | null;
  uses: number;
  categories: string | null;
  starts_at: string | null;
  ends_at: string | null;
  active: number;
  created_at: string;
}

const toCoupon = (r: Row): Coupon => ({
  id: r.id,
  code: r.code,
  description: r.description,
  type: r.type,
  value: r.value,
  minOrder: r.min_order,
  maxUses: r.max_uses,
  uses: r.uses,
  categories: r.categories ? parseJson<CategorySlug[]>(r.categories, []) : null,
  startsAt: r.starts_at,
  endsAt: r.ends_at,
  active: !!r.active,
  createdAt: r.created_at,
});

export const normaliseCode = (code: string) => code.trim().toUpperCase().replace(/\s+/g, "");

export function listCoupons(): Coupon[] {
  return (db().prepare("SELECT * FROM coupons ORDER BY created_at DESC").all() as unknown as Row[]).map(toCoupon);
}

export function findCoupon(idOrCode: string) {
  const r = db().prepare("SELECT * FROM coupons WHERE id = ? OR code = ?").get(idOrCode, normaliseCode(idOrCode)) as Row | undefined;
  return r ? toCoupon(r) : undefined;
}

export type CouponInput = Omit<Coupon, "id" | "uses" | "createdAt">;

export function saveCoupon(input: CouponInput, id?: string): Coupon {
  const values = [
    normaliseCode(input.code),
    input.description,
    input.type,
    input.value,
    input.minOrder,
    input.maxUses,
    input.categories?.length ? JSON.stringify(input.categories) : null,
    input.startsAt,
    input.endsAt,
    input.active ? 1 : 0,
  ] as const;
  if (id) {
    db()
      .prepare(
        "UPDATE coupons SET code=?, description=?, type=?, value=?, min_order=?, max_uses=?, categories=?, starts_at=?, ends_at=?, active=? WHERE id=?",
      )
      .run(...values, id);
    return findCoupon(id)!;
  }
  const newId = randomUUID();
  db()
    .prepare(
      "INSERT INTO coupons (code, description, type, value, min_order, max_uses, categories, starts_at, ends_at, active, id, created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)",
    )
    .run(...values, newId, nowIso());
  return findCoupon(newId)!;
}

export function deleteCoupon(id: string) {
  db().prepare("DELETE FROM coupons WHERE id = ?").run(id);
}

export function codeTaken(code: string, exceptId?: string) {
  const r = db().prepare("SELECT id FROM coupons WHERE code = ?").get(normaliseCode(code)) as { id: string } | undefined;
  return !!r && r.id !== exceptId;
}

export function incrementCouponUse(code: string) {
  db().prepare("UPDATE coupons SET uses = uses + 1 WHERE code = ?").run(normaliseCode(code));
}

export type CouponCheck = { ok: true; coupon: Coupon; discount: number } | { ok: false; message: string };

/**
 * Validate a code against a priced cart. `lines` are post-sale prices.
 * Discount applies to eligible lines only when the coupon is category-limited.
 */
export function evaluateCoupon(code: string, lines: { category: CategorySlug; lineTotal: number }[]): CouponCheck {
  const c = findCoupon(code);
  if (!c) return { ok: false, message: "This code isn't recognised." };
  if (!isLive(c)) return { ok: false, message: "This code has expired or isn't active yet." };
  if (c.maxUses !== null && c.uses >= c.maxUses) return { ok: false, message: "This code has reached its usage limit." };
  const subtotal = lines.reduce((s, l) => s + l.lineTotal, 0);
  if (subtotal < c.minOrder) {
    return { ok: false, message: `Spend ₹${c.minOrder.toLocaleString("en-IN")} or more to use this code.` };
  }
  const eligible = c.categories ? lines.filter((l) => c.categories!.includes(l.category)) : lines;
  const base = eligible.reduce((s, l) => s + l.lineTotal, 0);
  if (base <= 0) return { ok: false, message: "This code doesn't apply to the items in your bag." };
  const discount = Math.min(base, Math.round(c.type === "percent" ? (base * c.value) / 100 : c.value));
  return { ok: true, coupon: c, discount };
}
