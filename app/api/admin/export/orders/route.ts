import type { NextRequest } from "next/server";
import { currentAdmin } from "@/lib/server/auth";
import { ORDER_STATUSES, listOrders } from "@/lib/server/orders";
import type { OrderStatus } from "@/lib/types";
import { csv } from "../csv";

export async function GET(req: NextRequest) {
  if (!(await currentAdmin())) return new Response("Unauthorized", { status: 401 });
  const sp = req.nextUrl.searchParams;
  const status = ORDER_STATUSES.includes(sp.get("status") as OrderStatus) ? (sp.get("status") as OrderStatus) : undefined;
  const q = sp.get("q")?.slice(0, 80) || undefined;
  const { orders } = listOrders({ status, q, limit: 100_000 });
  const body = csv(
    ["Order", "Placed (UTC)", "Status", "First name", "Last name", "Email", "Phone", "Address", "City", "State", "PIN", "Items", "Units", "Subtotal", "Coupon", "Discount", "Shipping method", "Shipping", "Total", "Notes"],
    orders.map((o) => [
      o.id,
      o.createdAt,
      o.status,
      o.customer.firstName,
      o.customer.lastName,
      o.customer.email,
      o.customer.phone,
      [o.customer.line1, o.customer.line2].filter(Boolean).join(", "),
      o.customer.city,
      o.customer.state,
      o.customer.pin,
      o.items.map((i) => `${i.name} (${i.size}, ${i.color}) x${i.qty}`).join("; "),
      o.items.reduce((s, i) => s + i.qty, 0),
      o.subtotal,
      o.couponCode ?? "",
      o.discount,
      o.shippingMethod,
      o.shipping,
      o.total,
      o.notes,
    ]),
  );
  return new Response(body, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="sarpech-orders-${new Date().toISOString().slice(0, 10)}.csv"`,
      "cache-control": "no-store",
    },
  });
}
