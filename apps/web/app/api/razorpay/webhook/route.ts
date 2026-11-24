import { revalidateTag } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { CATALOG_TAG } from "@sarpech/backend/catalog";
import { completePayment, expireUnpaidOrders } from "@sarpech/backend/order-flow";
import { findOrderByPaymentRef } from "@sarpech/backend/orders";
import { verifyWebhookSignature } from "@sarpech/backend/razorpay";

/**
 * Razorpay webhook. In the Razorpay Dashboard → Webhooks, point it at
 * https://<your-domain>/api/razorpay/webhook, choose the events
 * `payment.captured` and `order.paid`, and put the same secret in
 * RAZORPAY_WEBHOOK_SECRET. Confirms payment even if the customer's browser
 * never returns to the store.
 */
export async function POST(request: NextRequest) {
  const raw = await request.text();
  if (!verifyWebhookSignature(raw, request.headers.get("x-razorpay-signature"))) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let event: { event?: string; payload?: { payment?: { entity?: { id?: string; order_id?: string; status?: string } } } };
  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Bad JSON" }, { status: 400 });
  }

  if (event.event === "payment.captured" || event.event === "order.paid") {
    const payment = event.payload?.payment?.entity;
    const order = payment?.order_id ? findOrderByPaymentRef(payment.order_id) : undefined;
    if (order && payment?.id) await completePayment(order.id, payment.id, "webhook");
  }

  // Good moment to release stock held by abandoned checkouts.
  if (expireUnpaidOrders() > 0) revalidateTag(CATALOG_TAG, { expire: 0 });

  // Always 200 for a verified event, so Razorpay doesn't retry events we don't handle.
  return NextResponse.json({ ok: true });
}
