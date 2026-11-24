"use server";

import { randomBytes } from "node:crypto";
import { categories } from "@sarpech/core/categories";
import { adminGuard, done, type ActionResult } from "@sarpech/backend/admin-action";
import { codeTaken, deleteCoupon, findCoupon, normaliseCode, saveCoupon, type CouponInput } from "@sarpech/backend/coupons";
import type { CategorySlug } from "@sarpech/core/types";

function validIso(v: unknown) {
  if (v === null || v === undefined || v === "") return null;
  const d = new Date(String(v));
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
}

export async function saveCouponAction(raw: CouponInput, id?: string): Promise<ActionResult> {
  const admin = await adminGuard();
  if (id && !findCoupon(id)) return { ok: false, error: "This coupon no longer exists." };
  const errors: Record<string, string> = {};
  const code = normaliseCode(String(raw.code ?? ""));
  const type = raw.type === "fixed" ? "fixed" : "percent";
  const value = Number(raw.value);
  const minOrder = Math.max(0, Math.round(Number(raw.minOrder) || 0));
  const maxUses = raw.maxUses === null || raw.maxUses === undefined || String(raw.maxUses) === "" ? null : Math.floor(Number(raw.maxUses));
  const startsAt = validIso(raw.startsAt);
  const endsAt = validIso(raw.endsAt);
  const cats = (raw.categories ?? []).filter((c): c is CategorySlug => categories.some((x) => x.slug === c));

  if (!/^[A-Z0-9_-]{3,24}$/.test(code)) errors.code = "Use 3–24 letters, numbers, - or _.";
  else if (codeTaken(code, id)) errors.code = "This code already exists.";
  if (type === "percent" && (!Number.isFinite(value) || value < 1 || value > 90)) errors.value = "Enter a percentage between 1 and 90.";
  if (type === "fixed" && (!Number.isFinite(value) || value < 1 || value > 1_000_000)) errors.value = "Enter an amount in rupees.";
  if (maxUses !== null && (!Number.isFinite(maxUses) || maxUses < 1)) errors.maxUses = "Leave empty for unlimited, or enter 1 or more.";
  if (startsAt === undefined) errors.startsAt = "Invalid start date.";
  if (endsAt === undefined) errors.endsAt = "Invalid end date.";
  if (startsAt && endsAt && new Date(endsAt) <= new Date(startsAt)) errors.endsAt = "The end must be after the start.";
  if (Object.keys(errors).length) return { ok: false, error: "Please fix the highlighted fields.", fieldErrors: errors };

  const c = saveCoupon(
    {
      code,
      description: String(raw.description ?? "").trim().slice(0, 140),
      type,
      value: type === "percent" ? Math.round(value * 10) / 10 : Math.round(value),
      minOrder,
      maxUses,
      categories: cats.length ? cats : null,
      startsAt: startsAt ?? null,
      endsAt: endsAt ?? null,
      active: !!raw.active,
    },
    id,
  );
  done(admin, { action: id ? "update" : "create", entity: "coupon", id: c.id, summary: `${id ? "Updated" : "Created"} coupon ${c.code}` });
  return { ok: true, id: c.id };
}

export async function toggleCouponAction(id: string): Promise<ActionResult> {
  const admin = await adminGuard();
  const c = findCoupon(id);
  if (!c) return { ok: false, error: "Coupon not found." };
  saveCoupon({ ...c, active: !c.active }, id);
  done(admin, { action: c.active ? "pause" : "resume", entity: "coupon", id, summary: `${c.active ? "Paused" : "Resumed"} coupon ${c.code}` });
  return { ok: true };
}

export async function deleteCouponAction(id: string): Promise<ActionResult> {
  const admin = await adminGuard();
  const c = findCoupon(id);
  if (!c) return { ok: false, error: "Coupon not found." };
  deleteCoupon(id);
  done(admin, { action: "delete", entity: "coupon", id, summary: `Deleted coupon ${c.code}` });
  return { ok: true };
}

/** Suggest an unused, readable code. */
export async function generateCodeAction(prefix = "ROYAL"): Promise<string> {
  await adminGuard();
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const p = normaliseCode(prefix).replace(/[^A-Z0-9]/g, "").slice(0, 10) || "ROYAL";
  for (;;) {
    const tail = [...randomBytes(5)].map((b) => alphabet[b % alphabet.length]).join("");
    const code = `${p}${tail}`;
    if (!codeTaken(code)) return code;
  }
}
