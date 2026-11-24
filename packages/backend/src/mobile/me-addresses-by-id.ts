/* Mobile API v1 — me/addresses/[id]. Mounted by apps/web/app/api/mobile/v1/me/addresses/[id]/route.ts. */
import type { NextRequest } from "next/server";
import { deleteAddress } from "../account-core";
import { json, withCustomer } from "../mobile-api";

export const DELETE = withCustomer(async (_req: NextRequest, c, ctx: { params: Promise<{ id: string }> }) => {
  const { id } = await ctx.params;
  return json({ addresses: deleteAddress(c, decodeURIComponent(id)) });
});
