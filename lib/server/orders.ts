import "server-only";
import { randomBytes } from "node:crypto";
import type { Order, OrderStatus } from "@/lib/types";
import { db, parseJson } from "./db";

interface Row {
  id: string;
  created_at: string;
  status: OrderStatus;
  customer: string;
  items: string;
  subtotal: number;
  discount: number;
  coupon_code: string | null;
  shipping: number;
  shipping_method: Order["shippingMethod"];
  total: number;
  session_id: string | null;
  notes: string;
  customer_id: string | null;
  payment_ref: string | null;
  payment_id: string | null;
}

const toOrder = (r: Row): Order => ({
  id: r.id,
  createdAt: r.created_at,
  status: r.status,
  customer: parseJson(r.customer, {} as Order["customer"]),
  items: parseJson(r.items, []),
  subtotal: r.subtotal,
  discount: r.discount,
  couponCode: r.coupon_code,
  shipping: r.shipping,
  shippingMethod: r.shipping_method,
  total: r.total,
  sessionId: r.session_id,
  notes: r.notes,
  customerId: r.customer_id,
  paymentRef: r.payment_ref,
  paymentId: r.payment_id,
});

export const ORDER_STATUSES: OrderStatus[] = ["placed", "paid", "processing", "shipped", "delivered", "cancelled", "refunded"];

export function newOrderId() {
  const d = new Date();
  const ymd = `${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  return `SP${ymd}-${randomBytes(2).toString("hex").toUpperCase()}`;
}

export function insertOrder(o: Order) {
  db()
    .prepare(
      "INSERT INTO orders (id, created_at, status, customer, items, subtotal, discount, coupon_code, shipping, shipping_method, total, session_id, notes, customer_id) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
    )
    .run(
      o.id,
      o.createdAt,
      o.status,
      JSON.stringify(o.customer),
      JSON.stringify(o.items),
      o.subtotal,
      o.discount,
      o.couponCode,
      o.shipping,
      o.shippingMethod,
      o.total,
      o.sessionId,
      o.notes,
      o.customerId ?? null,
    );
}

export function listOrders(opts: { status?: OrderStatus; q?: string; limit?: number; offset?: number } = {}) {
  const where: string[] = [];
  const args: (string | number)[] = [];
  if (opts.status) {
    where.push("status = ?");
    args.push(opts.status);
  }
  if (opts.q) {
    where.push("(id LIKE ? OR customer LIKE ?)");
    args.push(`%${opts.q}%`, `%${opts.q}%`);
  }
  const clause = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const total = (db().prepare(`SELECT COUNT(*) AS n FROM orders ${clause}`).get(...args) as { n: number }).n;
  const rows = db()
    .prepare(`SELECT * FROM orders ${clause} ORDER BY created_at DESC LIMIT ? OFFSET ?`)
    .all(...args, opts.limit ?? 50, opts.offset ?? 0) as unknown as Row[];
  return { total, orders: rows.map(toOrder) };
}

export function findOrder(id: string) {
  const r = db().prepare("SELECT * FROM orders WHERE id = ?").get(id) as Row | undefined;
  return r ? toOrder(r) : undefined;
}

export function updateOrder(id: string, patch: { status?: OrderStatus; notes?: string }) {
  if (patch.status) db().prepare("UPDATE orders SET status = ? WHERE id = ?").run(patch.status, id);
  if (patch.notes !== undefined) db().prepare("UPDATE orders SET notes = ? WHERE id = ?").run(patch.notes, id);
}

/** Statuses that hold stock. Moving between these and cancelled/refunded releases or re-takes it. */
export const STOCK_RELEASED: OrderStatus[] = ["cancelled", "refunded"];

export function setPaymentRef(id: string, ref: string) {
  db().prepare("UPDATE orders SET payment_ref = ? WHERE id = ?").run(ref, id);
}

export function findOrderByPaymentRef(ref: string) {
  const r = db().prepare("SELECT * FROM orders WHERE payment_ref = ?").get(ref) as Row | undefined;
  return r ? toOrder(r) : undefined;
}

/**
 * Mark an awaiting-payment order as paid. Returns the order only for the call
 * that made the change, so the checkout handler and the webhook can both call
 * this and the confirmation email still goes out once.
 */
export function markOrderPaid(id: string, paymentId: string) {
  const res = db().prepare("UPDATE orders SET status = 'paid', payment_id = ? WHERE id = ? AND status = 'placed'").run(paymentId.slice(0, 64), id);
  return res.changes ? findOrder(id) : undefined;
}

/**
 * Orders that went to Razorpay but were never paid, older than `minutes`.
 * They are cancelled (and their stock released) by the caller.
 */
export function unpaidOrdersOlderThan(minutes: number) {
  const cutoff = new Date(Date.now() - minutes * 60_000).toISOString();
  return (db().prepare("SELECT * FROM orders WHERE status = 'placed' AND payment_ref IS NOT NULL AND payment_id IS NULL AND created_at < ?").all(cutoff) as unknown as Row[]).map(
    toOrder,
  );
}

export function orderStatusCounts(): Partial<Record<OrderStatus, number>> {
  const rows = db().prepare("SELECT status, COUNT(*) AS n FROM orders GROUP BY status").all() as { status: OrderStatus; n: number }[];
  return Object.fromEntries(rows.map((r) => [r.status, r.n]));
}

export function recentOrders(limit = 6) {
  return listOrders({ limit }).orders;
}

/** Orders for a customer account — linked orders plus earlier guest orders with the same email. */
export function listOrdersForCustomer(customerId: string, email: string) {
  const rows = db()
    .prepare(
      "SELECT * FROM orders WHERE customer_id = ? OR (customer_id IS NULL AND lower(json_extract(customer, '$.email')) = lower(?)) ORDER BY created_at DESC LIMIT 200",
    )
    .all(customerId, email) as unknown as Row[];
  return rows.map(toOrder);
}

/**
 * Per-customer totals, matching listOrdersForCustomer: linked orders plus
 * earlier guest orders with the same email. `orders` counts every order;
 * `spend` excludes cancelled and refunded ones.
 */
export function orderStatsByCustomer() {
  return db()
    .prepare(
      `SELECT c.id AS id, COUNT(o.id) AS orders,
              COALESCE(SUM(CASE WHEN o.status NOT IN ('cancelled','refunded') THEN o.total END), 0) AS spend,
              MAX(o.created_at) AS last
       FROM customers c
       JOIN orders o ON o.customer_id = c.id
                     OR (o.customer_id IS NULL AND lower(json_extract(o.customer, '$.email')) = c.email)
       GROUP BY c.id`,
    )
    .all() as { id: string; orders: number; spend: number; last: string }[];
}
