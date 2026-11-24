import "server-only";
import { revalidateTag } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { CATALOG_TAG } from "./catalog";
import { ipFromHeaders } from "./throttle";
import { createSession, customerForToken, deleteSession, type CustomerRecord } from "./customers";

/**
 * Plumbing for the mobile app's API (/api/mobile/v1/*).
 *
 * The app signs in with a bearer token instead of a cookie: the same
 * customer_sessions table, only the raw token travels in the
 * `Authorization: Bearer …` header and is kept in the phone's secure storage.
 * Only its SHA-256 hash is stored on the server.
 */

/** App sessions last longer than browser ones; signing out or changing the password ends them. */
export const APP_SESSION_DAYS = 90;
const MAX_BODY = 64 * 1024;

export function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: { "cache-control": "private, no-store" } });
}

export function fail(status: number, error: string, extra: Record<string, unknown> = {}) {
  return json({ error, ...extra }, status);
}

export function bearerToken(req: NextRequest) {
  const h = req.headers.get("authorization") ?? "";
  return h.startsWith("Bearer ") ? h.slice(7).trim() : undefined;
}

/** Signed-in customer for this request, or null. */
export function customerOf(req: NextRequest): CustomerRecord | null {
  return customerForToken(bearerToken(req));
}

export function issueToken(customerId: string, req: NextRequest) {
  return createSession(customerId, req.headers.get("user-agent"), APP_SESSION_DAYS);
}

export function revokeToken(req: NextRequest) {
  deleteSession(bearerToken(req));
}

export function ipOf(req: NextRequest) {
  return ipFromHeaders(req.headers);
}

/** Parse a JSON body (max 64 KB). Returns null when it's missing or invalid. */
export async function readJson<T = Record<string, unknown>>(req: NextRequest): Promise<T | null> {
  const len = Number(req.headers.get("content-length") ?? 0);
  if (len > MAX_BODY) return null;
  try {
    const text = await req.text();
    if (text.length > MAX_BODY) return null;
    const v = JSON.parse(text) as unknown;
    return v && typeof v === "object" ? (v as T) : null;
  } catch {
    return null;
  }
}

/** Route handlers can't use updateTag; expire the storefront cache immediately instead. */
export const refreshCatalogFromRoute = () => revalidateTag(CATALOG_TAG, { expire: 0 });

/** Wrap a handler that needs a signed-in customer. */
export function withCustomer<C = unknown>(handler: (req: NextRequest, customer: CustomerRecord, ctx: C) => Promise<Response> | Response) {
  return async (req: NextRequest, ctx: C) => {
    const c = customerOf(req);
    if (!c) return fail(401, "Please sign in again.");
    return handler(req, c, ctx);
  };
}
