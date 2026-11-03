"use server";

import { updateTag } from "next/cache";
import { CATALOG_TAG, effectivePrice, getAllProducts, getStoreSettings } from "@/lib/catalog";
import { randomUUID } from "node:crypto";
import { recordEvent } from "@/lib/server/activity";
import { currentCustomer } from "@/lib/server/customer-auth";
import { updateCustomer } from "@/lib/server/customers";
import { evaluateCoupon, incrementCouponUse } from "@/lib/server/coupons";
import { addFitting, addSubscriber } from "@/lib/server/inbox";
import { completePayment, expireUnpaidOrders } from "@/lib/server/order-flow";
import { sendOrderConfirmation } from "@/lib/server/order-mail";
import { findOrder, insertOrder, newOrderId, setPaymentRef, updateOrder } from "@/lib/server/orders";
import { createRazorpayOrder, razorpayConfig, verifyPaymentSignature } from "@/lib/server/razorpay";
import { releaseStock, reserveStock } from "@/lib/server/stock";
import { MTM_SIZE, madeToMeasureAvailable, sanitiseSnapshot } from "@/lib/fit";
import type { CartLine, Order, OrderCustomer, OrderItem } from "@/lib/types";

const EMAIL = /^\S+@\S+\.\S+$/;

/** Re-price the cart from the database — never trust client prices. */
type LineInput = Pick<CartLine, "slug" | "size" | "color" | "qty" | "fit">;

async function priceCart(lines: LineInput[]) {
  const [products, settings] = await Promise.all([getAllProducts(), getStoreSettings()]);
  const bySlug = new Map(products.map((p) => [p.slug, p]));
  const items: (OrderItem & { category: (typeof products)[number]["category"]; lineTotal: number })[] = [];
  for (const l of lines.slice(0, 50)) {
    const p = bySlug.get(l.slug);
    const qty = Math.max(1, Math.min(10, Math.floor(Number(l.qty) || 0)));
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

export async function checkCoupon(code: string, lines: LineInput[], sessionId?: string): Promise<CouponResult> {
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

/** Details the browser needs to open Razorpay Checkout (never includes the secret). */
export interface PaymentRequest {
  keyId: string;
  razorpayOrderId: string;
  amount: number;
  currency: string;
}

export type PlaceOrderResult = { ok: true; orderId: string; total: number; payment?: PaymentRequest } | { ok: false; message: string };

/** "razorpay" when online payment is configured on the server, otherwise "none". */
export async function paymentMode(): Promise<"razorpay" | "none"> {
  return razorpayConfig() ? "razorpay" : "none";
}

export async function placeOrder(input: {
  lines: LineInput[];
  customer: OrderCustomer;
  shippingMethod: "standard" | "express";
  couponCode?: string | null;
  sessionId?: string;
}): Promise<PlaceOrderResult> {
  const c = input.customer;
  if (!c || !EMAIL.test(c.email) || !c.firstName?.trim() || !c.line1?.trim() || !/^\d{6}$/.test(c.pin ?? "")) {
    return { ok: false, message: "Please check your address details." };
  }
  // Free up stock held by checkouts that were never paid.
  if (expireUnpaidOrders() > 0) updateTag(CATALOG_TAG);

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
      ...(i.fit ? { mtmFee: i.mtmFee, fit: i.fit } : {}),
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
  const account = await currentCustomer();
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
  if (stock.changed) updateTag(CATALOG_TAG);

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
      if (stock.changed) updateTag(CATALOG_TAG);
      return { ok: false, message: "We couldn't start the payment just now. Nothing was charged — please try again in a moment." };
    }
  }

  if (couponCode) incrementCouponUse(couponCode);
  recordEvent({
    type: "order_placed",
    sessionId: order.sessionId,
    path: "/checkout",
    data: { orderId: order.id, total: order.total, items: order.items.length, coupon: couponCode },
  });
  // Without online payment the order is final now; with Razorpay the email goes out once payment succeeds.
  if (!payment) await sendOrderConfirmation(order, false);
  return { ok: true, orderId: order.id, total: order.total, payment };
}

/**
 * Called by the browser after Razorpay Checkout succeeds. The signature proves
 * the payment came from Razorpay for this order; the webhook does the same
 * server-to-server in case the customer closes the tab first.
 */
export async function confirmPayment(input: { orderId: string; razorpayOrderId: string; paymentId: string; signature: string }): Promise<{ ok: boolean; message?: string }> {
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

export async function subscribe(email: string, sessionId?: string): Promise<{ ok: boolean; message: string }> {
  const e = String(email ?? "").trim().slice(0, 120);
  if (!EMAIL.test(e)) return { ok: false, message: "Please enter a valid email address." };
  const added = addSubscriber(e);
  if (added) recordEvent({ type: "newsletter_signup", sessionId: sessionId ?? null, path: "/" });
  return { ok: true, message: added ? "subscribed" : "already" };
}

export async function requestFitting(data: Record<string, string>, sessionId?: string): Promise<{ ok: boolean; message?: string }> {
  const clean = Object.fromEntries(
    Object.entries(data ?? {})
      .slice(0, 20)
      .map(([k, v]) => [String(k).slice(0, 40), String(v ?? "").slice(0, 1000)]),
  );
  if (!clean.email || !EMAIL.test(clean.email)) return { ok: false, message: "Please enter a valid email address." };
  addFitting(clean);
  recordEvent({ type: "fitting_request", sessionId: sessionId ?? null, path: "/contact", data: { atelier: clean.atelier ?? null } });
  return { ok: true };
}
