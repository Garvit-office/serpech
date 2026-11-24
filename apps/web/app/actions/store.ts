"use server";

import { updateTag } from "next/cache";
import { CATALOG_TAG } from "@sarpech/backend/catalog";
import { recordEvent } from "@sarpech/backend/activity";
import {
  applyCoupon,
  confirmOrderPayment,
  createOrder,
  paymentModeNow,
  type CouponResult,
  type LineInput,
  type PaymentRequest,
  type PlaceOrderInput,
  type PlaceOrderResult,
} from "@sarpech/backend/checkout";
import { currentCustomer } from "@sarpech/backend/customer-auth";
import { addFitting, addSubscriber } from "@sarpech/backend/inbox";

/* Website checkout actions — thin wrappers over lib/server/checkout.ts (shared with the mobile API). */

export type { CouponResult, PaymentRequest, PlaceOrderResult };

const EMAIL = /^\S+@\S+\.\S+$/;
const refreshCatalog = () => updateTag(CATALOG_TAG);

export async function checkCoupon(code: string, lines: LineInput[], sessionId?: string): Promise<CouponResult> {
  return applyCoupon(code, lines, sessionId);
}

/** "razorpay" when online payment is configured on the server, otherwise "none". */
export async function paymentMode(): Promise<"razorpay" | "none"> {
  return paymentModeNow();
}

export async function placeOrder(input: Omit<PlaceOrderInput, "channel">): Promise<PlaceOrderResult> {
  return createOrder({ ...input, channel: "/checkout" }, await currentCustomer(), refreshCatalog);
}

export async function confirmPayment(input: { orderId: string; razorpayOrderId: string; paymentId: string; signature: string }) {
  return confirmOrderPayment(input);
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
