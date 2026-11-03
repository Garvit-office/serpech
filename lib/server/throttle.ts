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
