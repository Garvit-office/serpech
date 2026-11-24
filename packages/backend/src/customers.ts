import "server-only";
import { createHash, randomBytes, randomUUID, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import type { FitProfile } from "@sarpech/core/fit";
import type { Address, CustomerPublic } from "@sarpech/core/types";
import { db, nowIso, parseJson } from "./db";

const scrypt = promisify(scryptCb) as (pw: string, salt: Buffer, len: number, opts: { N: number; r: number; p: number; maxmem: number }) => Promise<Buffer>;

/* ───────────── Passwords (scrypt, per-user salt) ───────────── */

const SCRYPT = { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await scrypt(password.normalize("NFKC"), salt, 64, SCRYPT);
  return `scrypt$${SCRYPT.N}$${SCRYPT.r}$${SCRYPT.p}$${salt.toString("base64")}$${key.toString("base64")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [alg, n, r, p, saltB64, keyB64] = stored.split("$");
  if (alg !== "scrypt" || !saltB64 || !keyB64) return false;
  const expected = Buffer.from(keyB64, "base64");
  const key = await scrypt(password.normalize("NFKC"), Buffer.from(saltB64, "base64"), expected.length, {
    N: Number(n),
    r: Number(r),
    p: Number(p),
    maxmem: SCRYPT.maxmem,
  });
  return key.length === expected.length && timingSafeEqual(key, expected);
}

/** Password rules shown in the UI and enforced here. */
export function passwordProblem(pw: string): string | null {
  if (pw.length < 8) return "Use at least 8 characters.";
  if (pw.length > 200) return "That password is too long.";
  if (!/[A-Za-z]/.test(pw) || !/\d/.test(pw)) return "Include at least one letter and one number.";
  return null;
}

/* ───────────── Customers ───────────── */

interface Row {
  id: string;
  email: string;
  name: string;
  phone: string;
  password_hash: string;
  addresses: string;
  fit_profile: string | null;
  wishlist: string;
  marketing: number;
  created_at: string;
  last_login_at: string | null;
}

export interface CustomerRecord extends CustomerPublic {
  passwordHash: string;
  fitProfile: FitProfile | null;
  wishlist: string[];
  lastLoginAt: string | null;
}

const toRecord = (r: Row): CustomerRecord => ({
  id: r.id,
  email: r.email,
  name: r.name,
  phone: r.phone,
  passwordHash: r.password_hash,
  addresses: parseJson<Address[]>(r.addresses, []),
  fitProfile: r.fit_profile ? parseJson<FitProfile | null>(r.fit_profile, null) : null,
  wishlist: parseJson<string[]>(r.wishlist, []),
  marketing: !!r.marketing,
  createdAt: r.created_at,
  lastLoginAt: r.last_login_at,
});

export function toPublicCustomer(c: CustomerRecord): CustomerPublic {
  return { id: c.id, email: c.email, name: c.name, phone: c.phone, addresses: c.addresses, marketing: c.marketing, createdAt: c.createdAt };
}

export const normaliseEmail = (e: string) => e.trim().toLowerCase();

export function findCustomerByEmail(email: string) {
  const r = db().prepare("SELECT * FROM customers WHERE email = ?").get(normaliseEmail(email)) as Row | undefined;
  return r ? toRecord(r) : undefined;
}

export function findCustomer(id: string) {
  const r = db().prepare("SELECT * FROM customers WHERE id = ?").get(id) as Row | undefined;
  return r ? toRecord(r) : undefined;
}

export async function createCustomer(input: { email: string; name: string; password: string; phone?: string; marketing?: boolean }) {
  const id = randomUUID();
  db()
    .prepare("INSERT INTO customers (id, email, name, phone, password_hash, marketing, created_at) VALUES (?,?,?,?,?,?,?)")
    .run(id, normaliseEmail(input.email), input.name.trim(), input.phone?.trim() ?? "", await hashPassword(input.password), input.marketing ? 1 : 0, nowIso());
  return findCustomer(id)!;
}

export function updateCustomer(id: string, patch: Partial<{ name: string; phone: string; marketing: boolean; addresses: Address[]; fitProfile: FitProfile | null; wishlist: string[] }>) {
  const sets: string[] = [];
  const args: (string | number | null)[] = [];
  if (patch.name !== undefined) {
    sets.push("name = ?");
    args.push(patch.name.trim());
  }
  if (patch.phone !== undefined) {
    sets.push("phone = ?");
    args.push(patch.phone.trim());
  }
  if (patch.marketing !== undefined) {
    sets.push("marketing = ?");
    args.push(patch.marketing ? 1 : 0);
  }
  if (patch.addresses !== undefined) {
    sets.push("addresses = ?");
    args.push(JSON.stringify(patch.addresses));
  }
  if (patch.fitProfile !== undefined) {
    sets.push("fit_profile = ?");
    args.push(patch.fitProfile ? JSON.stringify(patch.fitProfile) : null);
  }
  if (patch.wishlist !== undefined) {
    sets.push("wishlist = ?");
    args.push(JSON.stringify(patch.wishlist));
  }
  if (!sets.length) return;
  db().prepare(`UPDATE customers SET ${sets.join(", ")} WHERE id = ?`).run(...args, id);
}

export async function setPassword(id: string, password: string) {
  db().prepare("UPDATE customers SET password_hash = ? WHERE id = ?").run(await hashPassword(password), id);
}

export function deleteCustomer(id: string) {
  // Orders are kept for the business record but unlinked from the account.
  db().prepare("UPDATE orders SET customer_id = NULL WHERE customer_id = ?").run(id);
  db().prepare("DELETE FROM customers WHERE id = ?").run(id);
}

export function listCustomers(opts: { q?: string; limit?: number; offset?: number } = {}) {
  const where = opts.q ? "WHERE email LIKE ? OR name LIKE ? OR phone LIKE ?" : "";
  const args = opts.q ? [`%${opts.q}%`, `%${opts.q}%`, `%${opts.q}%`] : [];
  const total = (db().prepare(`SELECT COUNT(*) AS n FROM customers ${where}`).get(...args) as { n: number }).n;
  const rows = db()
    .prepare(`SELECT * FROM customers ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`)
    .all(...args, opts.limit ?? 50, opts.offset ?? 0) as unknown as Row[];
  return { total, customers: rows.map(toRecord) };
}

/* ───────────── Sessions ───────────── */

export const CUSTOMER_COOKIE = "sp_session";
export const SESSION_DAYS = 30;

const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

/** Create a session; returns the raw token for the cookie (only its hash is stored). */
export function createSession(customerId: string, userAgent: string | null, days = SESSION_DAYS) {
  const token = randomBytes(32).toString("base64url");
  const now = new Date();
  const expires = new Date(now.getTime() + days * 864e5);
  db()
    .prepare("INSERT INTO customer_sessions (token_hash, customer_id, created_at, expires_at, user_agent) VALUES (?,?,?,?,?)")
    .run(sha256(token), customerId, now.toISOString(), expires.toISOString(), userAgent?.slice(0, 200) ?? null);
  db().prepare("UPDATE customers SET last_login_at = ? WHERE id = ?").run(now.toISOString(), customerId);
  // housekeeping
  db().prepare("DELETE FROM customer_sessions WHERE expires_at < ?").run(now.toISOString());
  return { token, expires };
}

export function customerForToken(token: string | undefined): CustomerRecord | null {
  if (!token || token.length > 100) return null;
  const r = db()
    .prepare("SELECT c.* FROM customer_sessions s JOIN customers c ON c.id = s.customer_id WHERE s.token_hash = ? AND s.expires_at > ?")
    .get(sha256(token), nowIso()) as Row | undefined;
  return r ? toRecord(r) : null;
}

export function deleteSession(token: string | undefined) {
  if (token) db().prepare("DELETE FROM customer_sessions WHERE token_hash = ?").run(sha256(token));
}

/** Sign out everywhere except (optionally) the current session — used after password changes. */
export function deleteOtherSessions(customerId: string, keepToken?: string) {
  if (keepToken) db().prepare("DELETE FROM customer_sessions WHERE customer_id = ? AND token_hash != ?").run(customerId, sha256(keepToken));
  else db().prepare("DELETE FROM customer_sessions WHERE customer_id = ?").run(customerId);
}

/* ───────────── Password reset ───────────── */

export function createResetToken(customerId: string) {
  const token = randomBytes(32).toString("base64url");
  const expires = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour
  db().prepare("DELETE FROM password_resets WHERE customer_id = ?").run(customerId);
  db().prepare("INSERT INTO password_resets (token_hash, customer_id, expires_at) VALUES (?,?,?)").run(sha256(token), customerId, expires);
  return token;
}

export function consumeResetToken(token: string): string | null {
  const row = db()
    .prepare("SELECT customer_id FROM password_resets WHERE token_hash = ? AND used = 0 AND expires_at > ?")
    .get(sha256(token), nowIso()) as { customer_id: string } | undefined;
  if (!row) return null;
  db().prepare("UPDATE password_resets SET used = 1 WHERE token_hash = ?").run(sha256(token));
  return row.customer_id;
}

export function resetTokenValid(token: string) {
  return !!db().prepare("SELECT 1 FROM password_resets WHERE token_hash = ? AND used = 0 AND expires_at > ?").get(sha256(token), nowIso());
}
