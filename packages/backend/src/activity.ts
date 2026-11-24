import "server-only";
import type { ActivityEvent, AuditEntry, TrackEventType } from "@sarpech/core/types";
import { db, nowIso, parseJson } from "./db";

export const TRACK_TYPES: TrackEventType[] = [
  "page_view",
  "product_view",
  "add_to_cart",
  "remove_from_cart",
  "wishlist_add",
  "search",
  "checkout_start",
  "coupon_applied",
  "coupon_failed",
  "order_placed",
  "newsletter_signup",
  "fitting_request",
  "fit_profile_saved",
];

/** Reports are bucketed in Indian Standard Time regardless of the server's zone. */
const IST = "'+330 minutes'";

/* ───────────── Storefront events ───────────── */

export function recordEvent(e: {
  type: TrackEventType;
  sessionId?: string | null;
  path?: string | null;
  device?: string | null;
  referrer?: string | null;
  data?: Record<string, unknown> | null;
}) {
  db()
    .prepare("INSERT INTO events (ts, type, session_id, path, device, referrer, data) VALUES (?,?,?,?,?,?,?)")
    .run(
      nowIso(),
      e.type,
      e.sessionId?.slice(0, 64) ?? null,
      e.path?.slice(0, 300) ?? null,
      e.device ?? null,
      e.referrer?.slice(0, 300) ?? null,
      e.data ? JSON.stringify(e.data).slice(0, 2000) : null,
    );
}

interface EventRow {
  id: number;
  ts: string;
  type: TrackEventType;
  session_id: string | null;
  path: string | null;
  device: string | null;
  referrer: string | null;
  data: string | null;
}

const toEvent = (r: EventRow): ActivityEvent => ({
  id: r.id,
  ts: r.ts,
  type: r.type,
  sessionId: r.session_id,
  path: r.path,
  device: r.device,
  referrer: r.referrer,
  data: r.data ? parseJson(r.data, null) : null,
});

export function listEvents(
  opts: { type?: TrackEventType; since?: string; until?: string; limit?: number; offset?: number; sessionId?: string; ascending?: boolean } = {},
) {
  const where: string[] = [];
  const args: (string | number)[] = [];
  if (opts.type) {
    where.push("type = ?");
    args.push(opts.type);
  }
  if (opts.since) {
    where.push("ts >= ?");
    args.push(opts.since);
  }
  if (opts.until) {
    where.push("ts < ?");
    args.push(opts.until);
  }
  if (opts.sessionId) {
    where.push("session_id = ?");
    args.push(opts.sessionId);
  }
  const clause = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const total = (db().prepare(`SELECT COUNT(*) AS n FROM events ${clause}`).get(...args) as { n: number }).n;
  const rows = db()
    .prepare(`SELECT * FROM events ${clause} ORDER BY id ${opts.ascending ? "ASC" : "DESC"} LIMIT ? OFFSET ?`)
    .all(...args, opts.limit ?? 100, opts.offset ?? 0) as unknown as EventRow[];
  return { total, events: rows.map(toEvent) };
}

/** Latest events for the live feed (page views excluded — they drown the signal). */
export function recentEvents(limit = 15) {
  const rows = db()
    .prepare("SELECT * FROM events WHERE type != 'page_view' ORDER BY id DESC LIMIT ?")
    .all(limit) as unknown as EventRow[];
  return rows.map(toEvent);
}

export type Bucket = "hour" | "day";

