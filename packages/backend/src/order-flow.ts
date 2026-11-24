import "server-only";
import type { Order, OrderStatus } from "@sarpech/core/types";
import { recordEvent } from "./activity";
import { sendOrderConfirmation, sendStatusUpdate } from "./order-mail";
import { STOCK_RELEASED, markOrderPaid, unpaidOrdersOlderThan, updateOrder } from "./orders";
import { releaseStock, retakeStock } from "./stock";

/**
 * Order lifecycle shared by checkout, the Razorpay webhook and the admin.
 * Callers refresh the catalog cache when a function reports stock changed.
 */

/** Minutes an order may wait for payment before it is cancelled and its stock released. */
export const PAYMENT_WINDOW_MINUTES = 60;

/** Record a successful payment (idempotent). Returns true when this call marked it paid. */
export async function completePayment(orderId: string, paymentId: string, source: "checkout" | "webhook") {
  const order = markOrderPaid(orderId, paymentId);
  if (!order) return false;
  recordEvent({ type: "order_paid", sessionId: order.sessionId, path: "/checkout", data: { orderId: order.id, total: order.total, source } });
  await sendOrderConfirmation(order, true);
  return true;
}

/** Cancel orders whose payment was never completed. Returns how many were cancelled (stock changed if > 0). */
export function expireUnpaidOrders() {
  const stale = unpaidOrdersOlderThan(PAYMENT_WINDOW_MINUTES);
  for (const o of stale) {
    updateOrder(o.id, { status: "cancelled", notes: `${o.notes ? `${o.notes}\n` : ""}Payment not completed within ${PAYMENT_WINDOW_MINUTES} minutes — cancelled automatically.` });
    releaseStock(o.items);
  }
  return stale.length;
}

/**
 * Apply an admin status change's side effects: stock and the customer email.
 * Returns whether stock changed and whether a customer email was delivered.
 */
export async function afterStatusChange(order: Order, from: OrderStatus, to: OrderStatus) {
  let stockChanged = false;
  const wasHeld = !STOCK_RELEASED.includes(from);
  const nowHeld = !STOCK_RELEASED.includes(to);
  if (wasHeld && !nowHeld) {
    releaseStock(order.items);
    stockChanged = true;
  } else if (!wasHeld && nowHeld) {
    retakeStock(order.items);
    stockChanged = true;
  }
  const { delivered } = await sendStatusUpdate(order, to);
  return { stockChanged, emailed: delivered };
}
