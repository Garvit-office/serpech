/* Mobile API v1 — checkout/order. Mounted by apps/web/app/api/mobile/v1/checkout/order/route.ts. */
import type { NextRequest } from "next/server";
import { createOrder, type PlaceOrderInput } from "../checkout";
import { customerOf, fail, json, readJson, refreshCatalogFromRoute } from "../mobile-api";

/**
 * Place an order from the app (guest or signed in). Same rules as the website:
 * prices, stock and coupons are re-checked here. With Razorpay on, the reply
 * includes `payment` for the app to open Razorpay Checkout.
 */
export async function POST(req: NextRequest) {
  const body = await readJson<PlaceOrderInput>(req);
  if (!body) return fail(400, "Invalid request.");
  const res = await createOrder({ ...body, channel: "app", sessionId: null }, customerOf(req), refreshCatalogFromRoute);
  return res.ok ? json(res, 201) : fail(422, res.message);
}
