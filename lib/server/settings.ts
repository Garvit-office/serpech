import "server-only";
import type { StoreSettings } from "@/lib/types";
import { db, parseJson } from "./db";

export const DEFAULT_SETTINGS: StoreSettings = {
  announcement: "Complimentary shipping above ₹10,000",
  freeShippingThreshold: 10000,
  standardShipping: 350,
  expressShipping: 750,
  madeToMeasureFee: 2500,
  madeToMeasureDays: 14,
};

export function readSettings(): StoreSettings {
  const rows = db().prepare("SELECT key, value FROM settings").all() as { key: string; value: string }[];
  const stored = Object.fromEntries(rows.map((r) => [r.key, parseJson(r.value, null)]));
  return { ...DEFAULT_SETTINGS, ...stored } as StoreSettings;
}

export function writeSettings(patch: Partial<StoreSettings>) {
  const stmt = db().prepare("INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value");
  for (const [k, v] of Object.entries(patch)) stmt.run(k, JSON.stringify(v));
}
