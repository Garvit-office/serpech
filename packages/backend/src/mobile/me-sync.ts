/* Mobile API v1 — me/sync. Mounted by apps/web/app/api/mobile/v1/me/sync/route.ts. */
import type { NextRequest } from "next/server";
import { syncAccount } from "../account-core";
import { json, readJson, withCustomer } from "../mobile-api";

/** Merge this phone's wishlist and Royal Fit into the account (union / newest wins). */
export const PUT = withCustomer(async (req: NextRequest, c) => json(syncAccount(c, (await readJson(req)) ?? {})));
