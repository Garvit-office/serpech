/** Formatting helpers for the operations admin. Times are shown in IST. */

const TZ = "Asia/Kolkata";
const IST_MS = 330 * 60_000;

const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
const compactInr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", notation: "compact", maximumFractionDigits: 1 });
const num = new Intl.NumberFormat("en-IN");
const compactNum = new Intl.NumberFormat("en-IN", { notation: "compact", maximumFractionDigits: 1 });

export const money = (n: number) => inr.format(Math.round(n || 0));
export const moneyCompact = (n: number) => (Math.abs(n) >= 100000 ? compactInr.format(n) : inr.format(Math.round(n || 0)));
export const count = (n: number) => num.format(n || 0);
export const countCompact = (n: number) => (n >= 10000 ? compactNum.format(n) : num.format(n || 0));
export const pct = (n: number, digits = 1) => `${((n || 0) * 100).toFixed(digits)}%`;

export function dateTime(iso: string) {
  return new Date(iso).toLocaleString("en-IN", { timeZone: TZ, day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

export function dateLong(iso: string) {
  return new Date(iso).toLocaleString("en-IN", { timeZone: TZ, day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function timeAgo(iso: string, now = Date.now()) {
  const s = Math.max(0, Math.round((now - new Date(iso).getTime()) / 1000));
  if (s < 45) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} h ago`;
  const d = Math.round(h / 24);
  return d === 1 ? "yesterday" : `${d} days ago`;
}

export type RangeKey = "today" | "7d" | "30d" | "90d";
export const RANGES: { key: RangeKey; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "7d", label: "7 days" },
  { key: "30d", label: "30 days" },
  { key: "90d", label: "90 days" },
];

/** IST "YYYY-MM-DD" (day) or "YYYY-MM-DDTHH" (hour) for an instant. */
function istKey(ms: number, bucket: "hour" | "day") {
  const s = new Date(ms + IST_MS).toISOString();
  return bucket === "hour" ? s.slice(0, 13) : s.slice(0, 10);
}

/** Start of the range (UTC ISO) plus the full list of IST bucket keys it spans. */
export function rangeWindow(range: RangeKey, now = Date.now()) {
  const days = range === "today" ? 1 : Number.parseInt(range, 10);
  const bucket: "hour" | "day" = range === "today" ? "hour" : "day";
  // midnight IST today, then back (days - 1) days
  const istMidnight = Date.parse(`${istKey(now, "day")}T00:00:00.000Z`) - IST_MS;
  const start = istMidnight - (days - 1) * 864e5;
  const keys: string[] = [];
  const step = bucket === "hour" ? 36e5 : 864e5;
  const end = bucket === "hour" ? now : istMidnight;
  for (let t = start; t <= end; t += step) keys.push(istKey(t, bucket));
  return { since: new Date(start).toISOString(), bucket, keys };
}

/** Axis/tooltip label for a bucket key. */
export function bucketLabel(key: string, bucket: "hour" | "day", long = false) {
  if (bucket === "hour") {
    const h = Number(key.slice(11, 13));
    return `${h % 12 === 0 ? 12 : h % 12}${h < 12 ? "am" : "pm"}`;
  }
  const d = new Date(`${key}T00:00:00Z`);
  return d.toLocaleDateString("en-IN", { timeZone: "UTC", day: "numeric", month: "short", ...(long ? { weekday: "short" } : {}) });
}

export function parseRange(v: unknown): RangeKey {
  return v === "today" || v === "7d" || v === "90d" ? v : "30d";
}
