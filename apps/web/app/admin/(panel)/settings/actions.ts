"use server";

import { revalidatePath } from "next/cache";
import { pruneEvents } from "@sarpech/backend/activity";
import { adminGuard, done, type ActionResult } from "@sarpech/backend/admin-action";
import { readSettings, writeSettings } from "@sarpech/backend/settings";
import type { StoreSettings } from "@sarpech/core/types";

export type SettingsState = (ActionResult & { values?: Record<string, string> }) | null;

function money(v: FormDataEntryValue | null, label: string, errors: Record<string, string>, key: string, max = 1_000_000, unit = "rupees") {
  const s = String(v ?? "").replace(/[,₹\s]/g, "");
  const n = Number(s);
  if (s === "" || !Number.isFinite(n) || n < 0 || n > max || !Number.isInteger(n)) {
    errors[key] = `${label} must be a whole number of ${unit} between 0 and ${max.toLocaleString("en-IN")}.`;
    return 0;
  }
  return n;
}

export async function saveSettings(_prev: SettingsState, form: FormData): Promise<SettingsState> {
  const admin = await adminGuard();
  const errors: Record<string, string> = {};
  const announcement = String(form.get("announcement") ?? "").trim();
  if (!announcement) errors.announcement = "Announcement text is required.";
  else if (announcement.length > 120) errors.announcement = "Keep the announcement under 120 characters so it fits on phones.";
  const next: StoreSettings = {
    announcement,
    freeShippingThreshold: money(form.get("freeShippingThreshold"), "Free-shipping threshold", errors, "freeShippingThreshold"),
    standardShipping: money(form.get("standardShipping"), "Standard shipping", errors, "standardShipping", 10_000),
    expressShipping: money(form.get("expressShipping"), "Express shipping", errors, "expressShipping", 10_000),
    madeToMeasureFee: money(form.get("madeToMeasureFee"), "Made-to-measure fee", errors, "madeToMeasureFee", 100_000),
    madeToMeasureDays: money(form.get("madeToMeasureDays"), "Made-to-measure days", errors, "madeToMeasureDays", 90, "days"),
  };
  const values = Object.fromEntries([...form.entries()].map(([k, v]) => [k, String(v)]));
  if (Object.keys(errors).length) return { ok: false, error: "Please fix the highlighted fields.", fieldErrors: errors, values };

  const before = readSettings();
  const changed = (Object.keys(next) as (keyof StoreSettings)[]).filter((k) => before[k] !== next[k]);
  if (!changed.length) return { ok: true, message: "Nothing changed.", values };
  writeSettings(next);
  done(admin, {
    action: "update",
    entity: "settings",
    summary: `Updated ${changed.map((k) => `${k} (${before[k]} → ${next[k]})`).join(", ")}`,
    refresh: ["settings"],
  });
  revalidatePath("/admin/settings");
  return { ok: true, message: "Saved. The storefront now uses these settings.", values };
}

export async function pruneActivity(days: number): Promise<ActionResult> {
  const admin = await adminGuard();
  const d = Math.floor(Number(days));
  if (!Number.isFinite(d) || d < 7 || d > 3650) return { ok: false, error: "Choose between 7 and 3650 days." };
  const removed = pruneEvents(d);
  done(admin, { action: "delete", entity: "activity", summary: `Pruned ${removed} storefront events older than ${d} days` });
  revalidatePath("/admin/settings");
  return { ok: true, message: `Removed ${removed.toLocaleString("en-IN")} events.` };
}
