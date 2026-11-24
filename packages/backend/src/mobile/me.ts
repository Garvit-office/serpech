/* Mobile API v1 — me. Mounted by apps/web/app/api/mobile/v1/me/route.ts. */
import type { NextRequest } from "next/server";
import { snapshot, updateProfile } from "../account-core";
import { deleteCustomer, findCustomer, verifyPassword } from "../customers";
import { fail, json, readJson, withCustomer } from "../mobile-api";

/** The signed-in customer with wishlist and Royal Fit. */
export const GET = withCustomer((_req, c) => json(snapshot(c)));

/** Update name, phone and marketing preference. */
export const PATCH = withCustomer(async (req: NextRequest, c) => {
  const body = await readJson(req);
  if (!body) return fail(400, "Invalid request.");
  const res = updateProfile(c, body);
  if (!res.ok) return fail(422, res.error, { fieldErrors: res.fieldErrors ?? {} });
  return json(snapshot(findCustomer(c.id)!));
});

/** Delete the account (password required). Orders are kept, unlinked. */
export const DELETE = withCustomer(async (req: NextRequest, c) => {
  const body = await readJson(req);
  if (!(await verifyPassword(String(body?.password ?? ""), c.passwordHash))) return fail(403, "Incorrect password.");
  deleteCustomer(c.id);
  return json({ ok: true });
});
