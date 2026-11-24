"use server";

import { revalidatePath } from "next/cache";
import { adminGuard, done, type ActionResult } from "@sarpech/backend/admin-action";
import { listFittings, removeSubscriber, setFittingStatus } from "@sarpech/backend/inbox";
import type { FittingStatus } from "@sarpech/core/types";

const STATUSES: FittingStatus[] = ["new", "contacted", "booked", "closed"];

export async function updateFittingStatus(id: string, status: string): Promise<ActionResult> {
  const admin = await adminGuard();
  const f = listFittings().find((x) => x.id === id);
  if (!f) return { ok: false, error: "Request not found." };
  if (!STATUSES.includes(status as FittingStatus)) return { ok: false, error: "Unknown status." };
  setFittingStatus(id, status as FittingStatus);
  done(admin, { action: "status", entity: "fitting", id, summary: `Fitting request from ${f.data.name ?? f.data.email} marked ${status}` });
  revalidatePath("/admin/inbox");
  return { ok: true, message: `Marked ${status}.` };
}

export async function deleteSubscriber(email: string): Promise<ActionResult> {
  const admin = await adminGuard();
  const clean = String(email ?? "").toLowerCase().slice(0, 200);
  removeSubscriber(clean);
  done(admin, { action: "delete", entity: "subscriber", id: clean, summary: `Removed ${clean} from the newsletter` });
  revalidatePath("/admin/inbox");
  return { ok: true };
}
