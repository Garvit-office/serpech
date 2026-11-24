import type { ActivityEvent, OrderStatus, TrackEventType } from "@sarpech/core/types";
import { money } from "./format";

export const EVENT_LABEL: Record<TrackEventType, string> = {
  page_view: "Page view",
  product_view: "Product view",
  add_to_cart: "Added to bag",
  remove_from_cart: "Removed from bag",
  wishlist_add: "Wishlisted",
  search: "Search",
  checkout_start: "Checkout started",
  coupon_applied: "Coupon applied",
  coupon_failed: "Coupon rejected",
  order_placed: "Order placed",
  order_paid: "Payment received",
  newsletter_signup: "Newsletter signup",
  fitting_request: "Fitting request",
  fit_profile_saved: "Royal Fit saved",
};

export type Tone = "green" | "gold" | "ruby" | "grey" | "blue";

export const EVENT_TONE: Record<TrackEventType, Tone> = {
  page_view: "grey",
  product_view: "blue",
  add_to_cart: "gold",
  remove_from_cart: "grey",
  wishlist_add: "gold",
  search: "blue",
  checkout_start: "gold",
  coupon_applied: "green",
  coupon_failed: "ruby",
  order_placed: "green",
  order_paid: "green",
  newsletter_signup: "green",
  fitting_request: "green",
  fit_profile_saved: "blue",
};

export const ORDER_TONE: Record<OrderStatus, Tone> = {
  placed: "gold",
  paid: "blue",
  processing: "blue",
  shipped: "green",
  delivered: "green",
  cancelled: "ruby",
  refunded: "grey",
};

const str = (v: unknown) => (typeof v === "string" || typeof v === "number" ? String(v) : "");

/** One plain-English line for an event. `nameOf` resolves a product slug to its name. */
export function describeEvent(e: ActivityEvent, nameOf: (slug: string) => string, subject = "Someone") {
  const d = e.data ?? {};
  const product = d.slug ? nameOf(str(d.slug)) : "a piece";
  const variant = [str(d.size), str(d.color)].filter(Boolean).join(", ");
  switch (e.type) {
    case "page_view":
      return `${subject} viewed ${e.path ?? "a page"}`;
    case "product_view":
      return `${subject} viewed ${product}`;
    case "add_to_cart":
      return `${subject} added ${product}${variant ? ` (${variant})` : ""} to bag${Number(d.qty) > 1 ? ` ×${str(d.qty)}` : ""}`;
    case "remove_from_cart":
      return `${subject} removed ${product} from bag`;
    case "wishlist_add":
      return `${subject} wishlisted ${product}`;
    case "search": {
      const n = Number(d.results);
      return `${subject} searched “${str(d.q)}”${Number.isFinite(n) ? ` · ${n === 0 ? "no results" : `${n} results`}` : ""}`;
    }
    case "checkout_start":
      return `${subject} started checkout${d.subtotal ? ` · ${money(Number(d.subtotal))}` : ""}`;
    case "coupon_applied":
      return `${subject} applied ${str(d.code)}${d.discount ? ` · −${money(Number(d.discount))}` : ""}`;
    case "coupon_failed":
      return `${subject} tried ${str(d.code)} — ${str(d.reason) || "rejected"}`;
    case "order_placed":
      return `${subject} placed order ${str(d.orderId)}${d.total ? ` · ${money(Number(d.total))}` : ""}`;
    case "order_paid":
      return `Payment received for ${str(d.orderId)}${d.total ? ` · ${money(Number(d.total))}` : ""}`;
    case "newsletter_signup":
      return `${subject} joined the newsletter`;
    case "fitting_request":
      return `${subject} requested a fitting${d.atelier ? ` · ${str(d.atelier)}` : ""}`;
    case "fit_profile_saved":
      return `${subject} saved a Royal Fit (${d.method === "camera" ? "camera Fit Check" : str(d.method)}, ${str(d.fit)} fit)`;
    default:
      return `${subject} · ${e.type}`;
  }
}

/** Short visitor label from a session id. */
export const visitorLabel = (sid: string | null) => (sid ? `Visitor ${sid.slice(0, 6)}` : "Unknown visitor");
