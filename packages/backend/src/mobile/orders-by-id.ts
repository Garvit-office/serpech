/* Mobile API v1 — orders/[id]. Mounted by apps/web/app/api/mobile/v1/orders/[id]/route.ts. */
import type { NextRequest } from "next/server";
import { fail, json, withCustomer } from "../mobile-api";
import { findOrder } from "../orders";

export const GET = withCustomer(async (_req: NextRequest, c, ctx: { params: Promise<{ id: string }> }) => {
  const order = findOrder(decodeURIComponent((await ctx.params).id));
  const mine = order && (order.customerId === c.id || (!order.customerId && order.customer.email.toLowerCase() === c.email.toLowerCase()));
  if (!order || !mine) return fail(404, "Order not found.");
  // Internal fields (atelier notes, browsing session) stay on the server.
  return json({ order: { ...order, notes: undefined, sessionId: undefined } });
});
