/* Mobile API v1 — orders. Mounted by apps/web/app/api/mobile/v1/orders/route.ts. */
import type { NextRequest } from "next/server";
import { json, withCustomer } from "../mobile-api";
import { listOrdersForCustomer } from "../orders";

/** The customer's orders: linked ones plus earlier guest orders with the same email. */
export const GET = withCustomer((_req: NextRequest, c) => json({ orders: listOrdersForCustomer(c.id, c.email) }));
