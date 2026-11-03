import { NextResponse } from "next/server";
import { currentCustomer } from "@/lib/server/customer-auth";
import { toPublicCustomer } from "@/lib/server/customers";

/** Who is signed in (for the header and client state). Never cached. */
export async function GET() {
  const c = await currentCustomer();
  return NextResponse.json(
    c ? { customer: toPublicCustomer(c) } : { customer: null },
    { headers: { "cache-control": "private, no-store" } },
  );
}
