import "server-only";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { products as seedProducts } from "@/data/products";

/**
 * SQLite storage (Node's built-in driver). One file: storage/sarpech.db.
 * Every read/write goes through the repositories in lib/server/*, so moving
 * to Postgres or a hosted database means re-implementing those modules only.
 */

export const DATA_DIR = process.env.SARPECH_DATA_DIR ?? join(process.cwd(), "storage");
export const UPLOAD_DIR = join(DATA_DIR, "uploads");

const SCHEMA = `
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'active',
  sort INTEGER NOT NULL DEFAULT 0,
  data TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS coupons (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL DEFAULT '',
  type TEXT NOT NULL CHECK (type IN ('percent','fixed')),
  value REAL NOT NULL,
  min_order REAL NOT NULL DEFAULT 0,
  max_uses INTEGER,
  uses INTEGER NOT NULL DEFAULT 0,
  categories TEXT,
  starts_at TEXT,
  ends_at TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS sales (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  badge TEXT NOT NULL DEFAULT 'Sale',
  percent REAL NOT NULL,
  scope TEXT NOT NULL CHECK (scope IN ('all','categories','products')),
  targets TEXT NOT NULL DEFAULT '[]',
  starts_at TEXT,
  ends_at TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  status TEXT NOT NULL,
  customer TEXT NOT NULL,
  items TEXT NOT NULL,
  subtotal REAL NOT NULL,
  discount REAL NOT NULL DEFAULT 0,
  coupon_code TEXT,
  shipping REAL NOT NULL,
  shipping_method TEXT NOT NULL,
  total REAL NOT NULL,
  session_id TEXT,
  notes TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS orders_created ON orders(created_at);
CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ts TEXT NOT NULL,
  type TEXT NOT NULL,
  session_id TEXT,
  path TEXT,
  device TEXT,
  referrer TEXT,
  data TEXT
);
CREATE INDEX IF NOT EXISTS events_ts ON events(ts);
CREATE INDEX IF NOT EXISTS events_type_ts ON events(type, ts);
CREATE TABLE IF NOT EXISTS audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ts TEXT NOT NULL,
  actor TEXT NOT NULL,
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id TEXT,
  summary TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS subscribers (
  email TEXT PRIMARY KEY,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS fittings (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new',
  data TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL DEFAULT '',
  password_hash TEXT NOT NULL,
  addresses TEXT NOT NULL DEFAULT '[]',
  fit_profile TEXT,
  wishlist TEXT NOT NULL DEFAULT '[]',
  marketing INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  last_login_at TEXT
);
CREATE TABLE IF NOT EXISTS customer_sessions (
  token_hash TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  user_agent TEXT
);
CREATE INDEX IF NOT EXISTS customer_sessions_customer ON customer_sessions(customer_id);
CREATE TABLE IF NOT EXISTS password_resets (
  token_hash TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  expires_at TEXT NOT NULL,
  used INTEGER NOT NULL DEFAULT 0
);
`;

/** Additive migrations for databases created by earlier versions. */
function migrate(db: DatabaseSync) {
  const cols = (table: string) => (db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[]).map((c) => c.name);
  if (!cols("orders").includes("customer_id")) {
    db.exec("ALTER TABLE orders ADD COLUMN customer_id TEXT");
  }
  db.exec("CREATE INDEX IF NOT EXISTS orders_customer ON orders(customer_id)");
  if (!cols("orders").includes("payment_ref")) {
    db.exec("ALTER TABLE orders ADD COLUMN payment_ref TEXT");
    db.exec("ALTER TABLE orders ADD COLUMN payment_id TEXT");
  }
  db.exec("CREATE INDEX IF NOT EXISTS orders_payment_ref ON orders(payment_ref)");
}

function open(): DatabaseSync {
  mkdirSync(UPLOAD_DIR, { recursive: true });
  const db = new DatabaseSync(join(DATA_DIR, "sarpech.db"));
  db.exec("PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;");
  db.exec(SCHEMA);
  migrate(db);
  seed(db);
  keepDurable(db);
  return db;
}

/**
 * Fold the WAL back into the main file every 30 s and on shutdown, so the
 * database file on disk is never more than a few seconds behind — even if a
 * tool outside the app touches the files while the server is running.
 */
function keepDurable(db: DatabaseSync) {
  const checkpoint = (mode: "PASSIVE" | "TRUNCATE") => {
    try {
      db.exec(`PRAGMA wal_checkpoint(${mode})`);
    } catch {
      /* busy: retry on the next tick */
    }
  };
  setInterval(() => checkpoint("PASSIVE"), 30_000).unref();
  process.once("exit", () => checkpoint("TRUNCATE"));
  // Next.js owns shutdown (it exits on these signals); we only flush first.
  for (const sig of ["SIGINT", "SIGTERM"] as const) process.once(sig, () => checkpoint("TRUNCATE"));
}

/** First run only: load the sample catalogue so the storefront isn't empty. */
function seed(db: DatabaseSync) {
  const { n } = db.prepare("SELECT COUNT(*) AS n FROM products").get() as { n: number };
  if (n > 0) return;
  const now = new Date().toISOString();
  const insert = db.prepare(
    "INSERT INTO products (id, slug, status, sort, data, created_at, updated_at) VALUES (?, ?, 'active', ?, ?, ?, ?)",
  );
  db.exec("BEGIN");
  seedProducts.forEach((p, i) => {
    const { id, slug, ...rest } = p;
    insert.run(id, slug, i, JSON.stringify(rest), now, now);
  });
  db.exec("COMMIT");
}

const g = globalThis as unknown as { __sarpechDb?: DatabaseSync };

/** Shared connection (kept on globalThis so dev hot-reload doesn't open new handles). */
export function db(): DatabaseSync {
  if (!g.__sarpechDb) g.__sarpechDb = open();
  return g.__sarpechDb;
}

export function nowIso() {
  return new Date().toISOString();
}

export function parseJson<T>(value: unknown, fallback: T): T {
  if (typeof value !== "string") return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}
