/* Mobile API v1 — checkout/confirm. Mounted by apps/web/app/api/mobile/v1/checkout/confirm/route.ts. */
import type { NextRequest } from "next/server";
import { confirmOrderPayment } from "../checkout";
import { fail, json, readJson } from "../mobile-api";

/** Verify Razorpay's payment signature and mark the order paid. */
export async function POST(req: NextRequest) {
  const body = await readJson<{ orderId: string; razorpayOrderId: string; paymentId: string; signature: string }>(req);
  if (!body) return fail(400, "Invalid request.");
  const res = await confirmOrderPayment(body);
  return res.ok ? json({ ok: true }) : fail(422, res.message ?? "Payment could not be confirmed.");
}
