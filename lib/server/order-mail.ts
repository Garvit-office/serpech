import "server-only";
import { formatINR } from "@/lib/format";
import type { Order, OrderStatus } from "@/lib/types";
import { sendMail, siteUrl } from "./mail";

/* Customer emails about an order. Plain text: reliable in every inbox. */

function itemLines(o: Order) {
  return o.items.map((i) => `  ${i.qty} × ${i.name} (${i.color}, ${i.size}) — ${formatINR(i.unitPrice * i.qty)}`).join("\n");
}

function address(o: Order) {
  const a = o.customer;
  return [`${a.firstName} ${a.lastName}`.trim(), a.line1, a.line2, `${a.city}, ${a.state} ${a.pin}`].filter(Boolean).map((l) => `  ${l}`).join("\n");
}

function orderLink(o: Order) {
  return o.customerId ? `\nView your order: ${siteUrl()}/account/orders/${encodeURIComponent(o.id)}\n` : "";
}

export function sendOrderConfirmation(o: Order, paid: boolean) {
  const first = o.customer.firstName || "there";
  const totals = [
    `  Subtotal: ${formatINR(o.subtotal)}`,
    o.discount ? `  Coupon ${o.couponCode}: −${formatINR(o.discount)}` : null,
    `  Shipping (${o.shippingMethod}): ${o.shipping ? formatINR(o.shipping) : "Complimentary"}`,
    `  Total${paid ? " paid" : ""}: ${formatINR(o.total)}`,
  ]
    .filter(Boolean)
    .join("\n");
  const tailored = o.items.some((i) => i.fit) ? "\nYour made-to-measure pieces go to our master tailor, who will call you if any measurement needs confirming before the cloth is cut.\n" : "";
  return sendMail({
    to: o.customer.email,
    subject: `Your SARPECH order ${o.id}`,
    text: `Dear ${first},

Thank you for your order. ${paid ? "Your payment has been received and" : "We have received it and"} our atelier is preparing your pieces.

Order ${o.id}
${itemLines(o)}

${totals}

Delivering to:
${address(o)}
${tailored}${orderLink(o)}
Questions? Simply reply to this email and quote ${o.id}.

— SARPECH · Crowned in Heritage`,
  });
}

const STATUS_COPY: Partial<Record<OrderStatus, { subject: string; body: string }>> = {
  shipped: { subject: "is on its way", body: "Good news — your order has left our atelier and is on its way to you." },
  delivered: { subject: "has been delivered", body: "Your order has been delivered. We hope it wears like a crown." },
  cancelled: { subject: "has been cancelled", body: "Your order has been cancelled. If a payment was taken, it will be refunded to the original method within 5–7 working days." },
  refunded: { subject: "has been refunded", body: "Your refund has been issued to the original payment method. It usually appears within 5–7 working days." },
};

/** Email the customer when an order moves to a status they care about. Other statuses send nothing. */
export function sendStatusUpdate(o: Order, status: OrderStatus) {
  const copy = STATUS_COPY[status];
  if (!copy) return Promise.resolve({ delivered: false });
  return sendMail({
    to: o.customer.email,
    subject: `Your SARPECH order ${o.id} ${copy.subject}`,
    text: `Dear ${o.customer.firstName || "there"},

${copy.body}

Order ${o.id}
${itemLines(o)}
${orderLink(o)}
Questions? Simply reply to this email and quote ${o.id}.

— SARPECH · Crowned in Heritage`,
  });
}
