import "server-only";
import { MTM_SIZE } from "@sarpech/core/fit";
import { db, parseJson } from "./db";

/**
 * Per-size stock, stored on the product as `stock: { "40": 3, … }`.
 * A size without an entry is not tracked (always available). Made-to-measure
 * pieces are cut to order and never use stock.
 *
 * node:sqlite is synchronous, so each function below runs start-to-finish
 * without interleaving; the explicit transaction keeps a reservation all-or-nothing.
 */

type Line = { slug: string; size: string; qty: number; name?: string };

/** Sum quantities per product+size (the same size can be in the bag in two colours). */
function group(lines: Line[]) {
  const m = new Map<string, Line>();
  for (const l of lines) {
    if (l.size === MTM_SIZE || l.qty <= 0) continue;
    const k = `${l.slug}\u0000${l.size}`;
    const cur = m.get(k);
    m.set(k, cur ? { ...cur, qty: cur.qty + l.qty } : { ...l });
  }
  return [...m.values()];
}

function readData(slug: string) {
  const r = db().prepare("SELECT data FROM products WHERE slug = ?").get(slug) as { data: string } | undefined;
  return r ? parseJson<{ name?: string; stock?: Record<string, number> }>(r.data, {}) : null;
}

function writeStock(slug: string, data: object) {
  db().prepare("UPDATE products SET data = ? WHERE slug = ?").run(JSON.stringify(data), slug);
}

function shortfall(name: string, size: string, left: number) {
  return left <= 0 ? `${name} in size ${size} has just sold out. Please choose another size.` : `Only ${left} of ${name} left in size ${size}. Please lower the quantity.`;
}

/**
 * Take stock for an order, all or nothing. On failure nothing changes and
 * `message` is customer-facing. `changed` says whether any tracked stock moved.
 */
export function reserveStock(lines: Line[]): { ok: true; changed: boolean } | { ok: false; message: string } {
  const wanted = group(lines);
  if (!wanted.length) return { ok: true, changed: false };
  const conn = db();
  conn.exec("BEGIN IMMEDIATE");
  try {
    const touched = new Map<string, { name?: string; stock?: Record<string, number> }>();
    for (const l of wanted) {
      const data = touched.get(l.slug) ?? readData(l.slug);
      if (!data) continue;
      touched.set(l.slug, data);
      const have = data.stock?.[l.size];
      if (typeof have !== "number") continue; // not tracked
      if (have < l.qty) {
        conn.exec("ROLLBACK");
        return { ok: false, message: shortfall(l.name ?? data.name ?? "This piece", l.size, have) };
      }
      data.stock = { ...data.stock, [l.size]: have - l.qty };
    }
    let changed = false;
    for (const l of wanted) if (typeof touched.get(l.slug)?.stock?.[l.size] === "number") changed = true;
    for (const [slug, data] of touched) if (data.stock) writeStock(slug, data);
    conn.exec("COMMIT");
    return { ok: true, changed };
  } catch (e) {
    conn.exec("ROLLBACK");
    throw e;
  }
}

/** Put stock back (order cancelled, refunded or never paid). */
export function releaseStock(lines: Line[]) {
  adjust(lines, +1);
}

/** Take stock again without checking (an order re-opened by the admin). Never goes below zero. */
export function retakeStock(lines: Line[]) {
  adjust(lines, -1);
}

function adjust(lines: Line[], sign: 1 | -1) {
  const wanted = group(lines);
  if (!wanted.length) return;
  const conn = db();
  conn.exec("BEGIN IMMEDIATE");
  try {
    for (const l of wanted) {
      const data = readData(l.slug);
      const have = data?.stock?.[l.size];
      if (!data || typeof have !== "number") continue;
      data.stock = { ...data.stock, [l.size]: Math.max(0, have + sign * l.qty) };
      writeStock(l.slug, data);
    }
    conn.exec("COMMIT");
  } catch (e) {
    conn.exec("ROLLBACK");
    throw e;
  }
}
