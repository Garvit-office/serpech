/* Mobile API v1 — auth/register. Mounted by apps/web/app/api/mobile/v1/auth/register/route.ts. */
import type { NextRequest } from "next/server";
import { registerCustomer, snapshot } from "../account-core";
import { fail, ipOf, issueToken, json, readJson } from "../mobile-api";

export async function POST(req: NextRequest) {
  const body = await readJson(req);
  if (!body) return fail(400, "Invalid request.");
  const res = await registerCustomer(body, ipOf(req));
  if (!res.ok) return fail(422, res.error, { fieldErrors: res.fieldErrors ?? {} });
  const { token, expires } = issueToken(res.customer.id, req);
  return json({ token, expiresAt: expires.toISOString(), ...snapshot(res.customer) }, 201);
}
