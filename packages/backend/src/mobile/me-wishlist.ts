/* Mobile API v1 — me/wishlist. Mounted by apps/web/app/api/mobile/v1/me/wishlist/route.ts. */
import type { NextRequest } from "next/server";
import { updateCustomer } from "../customers";
import { fail, json, readJson, withCustomer } from "../mobile-api";

/** Replace the wishlist (the app sends its full list after adds and removals). */
export const PUT = withCustomer(async (req: NextRequest, c) => {
  const body = await readJson<{ slugs?: unknown }>(req);
  if (!body || !Array.isArray(body.slugs)) return fail(400, "Send { slugs: string[] }.");
  const slugs = [...new Set(body.slugs.filter((s): s is string => typeof s === "string").map((s) => s.slice(0, 120)))].slice(0, 200);
  updateCustomer(c.id, { wishlist: slugs });
  return json({ wishlist: slugs });
});
