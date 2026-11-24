/**
 * Royal Fit — body measurements, fit preferences and size recommendation.
 * Pure functions, shared by the storefront (client) and checkout (server).
 * All measurements are body measurements in centimetres.
 */
import { SIZE_CHARTS, chartForCategory } from "./size-guide";
import type { CategorySlug, Product } from "./types";

export type FitStyle = "tailored" | "regular" | "relaxed" | "loose";
export type LengthPref = "shorter" | "standard" | "longer";
export type Build = "lean" | "average" | "athletic" | "broad";
export type FitMethod = "camera" | "manual" | "quick";

export interface Measurements {
  chest: number;
  waist: number;
  hip: number;
  shoulder: number;
  sleeve: number;
  inseam: number;
  neck: number;
}

export interface FitPreferences {
  fit: FitStyle;
  length: LengthPref;
  sleeve: LengthPref;
  notes: string;
}

export interface FitProfile {
  version: 1;
  method: FitMethod;
  updatedAt: string;
  heightCm: number;
  weightKg: number | null;
  build: Build | null;
  measurements: Measurements;
  preferences: FitPreferences;
}

export const FIT_STYLES: { value: FitStyle; label: string; short: string; description: string }[] = [
  { value: "tailored", label: "Royal Tailored", short: "Slim", description: "Close to the body, sharp through the chest and waist." },
  { value: "regular", label: "Regular", short: "Classic", description: "Our classic ease — room to move, never boxy." },
  { value: "relaxed", label: "Relaxed", short: "A little baggy", description: "A little extra room through the body and sleeves." },
  { value: "loose", label: "Loose", short: "Generous", description: "A generous, easy drape — comfort first." },
];

export const LENGTH_PREFS: { value: LengthPref; label: string }[] = [
  { value: "shorter", label: "A little shorter" },
  { value: "standard", label: "Standard" },
  { value: "longer", label: "A little longer" },
];

export const BUILDS: { value: Build; label: string }[] = [
  { value: "lean", label: "Lean" },
  { value: "average", label: "Average" },
  { value: "athletic", label: "Athletic" },
  { value: "broad", label: "Broad" },
];

export const MEASUREMENT_FIELDS: { key: keyof Measurements; label: string; how: string; min: number; max: number }[] = [
  { key: "chest", label: "Chest", how: "Around the fullest part, under the arms", min: 70, max: 160 },
  { key: "waist", label: "Waist", how: "Around the natural waist, above the navel", min: 55, max: 160 },
  { key: "hip", label: "Hip", how: "Around the widest part of the seat", min: 70, max: 170 },
  { key: "shoulder", label: "Shoulder", how: "Across the back, shoulder bone to shoulder bone", min: 34, max: 62 },
  { key: "sleeve", label: "Sleeve", how: "Shoulder seam to wrist bone, arm relaxed", min: 48, max: 80 },
  { key: "inseam", label: "Inseam", how: "Crotch to ankle, inside the leg", min: 60, max: 100 },
  { key: "neck", label: "Neck", how: "Around the base of the neck", min: 32, max: 54 },
];

export const DEFAULT_PREFERENCES: FitPreferences = { fit: "regular", length: "standard", sleeve: "standard", notes: "" };

export const MTM_SIZE = "Made to Measure";

/** Categories where made-to-measure is offered unless the product says otherwise. */
const MTM_CATEGORIES: CategorySlug[] = ["sherwanis", "bandhgalas", "kurtas", "nehru-jackets", "shirts", "trousers"];

export function madeToMeasureAvailable(p: Pick<Product, "category" | "madeToMeasure">) {
  return p.madeToMeasure ?? MTM_CATEGORIES.includes(p.category);
}

export const cmToIn = (cm: number) => cm / 2.54;
export const inToCm = (inch: number) => inch * 2.54;
export const round1 = (n: number) => Math.round(n * 10) / 10;

/** Clamp each measurement to a plausible range; returns the names that were out of range. */
export function validateMeasurements(m: Partial<Measurements>): { ok: boolean; invalid: (keyof Measurements)[] } {
  const invalid = MEASUREMENT_FIELDS.filter((f) => {
    const v = Number(m[f.key]);
    return !Number.isFinite(v) || v < f.min || v > f.max;
  }).map((f) => f.key);
  return { ok: invalid.length === 0, invalid };
}

