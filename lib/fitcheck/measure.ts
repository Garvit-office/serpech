/**
 * Fit Check — on-device body measurement from the camera.
 *
 * MediaPipe Pose (self-hosted under /public/fitcheck) gives 33 body landmarks
 * and a person segmentation mask per frame. Nothing is uploaded.
 *
 *   scale      = customer's height (cm) / silhouette height (px)
 *   chest/hip  = widest silhouette rows in the chest / seat bands (front)
 *   waist      = narrowest silhouette row between chest and hips (front)
 *   depths     = same rows in an optional side view (else typical ratios)
 *   girth      = ellipse perimeter of width × depth
 *   sleeve, shoulder, inseam = joint-to-joint distances with tailoring offsets
 *
 * Results are medians over many frames and are always shown for review.
 */
import type { PoseLandmarker, PoseLandmarkerResult } from "@mediapipe/tasks-vision";
import { estimateFromBody, round1, type Build, type Measurements } from "@/lib/fit";

const WASM_PATH = "/fitcheck/wasm";
const MODEL_PATH = "/fitcheck/pose_landmarker_full.task";

const L = {
  nose: 0,
  lShoulder: 11,
  rShoulder: 12,
  lElbow: 13,
  rElbow: 14,
  lWrist: 15,
  rWrist: 16,
  lHip: 23,
  rHip: 24,
  lKnee: 25,
  rKnee: 26,
  lAnkle: 27,
  rAnkle: 28,
} as const;

export type View = "front" | "side";

export interface Detector {
  detect(video: HTMLVideoElement, ts: number): PoseLandmarkerResult | null;
  close(): void;
}

/** Load the pose model (≈9 MB, cached by the browser after the first time). */
export async function createDetector(): Promise<Detector> {
  const { FilesetResolver, PoseLandmarker } = await import("@mediapipe/tasks-vision");
  const fileset = await FilesetResolver.forVisionTasks(WASM_PATH);
  const make = (delegate: "GPU" | "CPU") =>
    PoseLandmarker.createFromOptions(fileset, {
      baseOptions: { modelAssetPath: MODEL_PATH, delegate },
      runningMode: "VIDEO",
      numPoses: 1,
      outputSegmentationMasks: true,
      minPoseDetectionConfidence: 0.6,
      minPosePresenceConfidence: 0.6,
      minTrackingConfidence: 0.6,
    });
  // The GPU graph can "load" yet fail on first use (no WebGL2, blocked GPU,
  // some phones). Prove it with one warm-up frame and fall back to CPU.
  const warm = (lm: PoseLandmarker) => {
    const c = document.createElement("canvas");
    c.width = c.height = 64;
    c.getContext("2d")!.fillRect(0, 0, 64, 64);
    lm.detectForVideo(c, 1).segmentationMasks?.forEach((m) => m.close());
  };
  const start = async (delegate: "GPU" | "CPU") => {
    const lm = await make(delegate);
    try {
      warm(lm);
      return lm;
    } catch (e) {
      lm.close();
      throw e;
    }
  };
  let lm: PoseLandmarker;
  let onCpu = false;
  try {
    lm = await start("GPU");
  } catch {
    lm = await start("CPU");
    onCpu = true;
  }
  let last = 1;
  let failures = 0;
  let switching = false;
  return {
    detect(video, ts) {
      if (switching || video.readyState < 2 || ts <= last) return null;
      last = ts;
      try {
        const r = lm.detectForVideo(video, ts);
        failures = 0;
        return r;
      } catch (e) {
        // A GPU context can be lost mid-session; move to CPU once, then give up.
        if (++failures < 3) return null;
        if (onCpu) throw e;
        switching = true;
        lm.close();
        start("CPU").then((cpu) => {
          lm = cpu;
          onCpu = true;
          failures = 0;
          last = 1;
          switching = false;
        });
        return null;
      }
    },
    close: () => lm.close(),
  };
}

/* ───────────── Per-frame analysis ───────────── */

