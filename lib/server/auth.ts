import "server-only";
import { timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { REMEMBER_TTL_SECONDS, SESSION_COOKIE, SESSION_TTL_SECONDS, sessionSecret, signSession, verifySession } from "@/lib/auth-token";

/**
 * Single admin account from environment variables:
 *   ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_SECRET (32+ chars).
 * In development, defaults are used so the admin works out of the box.
 */
const DEV_EMAIL = "admin@sarpech.in";
const DEV_PASSWORD = "sarpech-admin";

export function adminCredentials(): { email: string; password: string } | null {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (email && password) return { email, password };
  return process.env.NODE_ENV === "production" ? null : { email: DEV_EMAIL, password: DEV_PASSWORD };
}

export function authConfigured() {
  return !!adminCredentials() && !!sessionSecret();
}

function safeEqual(a: string, b: string) {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

/* Simple in-memory throttle: 5 failed attempts per key per 10 minutes. */
const attempts = new Map<string, { n: number; until: number }>();

export function loginBlocked(key: string) {
  const a = attempts.get(key);
  return !!a && a.n >= 5 && a.until > Date.now();
}

export async function attemptLogin(email: string, password: string, key: string, remember = false): Promise<boolean> {
  const creds = adminCredentials();
  const ok = !!creds && safeEqual(email.trim().toLowerCase(), creds.email.toLowerCase()) && safeEqual(password, creds.password);
  if (!ok) {
    const a = attempts.get(key);
    const fresh = !a || a.until < Date.now();
    attempts.set(key, { n: fresh ? 1 : a.n + 1, until: Date.now() + 10 * 60_000 });
    return false;
  }
  attempts.delete(key);
  const ttl = remember ? REMEMBER_TTL_SECONDS : SESSION_TTL_SECONDS;
  const token = await signSession(creds!.email, ttl);
  if (!token) return false;
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ttl,
  });
  return true;
}

export async function logout() {
  (await cookies()).delete(SESSION_COOKIE);
}

/** Current admin email, or null. */
export async function currentAdmin(): Promise<string | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return (await verifySession(token))?.sub ?? null;
}

/** Guard for admin pages and server actions. Redirects to login when signed out. */
export async function requireAdmin(): Promise<string> {
  const admin = await currentAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}
