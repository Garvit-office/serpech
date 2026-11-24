import "server-only";
import { randomUUID } from "node:crypto";
import { effectivePrice, getAllProducts, getStoreSettings } from "./catalog";
import { recordEvent } from "./activity";
import { evaluateCoupon, incrementCouponUse } from "./coupons";
import { type CustomerRecord, updateCustomer } from "./customers";
import { completePayment, expireUnpaidOrders } from "./order-flow";
import { sendOrderConfirmation } from "./order-mail";
import { findOrder, insertOrder, newOrderId, setPaymentRef, updateOrder } from "./orders";
import { createRazorpayOrder, razorpayConfig, verifyPaymentSignature } from "./razorpay";
import { releaseStock, reserveStock } from "./stock";
import { DESIGN_PRODUCT_ID, designKey, designPrice, designSlug, designTitle, garmentDef, sanitiseDesign } from "@sarpech/core/designer";
import { MTM_SIZE, madeToMeasureAvailable, sanitiseSnapshot } from "@sarpech/core/fit";
import type { CartLine, Order, OrderCustomer, OrderItem } from "@sarpech/core/types";

/**
 * Checkout, shared by the website (server actions in app/actions/store.ts) and
 * the mobile app (/api/mobile/v1/checkout/*). Prices, stock, coupons and
 * payment are always decided here, never by the client.
 *
 * `refreshCatalog` invalidates the storefront cache after stock moves: server
 * actions pass updateTag, route handlers pass revalidateTag(…, { expire: 0 }).
 */

const EMAIL = /^\S+@\S+\.\S+$/;

export type LineInput = Pick<CartLine, "slug" | "size" | "color" | "qty" | "fit" | "design">;

/** Re-price the cart from the database — never trust client prices. */
export async function priceCart(lines: LineInput[]) {
  const [products, settings] = await Promise.all([getAllProducts(), getStoreSettings()]);
  const bySlug = new Map(products.map((p) => [p.slug, p]));
  const items: (OrderItem & { category: (typeof products)[number]["category"]; lineTotal: number })[] = [];
  for (const l of (Array.isArray(lines) ? lines : []).slice(0, 50)) {
    const p = bySlug.get(l?.slug);
    const qty = Math.max(1, Math.min(10, Math.floor(Number(l?.qty) || 0)));
    // Design Studio piece: validate and price the design itself (made to order, Royal Fit included).
    if (l?.design !== undefined) {
      const spec = sanitiseDesign(l.design);
      if (!spec) continue;
      const g = garmentDef(spec.garment);
      const fit = l.size === MTM_SIZE ? sanitiseSnapshot(l.fit) : null;
      if (l.size === MTM_SIZE ? !fit : !g.sizes.includes(l.size)) continue;
      const unitPrice = designPrice(spec).total;
      items.push({
        productId: DESIGN_PRODUCT_ID,
        slug: designSlug(spec.garment),
        name: designTitle(spec),
        size: l.size,
        color: designKey(spec),
        qty,
        unitPrice,
        listPrice: unitPrice,
        ...(fit ? { fit } : {}),
        design: spec,
        category: g.category,
        lineTotal: unitPrice * qty,
      });
      continue;
    }
    if (!p || !p.colors.some((c) => c.name === l.color)) continue;
    const custom = l.size === MTM_SIZE;
    const fit = custom ? sanitiseSnapshot(l.fit) : null;
    if (custom ? !madeToMeasureAvailable(p) || !fit : !p.sizes.includes(l.size)) continue;
    const mtmFee = custom ? settings.madeToMeasureFee : 0;
    const unitPrice = effectivePrice(p) + mtmFee;
    items.push({
      productId: p.id,
      slug: p.slug,
      name: p.name,
      size: l.size,
      color: l.color,
      qty,
      unitPrice,
      listPrice: p.price,
      ...(custom ? { mtmFee, fit: fit! } : {}),
      category: p.category,
      lineTotal: unitPrice * qty,
    });
  }
  return items;
}

export type CouponResult = { ok: true; code: string; discount: number; description: string } | { ok: false; message: string };

export async function applyCoupon(code: string, lines: LineInput[], sessionId?: string | null): Promise<CouponResult> {
  const clean = String(code ?? "").slice(0, 40);
  if (!clean.trim()) return { ok: false, message: "Enter a code." };
  const items = await priceCart(lines);
  const res = evaluateCoupon(clean, items);
  recordEvent({
    type: res.ok ? "coupon_applied" : "coupon_failed",
    sessionId: sessionId ?? null,
    path: "/checkout",
    data: { code: clean.toUpperCase(), ...(res.ok ? { discount: res.discount } : { reason: res.message }) },
  });
  if (!res.ok) return res;
  return { ok: true, code: res.coupon.code, discount: res.discount, description: res.coupon.description };
}

/** Details a client needs to open Razorpay Checkout (never includes the secret). */
export interface PaymentRequest {
  keyId: string;
  razorpayOrderId: string;
  amount: number;
  currency: string;
}

export type PlaceOrderResult = { ok: true; orderId: string; total: number; payment?: PaymentRequest } | { ok: false; message: string };

export interface PlaceOrderInput {
  lines: LineInput[];
  customer: OrderCustomer;
  shippingMethod: "standard" | "express";
  couponCode?: string | null;
  sessionId?: string | null;
  /** Where the order came from, for the activity log ("/checkout" or "app"). */
  channel?: string;
}