export interface FrontSample {
  pxHeight: number;
  chestW: number;
  waistW: number;
  hipW: number;
  shoulderPx: number;
  sleevePx: number;
  legPx: number;
  /** Row positions as a fraction of body height from the top, for the side view. */
  frac: { chest: number; waist: number; hip: number };
}

export interface SideSample {
  pxHeight: number;
  chestD: number;
  waistD: number;
  hipD: number;
}

export type FrameResult<T> = { ok: true; sample: T; landmarks: Pt[] } | { ok: false; hint: string; landmarks: Pt[] };

interface Pt {
  x: number; // px
  y: number; // px
  v: number; // visibility 0–1
}

interface Mask {
  w: number;
  h: number;
  data: Float32Array;
}

const dist = (a: Pt, b: Pt) => Math.hypot(a.x - b.x, a.y - b.y);
const on = (m: Mask, x: number, y: number) => m.data[y * m.w + x] > 0.5;

/** Silhouette run (px) through column `cx` on row `y`; 0 if the pixel isn't on the body. */
function runAt(m: Mask, y: number, cx: number) {
  y = Math.round(y);
  cx = Math.round(cx);
  if (y < 0 || y >= m.h || cx < 0 || cx >= m.w || !on(m, cx, y)) return 0;
  let l = cx;
  let r = cx;
  while (l > 0 && on(m, l - 1, y)) l--;
  while (r < m.w - 1 && on(m, r + 1, y)) r++;
  return r - l + 1;
}

/** Longest silhouette run on a row (used in the side view where the centre is unknown). */
function longestRun(m: Mask, y: number) {
  y = Math.round(y);
  if (y < 0 || y >= m.h) return 0;
  let best = 0;
  let cur = 0;
  for (let x = 0; x < m.w; x++) {
    cur = on(m, x, y) ? cur + 1 : 0;
    if (cur > best) best = cur;
  }
  return best;
}

/** Top and bottom rows of the silhouette. */
function verticalExtent(m: Mask) {
  let top = -1;
  let bottom = -1;
  const step = Math.max(1, Math.floor(m.w / 160));
  for (let y = 0; y < m.h && top < 0; y++) for (let x = 0; x < m.w; x += step) if (on(m, x, y)) { top = y; break; }
  for (let y = m.h - 1; y >= 0 && bottom < 0; y--) for (let x = 0; x < m.w; x += step) if (on(m, x, y)) { bottom = y; break; }
  return { top, bottom };
}

function readFrame(result: PoseLandmarkerResult): { pts: Pt[]; mask: Mask } | null {
  const lms = result.landmarks?.[0];
  const mp = result.segmentationMasks?.[0];
  if (!lms || !mp) {
    mp?.close();
    return null;
  }
  const mask: Mask = { w: mp.width, h: mp.height, data: mp.getAsFloat32Array().slice() };
  mp.close();
  const pts = lms.map((p) => ({ x: p.x * mask.w, y: p.y * mask.h, v: p.visibility ?? 1 }));
  return { pts, mask };
}

const REQUIRED = [L.nose, L.lShoulder, L.rShoulder, L.lHip, L.rHip, L.lAnkle, L.rAnkle];

function framing(pts: Pt[], mask: Mask): { ok: true; top: number; pxHeight: number } | { ok: false; hint: string } {
  if (REQUIRED.some((i) => (pts[i]?.v ?? 0) < 0.5)) return { ok: false, hint: "Step back until your whole body — head to feet — is in view." };
  const { top, bottom } = verticalExtent(mask);
  if (top < 0) return { ok: false, hint: "We can't see you yet — stand in front of the camera." };
  if (top < mask.h * 0.015 || bottom > mask.h * 0.985) return { ok: false, hint: "Leave a little space above your head and below your feet." };
  const pxHeight = bottom - top;
  if (pxHeight < mask.h * 0.5) return { ok: false, hint: "Come a little closer to the camera." };
  return { ok: true, top, pxHeight };
}