/** Aggregates for the dashboard over [since, now]. Buckets are IST hours or days. */
export function activitySummary(since: string, bucket: Bucket = "day") {
  const d = db();
  const one = (sql: string, ...a: (string | number)[]) => (d.prepare(sql).get(...a) as { n: number | null }).n ?? 0;
  const counts = Object.fromEntries(
    (d.prepare("SELECT type, COUNT(*) AS n FROM events WHERE ts >= ? GROUP BY type").all(since) as { type: string; n: number }[]).map(
      (r) => [r.type, r.n],
    ),
  ) as Partial<Record<TrackEventType, number>>;
  const live = "status NOT IN ('cancelled','refunded')";
  const visitors = one("SELECT COUNT(DISTINCT session_id) AS n FROM events WHERE ts >= ?", since);
  // Strict funnel: each step only counts sessions that also reached every earlier step.
  const step = (types: TrackEventType[]) =>
    one(
      `SELECT COUNT(*) AS n FROM (${types
        .map(() => "SELECT DISTINCT session_id FROM events WHERE ts >= ? AND type = ? AND session_id IS NOT NULL")
        .join(" INTERSECT ")})`,
      ...types.flatMap((t) => [since, t]),
    );
  const sessionsWithCart = step(["add_to_cart"]);
  const sessionsWithCheckout = step(["add_to_cart", "checkout_start"]);
  const sessionsWithOrder = step(["add_to_cart", "checkout_start", "order_placed"]);
  // Any session that ordered, tracked browsing or not — used for the headline conversion rate.
  const orderingSessions = one("SELECT COUNT(DISTINCT session_id) AS n FROM events WHERE ts >= ? AND type = 'order_placed'", since);
  const orders = one(`SELECT COUNT(*) AS n FROM orders WHERE created_at >= ? AND ${live}`, since);
  const revenue = one(`SELECT SUM(total) AS n FROM orders WHERE created_at >= ? AND ${live}`, since);
  const discounts = one(`SELECT SUM(discount) AS n FROM orders WHERE created_at >= ? AND ${live}`, since);

  // IST bucket key: "YYYY-MM-DD" or "YYYY-MM-DDTHH"
  const len = bucket === "hour" ? 13 : 10;
  const key = (col: string) => `substr(strftime('%Y-%m-%dT%H:%M', ${col}, ${IST}), 1, ${len})`;

  const series = d
    .prepare(
      `SELECT ${key("ts")} AS k,
              SUM(type = 'page_view') AS views,
              COUNT(DISTINCT session_id) AS visitors
         FROM events WHERE ts >= ? GROUP BY k ORDER BY k`,
    )
    .all(since) as { k: string; views: number; visitors: number }[];
  const orderSeries = d
    .prepare(
      `SELECT ${key("created_at")} AS k, COUNT(*) AS orders, SUM(total) AS revenue
         FROM orders WHERE created_at >= ? AND ${live} GROUP BY k ORDER BY k`,
    )
    .all(since) as { k: string; orders: number; revenue: number }[];

  const topBy = (type: TrackEventType, field: string, limit = 8) =>
    d
      .prepare(
        `SELECT json_extract(data, '$.${field}') AS k, COUNT(*) AS n FROM events
          WHERE ts >= ? AND type = ? AND json_extract(data, '$.${field}') IS NOT NULL
          GROUP BY k ORDER BY n DESC LIMIT ?`,
      )
      .all(since, type, limit) as { k: string; n: number }[];

  return {
    visitors,
    counts,
    orders,
    revenue,
    discounts,
    aov: orders ? revenue / orders : 0,
    conversion: visitors ? Math.min(1, orderingSessions / visitors) : 0,
    funnel: { visitors, sessionsWithCart, sessionsWithCheckout, sessionsWithOrder },
    series,
    orderSeries,
    topViewed: topBy("product_view", "slug"),
    topAdded: topBy("add_to_cart", "slug"),
    // last known result count per query, so zero-result searches can be flagged
    topSearches: d
      .prepare(
        `SELECT json_extract(data, '$.q') AS k, COUNT(*) AS n, MIN(COALESCE(json_extract(data, '$.results'), -1)) AS results
           FROM events WHERE ts >= ? AND type = 'search' AND json_extract(data, '$.q') IS NOT NULL
          GROUP BY k ORDER BY n DESC LIMIT 10`,
      )
      .all(since) as { k: string; n: number; results: number }[],
    topPages: d
      .prepare("SELECT path AS k, COUNT(*) AS n FROM events WHERE ts >= ? AND type = 'page_view' GROUP BY path ORDER BY n DESC LIMIT 8")
      .all(since) as { k: string; n: number }[],
    devices: d
      .prepare("SELECT device AS k, COUNT(DISTINCT session_id) AS n FROM events WHERE ts >= ? AND device IS NOT NULL GROUP BY k ORDER BY n DESC")
      .all(since) as { k: string; n: number }[],
    coupons: d
      .prepare(
        `SELECT coupon_code AS k, COUNT(*) AS n, SUM(discount) AS d FROM orders
          WHERE created_at >= ? AND coupon_code IS NOT NULL AND ${live} GROUP BY k ORDER BY n DESC LIMIT 8`,
      )
      .all(since) as { k: string; n: number; d: number }[],
    failedCoupons: one("SELECT COUNT(*) AS n FROM events WHERE ts >= ? AND type = 'coupon_failed'", since),
  };
}

/** Delete storefront events older than `days` (keeps the table small). */
export function pruneEvents(days: number) {
  const cutoff = new Date(Date.now() - days * 864e5).toISOString();
  return Number(db().prepare("DELETE FROM events WHERE ts < ?").run(cutoff).changes);
}

export function eventStats() {
  return db().prepare("SELECT COUNT(*) AS n, MIN(ts) AS oldest FROM events").get() as { n: number; oldest: string | null };
}

/* ───────────── Admin audit log ───────────── */

export function audit(actor: string, action: string, entity: string, entityId: string | null, summary: string) {
  db()
    .prepare("INSERT INTO audit_log (ts, actor, action, entity, entity_id, summary) VALUES (?,?,?,?,?,?)")
    .run(nowIso(), actor, action, entity, entityId, summary);
}

export function listAudit(opts: { limit?: number; offset?: number; entity?: string; entityId?: string } = {}) {
  const where: string[] = [];
  const args: string[] = [];
  if (opts.entity) {
    where.push("entity = ?");
    args.push(opts.entity);
  }
  if (opts.entityId) {
    where.push("entity_id = ?");
    args.push(opts.entityId);
  }
  const clause = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const total = (db().prepare(`SELECT COUNT(*) AS n FROM audit_log ${clause}`).get(...args) as { n: number }).n;
  const rows = db()
    .prepare(`SELECT * FROM audit_log ${clause} ORDER BY id DESC LIMIT ? OFFSET ?`)
    .all(...args, opts.limit ?? 100, opts.offset ?? 0) as unknown as (Omit<AuditEntry, "entityId"> & { entity_id: string | null })[];
  return { total, entries: rows.map(({ entity_id, ...r }) => ({ ...r, entityId: entity_id })) as AuditEntry[] };
}

export function auditEntities(): string[] {
  return (db().prepare("SELECT DISTINCT entity FROM audit_log ORDER BY entity").all() as { entity: string }[]).map((r) => r.entity);
}
