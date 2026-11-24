/* Mobile API v1 — auth/forgot. Mounted by apps/web/app/api/mobile/v1/auth/forgot/route.ts. */
import type { NextRequest } from "next/server";
import { requestPasswordReset } from "../account-core";
import { fail, ipOf, json, readJson } from "../mobile-api";

/** Emails a reset link; the customer finishes on the website (/account/reset). */
export async function POST(req: NextRequest) {
  const body = await readJson(req);
  const res = await requestPasswordReset(body?.email, ipOf(req), { host: req.headers.get("host"), proto: req.headers.get("x-forwarded-proto") });
  return res.ok ? json({ ok: true, message: res.message }) : fail(422, res.error);
}