/**
 * Starting-point estimate from height, weight and build, based on typical
 * proportions for adult men. Used for the quick method and to sanity-check
 * camera readings — always shown for review.
 */
export function estimateFromBody(heightCm: number, weightKg: number, build: Build = "average"): Measurements {
  const bmi = weightKg / (heightCm / 100) ** 2;
  const d = bmi - 24.5;
  const h = heightCm - 175;
  const chestB = { lean: -3, average: 0, athletic: 4, broad: 6 }[build];
  const waistB = { lean: -2, average: 0, athletic: -3, broad: 3 }[build];
  const shoulderB = { lean: -1, average: 0, athletic: 1.5, broad: 2.5 }[build];
  return {
    chest: round1(100 + 2.1 * d + 0.25 * h + chestB),
    waist: round1(86 + 2.7 * d + 0.2 * h + waistB),
    hip: round1(98 + 1.8 * d + 0.25 * h),
    shoulder: round1(46 + 0.3 * d + 0.15 * h + shoulderB),
    sleeve: round1(63 + 0.36 * h),
    inseam: round1(80 + 0.45 * h),
    neck: round1(39 + 0.55 * d + 0.03 * h + (build === "broad" ? 1 : 0)),
  };
}

/* ───────────── Size recommendation ───────────── */

/**
 * Size charts list the body measurement each size is cut for (garment ease is
 * already built in). Preference shifts the target: relaxed ≈ one size up,
 * loose ≈ two, tailored stays as close as possible. Inches.
 */
const EASE_IN: Record<FitStyle, { chest: number; waist: number }> = {
  tailored: { chest: -1, waist: -0.5 },
  regular: { chest: 0, waist: 0 },
  relaxed: { chest: 2, waist: 1 },
  loose: { chest: 4, waist: 2 },
};
/** A size still fits if the body is up to this much (inches) over its chart value. */
const TOLERANCE_IN = 0.5;

export interface SizeAdvice {
  size: string | null;
  confidence: "high" | "medium" | "low";
  /** One-line reason shown to the customer. */
  reason: string;
  /** Next size to consider, if between sizes. */
  alternative?: string;
  /** Measurements fall outside the standard range, or between sizes for a tailored piece. */
  suggestMadeToMeasure: boolean;
}

/** Upper bound of a chart cell like "38" or "36–38". */
function upper(cell: string) {
  const nums = cell.split(/[–-]/).map(Number).filter(Number.isFinite);
  return nums.length ? Math.max(...nums) : NaN;
}

