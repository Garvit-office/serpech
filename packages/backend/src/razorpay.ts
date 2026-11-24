import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Razorpay (https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/).
 * Payments switch on when RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET are set; use
 * test-mode keys (rzp_test_…) until you go live. RAZORPAY_WEBHOOK_SECRET enables
 * /api/razorpay/webhook, which confirms payments even if the customer closes the tab.
 * The secret key never leaves the server.
 */

export function razorpayConfig() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  return keyId && keySecret ? { keyId, keySecret } : null;
}

export interface RazorpayOrder {
  id: string;
  amount: number;
  currency: string;
}

/** Create a Razorpay order for an amount in rupees. */
export async function createRazorpayOrder(amountInr: number, receipt: string, notes: Record<string, string>): Promise<RazorpayOrder> {
  const cfg = razorpayConfig();
  if (!cfg) throw new Error("Razorpay is not configured");
  const res = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${cfg.keyId}:${cfg.keySecret}`).toString("base64")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ amount: Math.round(amountInr * 100), currency: "INR", receipt: receipt.slice(0, 40), notes }),
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`Razorpay order failed: ${res.status} ${await res.text().catch(() => "")}`);
  const o = (await res.json()) as RazorpayOrder;
  return { id: o.id, amount: o.amount, currency: o.currency };
}

function safeEqualHex(a: string, b: string) {
  const x = Buffer.from(a, "utf8");
  const y = Buffer.from(b, "utf8");
  return x.length === y.length && timingSafeEqual(x, y);
}

/** Checkout handler signature: HMAC-SHA256(order_id + "|" + payment_id, key_secret). */
export function verifyPaymentSignature(razorpayOrderId: string, paymentId: string, signature: string) {
  const cfg = razorpayConfig();
  if (!cfg || !razorpayOrderId || !paymentId || !signature) return false;
  const expected = createHmac("sha256", cfg.keySecret).update(`${razorpayOrderId}|${paymentId}`).digest("hex");
  return safeEqualHex(expected, signature);
}

/** Webhook signature: HMAC-SHA256(raw body, webhook secret). */
export function verifyWebhookSignature(rawBody: string, signature: string | null) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret || !signature) return false;
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  return safeEqualHex(expected, signature);
}
