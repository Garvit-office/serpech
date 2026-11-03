"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Build } from "@/lib/fit";
import type { Detector, FitCheckReading, FrontSample, SideSample } from "@/lib/fitcheck/measure";

type Phase = "starting" | "front" | "side" | "done" | "error";

const FRONT_SAMPLES = 24;
const SIDE_SAMPLES = 16;
const STEADY_FRAMES = 18; // ~1 s of a good pose before capture starts

/** Skeleton segments drawn over the video (MediaPipe landmark indices). */
const BONES: [number, number][] = [
  [11, 12], [11, 13], [13, 15], [12, 14], [14, 16], [11, 23], [12, 24], [23, 24], [23, 25], [25, 27], [24, 26], [26, 28],
];

export function FitCheckCamera({
  heightCm,
  weightKg,
  build,
  onDone,
  onManual,
}: {
  heightCm: number;
  weightKg: number | null;
  build: Build | null;
  onDone: (r: FitCheckReading) => void;
  onManual: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<Phase>("starting");
  const [hint, setHint] = useState("Preparing your Fit Check…");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [facing, setFacing] = useState<"user" | "environment">("user");
  const [voice, setVoice] = useState(true);

  // Mutable capture state lives in refs so the frame loop never re-renders React needlessly.
  const phaseRef = useRef<Phase>("starting");
  const front = useRef<FrontSample[]>([]);
  const side = useRef<SideSample[]>([]);
  const steady = useRef(0);
  const lastHint = useRef("");
  const voiceRef = useRef(voice);
  const finishRef = useRef<() => void>(() => {});
  useEffect(() => {
    voiceRef.current = voice;
    if (!voice && typeof speechSynthesis !== "undefined") speechSynthesis.cancel();
  }, [voice]);

  const say = useCallback((text: string) => {
    if (text === lastHint.current) return;
    lastHint.current = text;
    setHint(text);
    if (voiceRef.current && typeof speechSynthesis !== "undefined") {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 1.02;
      speechSynthesis.speak(u);
    }
  }, []);

  const go = useCallback((p: Phase) => {
    phaseRef.current = p;
    steady.current = 0;
    setPhase(p);
    setProgress(0);
  }, []);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let detector: Detector | null = null;
    let raf = 0;
    let cancelled = false;

    const draw = (pts: { x: number; y: number; v: number }[], good: boolean) => {
      const c = canvasRef.current;
      const v = videoRef.current;
      if (!c || !v) return;
      if (c.width !== v.videoWidth) {
        c.width = v.videoWidth;
        c.height = v.videoHeight;
      }
      const ctx = c.getContext("2d")!;
      ctx.clearRect(0, 0, c.width, c.height);
      if (!pts.length) return;
      ctx.lineWidth = Math.max(3, c.width / 220);
      ctx.lineCap = "round";
      ctx.strokeStyle = good ? "#F3DFA2" : "rgba(245,238,224,0.7)";
      for (const [a, b] of BONES) {
        if (pts[a]?.v > 0.4 && pts[b]?.v > 0.4) {
          ctx.beginPath();
          ctx.moveTo(pts[a].x, pts[a].y);
          ctx.lineTo(pts[b].x, pts[b].y);
          ctx.stroke();
        }
      }
      ctx.fillStyle = "#C9A04A";
      for (const i of [11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28]) {
        if (pts[i]?.v > 0.4) {
          ctx.beginPath();
          ctx.arc(pts[i].x, pts[i].y, ctx.lineWidth * 1.4, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    };

    (async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) throw new Error("unsupported");
        const [s, measure] = await Promise.all([
          navigator.mediaDevices.getUserMedia({
            video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 960 } },
            audio: false,
          }),
          import("@/lib/fitcheck/measure"),
        ]);
        stream = s;
        if (cancelled) return;
        const video = videoRef.current!;
        video.srcObject = s;
        await video.play();
        detector = await measure.createDetector();
        if (cancelled) return;
        go("front");
        say("Stand about two to three metres away, whole body in view, arms out like a star.");

        const loop = () => {
          raf = requestAnimationFrame(loop);
          let result;
          try {
            result = detector!.detect(video, performance.now());
          } catch {
            cancelAnimationFrame(raf);
            setError("The Fit Check couldn't run on this device's browser. Please enter your measurements instead.");
            go("error");
            return;
          }
          if (!result) return;
          const p = phaseRef.current;
          if (p === "front") {
            const r = measure.analyseFront(result);
            draw(r.landmarks, r.ok);
            if (!r.ok) {
              steady.current = 0;
              say(r.hint);
              return;
            }
            if (steady.current < STEADY_FRAMES) {
              steady.current++;
              say("Perfect — hold still.");
              return;
            }
            front.current.push(r.sample);
            setProgress(front.current.length / FRONT_SAMPLES);
            if (front.current.length >= FRONT_SAMPLES) {
              go("side");
              say("Now turn to your side, arms relaxed.");
            }
          } else if (p === "side") {
            const frac = front.current[Math.floor(front.current.length / 2)].frac;
            const r = measure.analyseSide(result, frac);
            draw(r.landmarks, r.ok);
            if (!r.ok) {
              steady.current = 0;
              say(r.hint);
              return;
            }
            if (steady.current < STEADY_FRAMES) {
              steady.current++;
              say("Great — hold still.");
              return;
            }
            side.current.push(r.sample);
            setProgress(side.current.length / SIDE_SAMPLES);
            if (side.current.length >= SIDE_SAMPLES) finish(measure.combine);
          }
        };
        raf = requestAnimationFrame(loop);
      } catch (e) {
        if (cancelled) return;
        const name = (e as Error)?.name;
        setError(
          name === "NotAllowedError"
            ? "Camera permission was declined. You can allow it in your browser settings, or enter your measurements instead."
            : name === "NotFoundError" || (e as Error)?.message === "unsupported"
              ? "We couldn't find a camera on this device."
              : "The Fit Check couldn't start on this device.",
        );
        go("error");
      }
    })();

    const finish = (combine: typeof import("@/lib/fitcheck/measure").combine) => {
      phaseRef.current = "done";
      setPhase("done");
      say("All done. Let's review your measurements.");
      onDone(combine(front.current, side.current, heightCm, { weightKg, build }));
    };
    finishRef.current = () => import("@/lib/fitcheck/measure").then((m) => finish(m.combine));

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      stream?.getTracks().forEach((t) => t.stop());
      detector?.close();
      if (typeof speechSynthesis !== "undefined") speechSynthesis.cancel();
    };
    // restart only when switching cameras
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facing]);

  if (phase === "error") {
    return (
      <div className="border border-mist bg-pearl p-6 text-center">
        <p className="text-xl">{error}</p>
        <button type="button" onClick={onManual} className="btn-royal mt-6">
          Enter measurements instead
        </button>
      </div>
    );
  }

  const step = phase === "side" ? "Step 2 of 2 · Side view" : "Step 1 of 2 · Front view";
  return (
    <div>
      <div className="relative mx-auto aspect-[3/4] max-h-[62dvh] w-full overflow-hidden bg-brand-green sm:aspect-[4/3]">
        <video
          ref={videoRef}
          playsInline
          muted
          className={`absolute inset-0 h-full w-full object-cover ${facing === "user" ? "-scale-x-100" : ""}`}
        />
        <canvas
          ref={canvasRef}
          aria-hidden
          className={`pointer-events-none absolute inset-0 h-full w-full object-cover ${facing === "user" ? "-scale-x-100" : ""}`}
        />
        {/* framing guide */}
        <div aria-hidden className="pointer-events-none absolute inset-y-[4%] left-1/2 w-[42%] -translate-x-1/2 rounded-[45%_45%_10%_10%] border-2 border-dashed border-gold-light/50" />
        {phase === "starting" && (
          <div className="absolute inset-0 grid place-items-center bg-brand-green/85 text-ivory">
            <p className="eyebrow">Loading Fit Check…</p>
          </div>
        )}
        <div className="absolute inset-x-0 top-0 bg-gradient-to-b from-brand-green/85 to-transparent px-4 pb-8 pt-3 text-ivory">
          <p className="eyebrow text-[0.6rem] text-gold-light">{step}</p>
          <p role="status" aria-live="polite" className="mt-1 text-lg leading-snug">
            {hint}
          </p>
        </div>
        {(phase === "front" || phase === "side") && (
          <div className="absolute inset-x-4 bottom-4">
            <div className="h-1.5 overflow-hidden bg-ivory/25" role="progressbar" aria-label="Capture progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress * 100)}>
              <div className="h-full bg-gold transition-[width] duration-200" style={{ width: `${progress * 100}%` }} />
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn-outline min-h-10 px-4 py-1.5" onClick={() => setFacing((f) => (f === "user" ? "environment" : "user"))}>
            Switch camera
          </button>
          <label className="inline-flex min-h-10 items-center gap-2 px-2 text-base">
            <input type="checkbox" checked={voice} onChange={(e) => setVoice(e.target.checked)} className="size-4 accent-brand-green" />
            Voice guidance
          </label>
        </div>
        <div className="flex flex-wrap gap-2">
          {phase === "side" && (
            <button type="button" className="btn-outline min-h-10 px-4 py-1.5" onClick={() => finishRef.current()}>
              Skip side view
            </button>
          )}
          <button type="button" className="link-thread px-2 text-base" onClick={onManual}>
            Enter measurements instead
          </button>
        </div>
      </div>
      <p className="mt-3 text-sm text-ink-soft">
        Your camera feed is processed on this device and never uploaded or stored.
      </p>
    </div>
  );
}