export function analyseFront(result: PoseLandmarkerResult): FrameResult<FrontSample> {
  const f = readFrame(result);
  if (!f) return { ok: false, hint: "We can't see you yet — stand in front of the camera.", landmarks: [] };
  const { pts, mask } = f;
  const fr = framing(pts, mask);
  if (!fr.ok) return { ok: false, hint: fr.hint, landmarks: pts };
  const { top, pxHeight } = fr;
  const ls = pts[L.lShoulder];
  const rs = pts[L.rShoulder];
  const lh = pts[L.lHip];
  const rh = pts[L.rHip];
  const shoulderPx = dist(ls, rs);
  if (shoulderPx < pxHeight * 0.15) return { ok: false, hint: "Face the camera straight on.", landmarks: pts };
  if (Math.abs(ls.y - rs.y) > pxHeight * 0.03) return { ok: false, hint: "Stand tall with your shoulders level.", landmarks: pts };
  const lw = pts[L.lWrist];
  const rw = pts[L.rWrist];
  if (lw.v < 0.5 || rw.v < 0.5 || Math.abs(lw.x - ls.x) < pxHeight * 0.1 || Math.abs(rw.x - rs.x) < pxHeight * 0.1) {
    return { ok: false, hint: "Lift your arms out to the sides, about 45°, like a star.", landmarks: pts };
  }

  const shY = (ls.y + rs.y) / 2;
  const hipY = (lh.y + rh.y) / 2;
  const torso = hipY - shY;
  const cx = (ls.x + rs.x + lh.x + rh.x) / 4;
  const maxBody = shoulderPx * 1.15; // wider than this means an arm touches the torso

  const band = (from: number, to: number, pick: "max" | "min") => {
    let best = pick === "max" ? 0 : Infinity;
    let bestY = from;
    const steps = 14;
    for (let i = 0; i <= steps; i++) {
      const y = from + ((to - from) * i) / steps;
      const w = runAt(mask, y, cx);
      if (!w || w > maxBody) continue;
      if (pick === "max" ? w > best : w < best) {
        best = w;
        bestY = y;
      }
    }
    return { w: best === Infinity ? 0 : best, y: bestY };
  };

  const chest = band(shY + torso * 0.15, shY + torso * 0.38, "max");
  const waist = band(shY + torso * 0.5, shY + torso * 0.85, "min");
  const hip = band(hipY - torso * 0.05, hipY + torso * 0.3, "max");
  if (!chest.w || !waist.w || !hip.w) return { ok: false, hint: "Keep your arms clear of your body.", landmarks: pts };

  const side = (s: Pt, e: Pt, w: Pt) => dist(s, e) + dist(e, w);
  const sleevePx = (side(ls, pts[L.lElbow], lw) + side(rs, pts[L.rElbow], rw)) / 2;
  const legPx = (dist(lh, pts[L.lKnee]) + dist(pts[L.lKnee], pts[L.lAnkle]) + dist(rh, pts[L.rKnee]) + dist(pts[L.rKnee], pts[L.rAnkle])) / 2;

  return {
    ok: true,
    landmarks: pts,
    sample: {
      pxHeight,
      chestW: chest.w,
      waistW: waist.w,
      hipW: hip.w,
      shoulderPx,
      sleevePx,
      legPx,
      frac: { chest: (chest.y - top) / pxHeight, waist: (waist.y - top) / pxHeight, hip: (hip.y - top) / pxHeight },
    },
  };
}