export async function createOrder(input: PlaceOrderInput, account: CustomerRecord | null, refreshCatalog: () => void): Promise<PlaceOrderResult> {
  const c = input?.customer;
  if (!c || !EMAIL.test(c.email ?? "") || !c.firstName?.trim() || !c.line1?.trim() || !/^\d{6}$/.test(c.pin ?? "")) {
    return { ok: false, message: "Please check your address details." };
  }
  // Free up stock held by checkouts that were never paid.
  if (expireUnpaidOrders() > 0) refreshCatalog();

  const items = await priceCart(input.lines);
  if (!items.length) return { ok: false, message: "Your bag is empty or its items are no longer available." };

  const settings = await getStoreSettings();
  const subtotal = items.reduce((s, i) => s + i.lineTotal, 0);
  let discount = 0;
  let couponCode: string | null = null;
  if (input.couponCode) {
    const res = evaluateCoupon(input.couponCode, items);
    if (!res.ok) return { ok: false, message: res.message };
    discount = res.discount;
    couponCode = res.coupon.code;
  }
  const afterDiscount = subtotal - discount;
  const shipping =
    input.shippingMethod === "express"
      ? settings.expressShipping
      : afterDiscount >= settings.freeShippingThreshold
        ? 0
        : settings.standardShipping;

  const order: Order = {
    id: newOrderId(),
    createdAt: new Date().toISOString(),
    status: "placed",
    customer: {
      email: c.email.trim().slice(0, 120),
      phone: String(c.phone ?? "").slice(0, 20),
      firstName: c.firstName.trim().slice(0, 60),
      lastName: String(c.lastName ?? "").trim().slice(0, 60),
      line1: c.line1.trim().slice(0, 160),
      line2: String(c.line2 ?? "").trim().slice(0, 160),
      city: String(c.city ?? "").trim().slice(0, 60),
      state: String(c.state ?? "").slice(0, 40),
      pin: c.pin,
    },
    items: items.map((i) => ({
      productId: i.productId,
      slug: i.slug,
      name: i.name,
      size: i.size,
      color: i.color,
      qty: i.qty,
      unitPrice: i.unitPrice,
      listPrice: i.listPrice,
      ...(i.fit ? { ...(i.mtmFee ? { mtmFee: i.mtmFee } : {}), fit: i.fit } : {}),
      ...(i.design ? { design: i.design } : {}),
    })),
    subtotal,
    discount,
    couponCode,
    shipping,
    shippingMethod: input.shippingMethod === "express" ? "express" : "standard",
    total: afterDiscount + shipping,
    sessionId: input.sessionId?.slice(0, 64) ?? null,
    notes: "",
    customerId: null,
  };
  if (account) {
    order.customerId = account.id;
    // First order: remember the address on the account.
    if (!account.addresses.length) {
      const a = order.customer;
      updateCustomer(account.id, {
        addresses: [{ id: randomUUID(), label: "Home", firstName: a.firstName, lastName: a.lastName, phone: a.phone, line1: a.line1, line2: a.line2, city: a.city, state: a.state, pin: a.pin, isDefault: true }],
        ...(account.phone ? {} : { phone: a.phone }),
      });
    }
  }
  const stock = reserveStock(order.items);
  if (!stock.ok) return { ok: false, message: stock.message };
  if (stock.changed) refreshCatalog();

  insertOrder(order);

  let payment: PaymentRequest | undefined;
  const rzp = razorpayConfig();
  if (rzp) {
    try {
      const r = await createRazorpayOrder(order.total, order.id, { order_id: order.id, email: order.customer.email });
      setPaymentRef(order.id, r.id);
      payment = { keyId: rzp.keyId, razorpayOrderId: r.id, amount: r.amount, currency: r.currency };
    } catch (e) {
      console.error(`[checkout] could not start payment for ${order.id}:`, e);
      updateOrder(order.id, { status: "cancelled", notes: "Payment could not be started (Razorpay error) — cancelled automatically." });
      releaseStock(order.items);
      if (stock.changed) refreshCatalog();
      return { ok: false, message: "We couldn't start the payment just now. Nothing was charged — please try again in a moment." };
    }
  }

  if (couponCode) incrementCouponUse(couponCode);
  recordEvent({
    type: "order_placed",
    sessionId: order.sessionId,
    path: input.channel ?? "/checkout",
    data: { orderId: order.id, total: order.total, items: order.items.length, coupon: couponCode, ...(input.channel === "app" ? { channel: "app" } : {}) },
  });
  // Without online payment the order is final now; with Razorpay the email goes out once payment succeeds.
  if (!payment) await sendOrderConfirmation(order, false);
  return { ok: true, orderId: order.id, total: order.total, payment };
}

/**
 * After Razorpay Checkout succeeds. The signature proves the payment came from
 * Razorpay for this order; the webhook does the same server-to-server in case
 * the customer closes the app or tab first.
 */
export async function confirmOrderPayment(input: { orderId: string; razorpayOrderId: string; paymentId: string; signature: string }): Promise<{ ok: boolean; message?: string }> {
  const order = findOrder(String(input?.orderId ?? ""));
  if (!order || !order.paymentRef || order.paymentRef !== input.razorpayOrderId) return { ok: false, message: "We couldn't match this payment to your order." };
  if (!verifyPaymentSignature(input.razorpayOrderId, String(input.paymentId ?? ""), String(input.signature ?? ""))) {
    return { ok: false, message: "The payment could not be verified. If money was taken, contact us and quote your order number." };
  }
  if (order.status === "placed") await completePayment(order.id, input.paymentId, "checkout");
  else if (order.status === "cancelled") {
    // Paid after the payment window closed: keep the record, flag it for the atelier.
    updateOrder(order.id, { notes: `${order.notes ? `${order.notes}\n` : ""}Payment ${input.paymentId} received after the order was cancelled — refund or re-open.` });
    return { ok: false, message: "This order had expired before payment completed. Our team will contact you about a refund." };
  }
  return { ok: true };
}

export function paymentModeNow(): "razorpay" | "none" {
  return razorpayConfig() ? "razorpay" : "none";
}
