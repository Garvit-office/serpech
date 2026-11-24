/* Mobile API v1 — me/fit. Mounted by apps/web/app/api/mobile/v1/me/fit/route.ts. */
import type { NextRequest } from "next/server";
import { validateMeasurements, type FitProfile } from "@sarpech/core/fit";
import { updateCustomer } from "../customers";
import { fail, json, readJson, withCustomer } from "../mobile-api";

/** Save (or with { profile: null }, clear) the Royal Fit on the account. */
export const PUT = withCustomer(async (req: NextRequest, c) => {
  const body = await readJson<{ profile?: FitProfile | null }>(req);
  if (!body || !("profile" in body)) return fail(400, "Send { profile }.");
  const p = body.profile;
  if (p && (p.version !== 1 || !validateMeasurements(p.measurements ?? {}).ok)) return fail(422, "Those measurements don't look right.");
  updateCustomer(c.id, { fitProfile: p ?? null });
  return json({ fitProfile: p ?? null });
});
