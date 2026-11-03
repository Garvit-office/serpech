"use server";

import { revalidatePath } from "next/cache";
import { adminGuard, done, type ActionResult } from "@/lib/server/admin-action";
import { updateTag } from "next/cache";
import { CATALOG_TAG } from "@/lib/catalog";
import { afterStatusChange } from "@/lib/server/order-flow";
import { ORDER_STATUSES, findOrder, updateOrder } from "@/lib/server/orders";
import type { OrderStatus } from "@/lib/types";

export async function setOrderStatus(id: string, status: string): Promise<ActionResult> {
  const admin = await adminGuard();
  const order = findOrder(id);
  if (!order) return { ok: false, error: "Order not found." };
  if (!ORDER_STATUSES.includes(status as OrderStatus)) return { ok: false, error: "Unknown status." };
  if (order.status === status) return { ok: true, message: "No change." };
  updateOrder(id, { status: status as OrderStatus });
  done(admin, { action: "status", entity: "order", id, summary: `Order ${id} marked ${status} (was ${order.status})` });
  // Release or re-take stock, and email the customer for shipped / delivered / cancelled / refunded.
  const fx = await afterStatusChange(order, order.status, status as OrderStatus);
  if (fx.stockChanged) updateTag(CATALOG_TAG);
  revalidatePath(`/admin/orders/${id}`);
  const notifies = ["shipped", "delivered", "cancelled", "refunded"].includes(status);
  const note = !notifies ? "" : fx.emailed ? " The customer has been emailed." : " No email was sent (email isn't set up yet).";
  return { ok: true, message: `Marked ${status}.${note}` };
}

export async function saveOrderNotes(id: string, notes: string): Promise<ActionResult> {
  const admin = await adminGuard();
  if (!findOrder(id)) return { ok: false, error: "Order not found." };
  const clean = String(notes ?? "").slice(0, 4000);
  updateOrder(id, { notes: clean });
  done(admin, { action: "notes", entity: "order", id, summary: `Updated notes on order ${id}` });
  return { ok: true, message: "Notes saved." };
}
