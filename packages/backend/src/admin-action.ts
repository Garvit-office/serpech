import "server-only";
import { updateTag } from "next/cache";
import { CATALOG_TAG, SETTINGS_TAG } from "./catalog";
import { audit } from "./activity";
import { requireAdmin } from "./auth";

/**
 * Shared plumbing for admin server actions:
 *   const admin = await adminGuard();
 *   ...mutate...
 *   done(admin, { action: "update", entity: "coupon", id, summary: "Edited FESTIVE10", refresh: ["catalog"] })
 */
export async function adminGuard() {
  return requireAdmin();
}

export function done(
  actor: string,
  e: { action: string; entity: string; id?: string | null; summary: string; refresh?: ("catalog" | "settings")[] },
) {
  audit(actor, e.action, e.entity, e.id ?? null, e.summary);
  for (const t of e.refresh ?? []) updateTag(t === "catalog" ? CATALOG_TAG : SETTINGS_TAG);
}

export type ActionResult = { ok: true; message?: string; id?: string } | { ok: false; error: string; fieldErrors?: Record<string, string> };
