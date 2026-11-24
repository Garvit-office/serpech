import type { Coupon, Sale } from "@sarpech/core/types";

export type WindowStatus = "Live" | "Scheduled" | "Expired" | "Paused" | "Used up";

/** Status of a dated campaign (sale or coupon) right now. */
export function windowStatus(s: Pick<Sale, "active" | "startsAt" | "endsAt">, at = new Date()): WindowStatus {
  if (s.endsAt && new Date(s.endsAt) < at) return "Expired";
  if (!s.active) return "Paused";
  if (s.startsAt && new Date(s.startsAt) > at) return "Scheduled";
  return "Live";
}

export function couponStatus(c: Coupon, at = new Date()): WindowStatus {
  const base = windowStatus(c, at);
  if (base === "Live" && c.maxUses !== null && c.uses >= c.maxUses) return "Used up";
  return base;
}

export const STATUS_TONE: Record<WindowStatus, "green" | "gold" | "grey" | "ruby" | "blue"> = {
  Live: "green",
  Scheduled: "blue",
  Expired: "grey",
  Paused: "gold",
  "Used up": "ruby",
};

export function couponValueLabel(c: Pick<Coupon, "type" | "value">) {
  return c.type === "percent" ? `${c.value}% off` : `₹${c.value.toLocaleString("en-IN")} off`;
}

/** ISO → value for <input type="datetime-local"> in the browser's local time. */
export function isoToLocalInput(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** datetime-local value (local time) → ISO, or null when empty. */
export function localInputToIso(v: string) {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
