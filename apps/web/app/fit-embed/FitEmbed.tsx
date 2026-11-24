"use client";

import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import type { Build } from "@sarpech/core/fit";
import type { FitCheckReading } from "@/lib/fitcheck/measure";

declare global {
  interface Window {
    ReactNativeWebView?: { postMessage: (msg: string) => void };
  }
}

const FitCheckCamera = dynamic(() => import("@/components/fit/FitCheckCamera").then((m) => m.FitCheckCamera), {
  ssr: false,
  loading: () => <p className="eyebrow py-24 text-center text-gold-light">Preparing your Fit Check…</p>,
});

const BUILDS: Build[] = ["lean", "average", "athletic", "broad"];

type Message = { type: "fitcheck:ready" } | { type: "fitcheck:done"; reading: FitCheckReading } | { type: "fitcheck:manual" };

function post(msg: Message) {
  window.ReactNativeWebView?.postMessage(JSON.stringify(msg));
}

export function FitEmbed() {
  const sp = useSearchParams();
  const height = Number(sp.get("height"));
  const weight = Number(sp.get("weight")) || null;
  const build = BUILDS.includes(sp.get("build") as Build) ? (sp.get("build") as Build) : null;
  const valid = height >= 120 && height <= 230;

  useEffect(() => post({ type: "fitcheck:ready" }), []);

  if (!valid) {
    return <p className="px-6 py-24 text-center text-lg">Enter your height in the app first, then start the Fit Check.</p>;
  }
  return (
    <div className="bg-white text-brand-green">
      <FitCheckCamera
        heightCm={height}
        weightKg={weight}
        build={build}
        onDone={(reading) => post({ type: "fitcheck:done", reading })}
        onManual={() => post({ type: "fitcheck:manual" })}
      />
    </div>
  );
}
