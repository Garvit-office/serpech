/* Mobile API v1 — me/addresses. Mounted by apps/web/app/api/mobile/v1/me/addresses/route.ts. */
import type { NextRequest } from "next/server";
import type { Address } from "@sarpech/core/types";
import { saveAddress } from "../account-core";
import { fail, json, readJson, withCustomer } from "../mobile-api";

/** Add or update an address (send its id to update). */
export const POST = withCustomer(async (req: NextRequest, c) => {
  const body = await readJson<Partial<Address>>(req);
  if (!body) return fail(400, "Invalid request.");
  const res = saveAddress(c, body);
  return res.ok ? json({ addresses: res.addresses }) : fail(422, "Please check the highlighted fields.", { fieldErrors: res.fieldErrors });
});