export function analyseSide(result: PoseLandmarkerResult, frac: FrontSample["frac"]): FrameResult<SideSample> {
  const f = readFrame(result);
  if (!f) return { ok: false, hint: "We can't see you yet — stand in front of the camera.", landmarks: [] };
  const { pts, mask } = f;
  // In profile the far ankle/shoulder is often hidden; relax the visibility rule.
  const { top, bottom } = verticalExtent(mask);
  if (top < 0) return { ok: false, hint: "We can't see you yet.", landmarks: pts };
  if (top < mask.h * 0.015 || bottom > mask.h * 0.985) return { ok: false, hint: "Leave a little space above your head and below your feet.", landmarks: pts };
  const pxHeight = bottom - top;
  if (pxHeight < mask.h * 0.5) return { ok: false, hint: "Come a little closer to the camera.", landmarks: pts };
  const shoulderSpread = Math.abs(pts[L.lShoulder].x - pts[L.rShoulder].x);
  if (shoulderSpread > pxHeight * 0.08) return { ok: false, hint: "Turn 90° so your side faces the camera, arms relaxed.", landmarks: pts };

  const at = (fy: number, pick: "max" | "min") => {
    let best = pick === "max" ? 0 : Infinity;
    for (let d = -0.015; d <= 0.0151; d += 0.005) {
      const w = longestRun(mask, top + (fy + d) * pxHeight);
      if (w && (pick === "max" ? w > best : w < best)) best = w;
    }
    return best === Infinity ? 0 : best;
  };
  const chestD = at(frac.chest, "max");
  const waistD = at(frac.waist, "min");
  const hipD = at(frac.hip, "max");
  if (!chestD || !waistD || !hipD) return { ok: false, hint: "Hold still in profile.", landmarks: pts };
  return { ok: true, landmarks: pts, sample: { pxHeight, chestD, waistD, hipD } };
}

/* ───────────── Combining samples ───────────── */

const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

/** Ramanujan's ellipse perimeter from full width and depth. */
function girth(width: number, depth: number) {
  const a = width / 2;
  const b = depth / 2;
  return Math.PI * (3 * (a + b) - Math.sqrt((3 * a + b) * (a + 3 * b)));
}

/** Typical depth ÷ width ratios for adult men, used when there's no side view. */
const DEPTH_RATIO = { chest: 0.74, waist: 0.78, hip: 0.76 };

export interface FitCheckReading {
  measurements: Measurements;
  /** Values that look unusual against height/weight and deserve a second look. */
  review: (keyof Measurements)[];
  usedSideView: boolean;
}

export function combine(
  front: FrontSample[],
  side: SideSample[],
  heightCm: number,
  opts: { weightKg?: number | null; build?: Build | null } = {},
): FitCheckReading {
  const scaleF = heightCm / median(front.map((s) => s.pxHeight));
  const w = (k: "chestW" | "waistW" | "hipW") => median(front.map((s) => s[k])) * scaleF;
  const chestW = w("chestW");
  const waistW = w("waistW");
  const hipW = w("hipW");

  let chestD = chestW * DEPTH_RATIO.chest;
  let waistD = waistW * DEPTH_RATIO.waist;
  let hipD = hipW * DEPTH_RATIO.hip;
  const usedSideView = side.length >= 5;
  if (usedSideView) {
    const scaleS = heightCm / median(side.map((s) => s.pxHeight));
    chestD = median(side.map((s) => s.chestD)) * scaleS;
    waistD = median(side.map((s) => s.waistD)) * scaleS;
    hipD = median(side.map((s) => s.hipD)) * scaleS;
  }

  const chest = girth(chestW, chestD);
  const measurements: Measurements = {
    chest: round1(chest),
    waist: round1(girth(waistW, waistD)),
    hip: round1(girth(hipW, hipD)),
    // landmark shoulders sit on the joints; a tailor measures across the back over the deltoids
    shoulder: round1(median(front.map((s) => s.shoulderPx)) * scaleF * 1.25),
    sleeve: round1(median(front.map((s) => s.sleevePx)) * scaleF + 3),
    inseam: round1(median(front.map((s) => s.legPx)) * scaleF * 0.93),
    neck: round1(chest * 0.38 + 1),
  };

  // Sanity-check against proportions from height/weight when we have them.
  const review: (keyof Measurements)[] = [];
  if (opts.weightKg) {
    const ref = estimateFromBody(heightCm, opts.weightKg, opts.build ?? "average");
    measurements.neck = ref.neck;
    for (const k of Object.keys(measurements) as (keyof Measurements)[]) {
      if (Math.abs(measurements[k] - ref[k]) / ref[k] > 0.12) review.push(k);
    }
  }
  return { measurements, review, usedSideView };
}
