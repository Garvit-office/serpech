import "server-only";

/** In-memory sliding throttle: at most `max` hits per key per `windowMs`. */
export function createThrottle(max: number, windowMs: number) {
  const hits = new Map<string, number[]>();
  return {
    blocked(key: string) {
      const now = Date.now();
      const list = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
      hits.set(key, list);
      return list.length >= max;
    },
    hit(key: string) {
      const list = hits.get(key) ?? [];
      list.push(Date.now());
      hits.set(key, list);
      if (hits.size > 5000) hits.clear(); // bound memory
    },
    reset(key: string) {
      hits.delete(key);
    },
  };
}

/**
 * Client IP for throttling. Clients can send their own X-Forwarded-For, so the
 * left-most entry can't be trusted; each proxy appends the address it saw, so
 * we count TRUST_PROXY_HOPS (default 1) entries in from the right.
 */
export function ipFromHeaders(h: Headers) {
  const hops = Math.max(1, Number(process.env.TRUST_PROXY_HOPS) || 1);
  const chain = (h.get("x-forwarded-for") ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  return chain[Math.max(0, chain.length - hops)] || h.get("x-real-ip")?.trim() || "local";
}
