/**
 * Signed admin session tokens (HMAC-SHA256 via Web Crypto), usable from
 * proxy.ts and from server code. Format: base64url(payload).base64url(sig)
 */

export const SESSION_COOKIE = "sp_admin";
export const SESSION_TTL_SECONDS = 60 * 60 * 12;
export const REMEMBER_TTL_SECONDS = 60 * 60 * 24 * 30;

const DEV_SECRET = "dev-only-sarpech-secret-change-me";

export function sessionSecret(): string | null {
  const s = process.env.ADMIN_SECRET;
  if (s && s.length >= 32) return s;
  return process.env.NODE_ENV === "production" ? null : DEV_SECRET;
}

const enc = new TextEncoder();

function b64url(bytes: ArrayBuffer | Uint8Array) {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let s = "";
  for (const b of arr) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromB64url(s: string) {
  const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

async function key(secret: string) {
  return crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}

export interface SessionPayload {
  sub: string; // admin email
  exp: number; // unix seconds
}

export async function signSession(sub: string, ttlSeconds = SESSION_TTL_SECONDS): Promise<string | null> {
  const secret = sessionSecret();
  if (!secret) return null;
  const payload: SessionPayload = { sub, exp: Math.floor(Date.now() / 1000) + ttlSeconds };
  const body = b64url(enc.encode(JSON.stringify(payload)));
  const sig = await crypto.subtle.sign("HMAC", await key(secret), enc.encode(body));
  return `${body}.${b64url(sig)}`;
}

export async function verifySession(token: string | undefined): Promise<SessionPayload | null> {
  const secret = sessionSecret();
  if (!secret || !token) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  try {
    const ok = await crypto.subtle.verify("HMAC", await key(secret), fromB64url(sig), enc.encode(body));
    if (!ok) return null;
    const payload = JSON.parse(new TextDecoder().decode(fromB64url(body))) as SessionPayload;
    return payload.exp > Date.now() / 1000 ? payload : null;
  } catch {
    return null;
  }
}
