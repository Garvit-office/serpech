"use server";

import { categories } from "@sarpech/core/categories";
import { adminGuard, done, type ActionResult } from "@sarpech/backend/admin-action";
import { listProducts } from "@sarpech/backend/products";
import { deleteSale, findSale, saveSale, type SaleInput } from "@sarpech/backend/sales";

function validIso(v: unknown) {
  if (v === null || v === undefined || v === "") return null;
  const d = new Date(String(v));
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
}

export async function saveSaleAction(raw: SaleInput, id?: string): Promise<ActionResult> {
  const admin = await adminGuard();
  if (id && !findSale(id)) return { ok: false, error: "This sale no longer exists." };
  const errors: Record<string, string> = {};
  const name = String(raw.name ?? "").trim().slice(0, 80);
  const badge = String(raw.badge ?? "").trim().slice(0, 24) || "Sale";
  const percent = Math.round(Number(raw.percent) * 10) / 10;
  const scope = (["all", "categories", "products"] as const).includes(raw.scope) ? raw.scope : "all";
  const startsAt = validIso(raw.startsAt);
  const endsAt = validIso(raw.endsAt);

  if (name.length < 2) errors.name = "Give the sale a name.";
  if (!Number.isFinite(percent) || percent < 1 || percent > 90) errors.percent = "Enter a discount between 1% and 90%.";
  if (startsAt === undefined) errors.startsAt = "Invalid start date.";
  if (endsAt === undefined) errors.endsAt = "Invalid end date.";
  if (startsAt && endsAt && new Date(endsAt) <= new Date(startsAt)) errors.endsAt = "The end must be after the start.";

  let targets: string[] = [];
  if (scope === "categories") {
    targets = (raw.targets ?? []).filter((t) => categories.some((c) => c.slug === t));
    if (!targets.length) errors.targets = "Choose at least one category.";
  } else if (scope === "products") {
    const slugs = new Set(listProducts({ includeDrafts: true }).map((p) => p.slug));
    targets = (raw.targets ?? []).filter((t) => slugs.has(t)).slice(0, 500);
    if (!targets.length) errors.targets = "Choose at least one product.";
  }
  if (Object.keys(errors).length) return { ok: false, error: "Please fix the highlighted fields.", fieldErrors: errors };

  const sale = saveSale({ name, badge, percent, scope, targets, startsAt: startsAt ?? null, endsAt: endsAt ?? null, active: !!raw.active }, id);
  done(admin, {
    action: id ? "update" : "create",
    entity: "sale",
    id: sale.id,
    summary: `${id ? "Updated" : "Created"} sale “${sale.name}” (${sale.percent}% off${scope === "all" ? ", storewide" : ""})`,
    refresh: ["catalog"],
  });
  return { ok: true, id: sale.id };
}

export async function toggleSaleAction(id: string): Promise<ActionResult> {
  const admin = await adminGuard();
  const s = findSale(id);
  if (!s) return { ok: false, error: "Sale not found." };
  saveSale({ ...s, active: !s.active }, id);
  done(admin, { action: s.active ? "pause" : "resume", entity: "sale", id, summary: `${s.active ? "Paused" : "Resumed"} sale “${s.name}”`, refresh: ["catalog"] });
  return { ok: true };
}

export async function deleteSaleAction(id: string): Promise<ActionResult> {
  const admin = await adminGuard();
  const s = findSale(id);
  if (!s) return { ok: false, error: "Sale not found." };
  deleteSale(id);
  done(admin, { action: "delete", entity: "sale", id, summary: `Deleted sale “${s.name}”`, refresh: ["catalog"] });
  return { ok: true };
}
