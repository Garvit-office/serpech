/* Mobile API v1 — checkout/coupon. Mounted by apps/web/app/api/mobile/v1/checkout/coupon/route.ts. */
import type { NextRequest } from "next/server";
import { applyCoupon, type LineInput } from "../checkout";
import { fail, json, readJson } from "../mobile-api";

export async function POST(req: NextRequest) {
  const body = await readJson<{ code?: string; lines?: LineInput[] }>(req);
  if (!body) return fail(400, "Invalid request.");
  const res = await applyCoupon(String(body.code ?? ""), body.lines ?? [], null);
  return res.ok ? json(res) : fail(422, res.message);
}