export function recommendSize(product: Pick<Product, "category" | "sizes" | "madeToMeasure">, profile: FitProfile): SizeAdvice {
  const chartKey = chartForCategory(product.category, product.sizes);
  const mtm = madeToMeasureAvailable(product);
  if (chartKey === "footwear" || product.sizes.length <= 1) {
    return { size: null, confidence: "low", reason: "This piece isn't sized by body measurements.", suggestMadeToMeasure: false };
  }
  const chart = SIZE_CHARTS[chartKey];
  const cols = chart.columns as readonly string[];
  const useWaist = product.category === "trousers";
  const col = cols.indexOf(useWaist ? "Waist" : "Chest");
  const ease = EASE_IN[profile.preferences.fit];
  const body = cmToIn(useWaist ? profile.measurements.waist : profile.measurements.chest);
  const target = body + (useWaist ? ease.waist : ease.chest);

  const rows = chart.rows
    .map((r) => ({ size: r[0] as string, max: upper(r[col] as string) }))
    .filter((r) => product.sizes.includes(r.size) && Number.isFinite(r.max))
    .sort((a, b) => a.max - b.max);
  if (!rows.length) return { size: null, confidence: "low", reason: "No size chart for this piece.", suggestMadeToMeasure: mtm };

  const fitLabel = FIT_STYLES.find((f) => f.value === profile.preferences.fit)!.label.toLowerCase();
  const pick = rows.find((r) => r.max >= target - TOLERANCE_IN);
  if (!pick) {
    return {
      size: rows[rows.length - 1].size,
      confidence: "low",
      reason: `Your ${useWaist ? "waist" : "chest"} is above our largest standard size for a ${fitLabel} fit.`,
      suggestMadeToMeasure: mtm,
    };
  }
  const idx = rows.indexOf(pick);
  const slack = Math.max(0, pick.max - target); // inches of room beyond the target
  const below = rows[0].max - target > 3; // smaller than the smallest size
  // Tailored chest sizes step by 2": within 1" is a clean fit; alpha sizes are ranges.
  const confidence: SizeAdvice["confidence"] = below ? "low" : slack <= 1.25 ? "high" : slack <= 2.5 ? "medium" : "low";
  const alternative = slack > 1.25 && idx > 0 ? rows[idx - 1].size : pick.max < target && rows[idx + 1] ? rows[idx + 1].size : undefined;

  // For tailored pieces also check the waist doesn't need the next size up.
  let size = pick.size;
  if (!useWaist && chartKey === "tailored") {
    const wCol = cols.indexOf("Waist");
    const waistTarget = cmToIn(profile.measurements.waist) + ease.waist;
    const waistFit = rows.find((r) => upper(chart.rows.find((x) => x[0] === r.size)![wCol] as string) >= waistTarget - TOLERANCE_IN);
    if (waistFit && rows.indexOf(waistFit) > idx) size = waistFit.size;
  }

  const reason = below
    ? "You're slimmer than our smallest standard size — made-to-measure will fit best."
    : size !== pick.size
      ? `Sized up for your waist; your chest suits ${pick.size}.`
      : `Best match for a ${fitLabel} fit at ${Math.round(body)}″ ${useWaist ? "waist" : "chest"}.`;

  return {
    size,
    confidence,
    reason,
    alternative: alternative !== size ? alternative : undefined,
    suggestMadeToMeasure: mtm && (confidence === "low" || (chartKey === "tailored" && confidence === "medium")),
  };
}

/** Compact snapshot stored on a made-to-measure cart line and order item. */
export interface FitSnapshot {
  method: FitMethod;
  heightCm: number;
  weightKg: number | null;
  measurements: Measurements;
  preferences: FitPreferences;
}

export function toSnapshot(p: FitProfile): FitSnapshot {
  return { method: p.method, heightCm: p.heightCm, weightKg: p.weightKg, measurements: p.measurements, preferences: p.preferences };
}

/** Short stable id for a snapshot (keeps two different custom profiles as separate cart lines). */
export function snapshotKey(s: FitSnapshot) {
  const str = JSON.stringify([s.measurements, s.preferences.fit, s.preferences.length, s.preferences.sleeve, s.preferences.notes]);
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

/** Server-side guard for snapshots arriving from the browser. */
export function sanitiseSnapshot(raw: unknown): FitSnapshot | null {
  if (!raw || typeof raw !== "object") return null;
  const s = raw as Partial<FitSnapshot>;
  const m = s.measurements as Partial<Measurements> | undefined;
  if (!m || !validateMeasurements(m).ok) return null;
  const pref = (s.preferences ?? {}) as Partial<FitPreferences>;
  const fit = FIT_STYLES.some((f) => f.value === pref.fit) ? (pref.fit as FitStyle) : "regular";
  const len = (v: unknown): LengthPref => (v === "shorter" || v === "longer" ? v : "standard");
  const height = Number(s.heightCm);
  return {
    method: s.method === "camera" || s.method === "quick" ? s.method : "manual",
    heightCm: Number.isFinite(height) && height > 120 && height < 230 ? round1(height) : 0,
    weightKg: Number.isFinite(Number(s.weightKg)) && Number(s.weightKg) > 30 && Number(s.weightKg) < 250 ? round1(Number(s.weightKg)) : null,
    measurements: Object.fromEntries(MEASUREMENT_FIELDS.map((f) => [f.key, round1(Number(m[f.key]))])) as unknown as Measurements,
    preferences: { fit, length: len(pref.length), sleeve: len(pref.sleeve), notes: String(pref.notes ?? "").slice(0, 300) },
  };
}
