import { NextResponse } from "next/server";
import { currentCustomer } from "@sarpech/backend/customer-auth";
import { toPublicCustomer } from "@sarpech/backend/customers";

/** Who is signed in (for the header and client state). Never cached. */
export async function GET() {
  const c = await currentCustomer();
  return NextResponse.json(
    c ? { customer: toPublicCustomer(c) } : { customer: null },
    { headers: { "cache-control": "private, no-store" } },
  );
}
