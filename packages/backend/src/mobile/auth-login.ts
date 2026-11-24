/* Mobile API v1 — auth/login. Mounted by apps/web/app/api/mobile/v1/auth/login/route.ts. */
import type { NextRequest } from "next/server";
import { authenticate, snapshot } from "../account-core";
import { fail, ipOf, issueToken, json, readJson } from "../mobile-api";

export async function POST(req: NextRequest) {
  const body = await readJson(req);
  if (!body) return fail(400, "Invalid request.");
  const res = await authenticate(body.email, body.password, ipOf(req));
  if (!res.ok) return fail(401, res.error);
  const { token, expires } = issueToken(res.customer.id, req);
  return json({ token, expiresAt: expires.toISOString(), ...snapshot(res.customer) });
}
