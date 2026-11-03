"use client";

import Link from "next/link";
import { FIT_STYLES, MEASUREMENT_FIELDS, cmToIn, round1 } from "@/lib/fit";
import { formatINR } from "@/lib/format";
import { useCatalog } from "@/lib/store/catalog";
import { useFit } from "@/lib/store/fit";

export function StartFitButton({ className = "btn-royal btn-royal-gold", label }: { className?: string; label?: string }) {
  const fit = useFit();
  return (
    <button type="button" onClick={() => fit.openWizard()} className={className}>
      {label ?? (fit.profile ? "Update my Royal Fit" : "Start your Fit Check")}
    </button>
  );
}

export function MadeToMeasureTerms() {
  const { settings } = useCatalog();
  return (
    <p className="text-xl leading-relaxed">
      Any sherwani, bandhgala, kurta, Nehru jacket, shirt or trouser can be cut to your Royal Fit for{" "}
      <strong>{formatINR(settings.madeToMeasureFee)}</strong> per piece, dispatched in about{" "}
      <strong>{settings.madeToMeasureDays} extra days</strong>. Our master tailor reviews every set of measurements and calls
      you if anything needs confirming before the cloth is cut.
    </p>
  );
}

export function SavedProfile() {
  const { ready, profile, clear, openWizard } = useFit();
  if (!ready) return <div className="h-40" aria-busy="true" />;
  if (!profile) {
    return (
      <div className="border border-dashed border-gold p-8 text-center">
        <p className="text-xl">No Royal Fit saved on this device yet.</p>
        <StartFitButton className="btn-royal mt-5" />
      </div>
    );
  }
  const style = FIT_STYLES.find((f) => f.value === profile.preferences.fit)!;
  return (
    <div className="border border-mist bg-white shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-mist px-5 py-4">
        <p className="text-lg">
          <strong className="font-semibold">{style.label}</strong> fit · saved{" "}
          {new Date(profile.updatedAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })} ·{" "}
          {profile.method === "camera" ? "camera Fit Check" : profile.method === "quick" ? "quick estimate" : "entered by you"}
        </p>
        <div className="flex gap-2">
          <button type="button" onClick={() => openWizard()} className="btn-outline min-h-10 px-4 py-1.5">
            Edit
          </button>
          <button
            type="button"
            onClick={() => {
              if (window.confirm("Delete your saved Royal Fit from this device?")) clear();
            }}
            className="btn-outline min-h-10 px-4 py-1.5"
          >
            Delete
          </button>
        </div>
      </div>
      <dl className="grid grid-cols-2 gap-x-6 gap-y-3 p-5 sm:grid-cols-4">
        {MEASUREMENT_FIELDS.map((f) => (
          <div key={f.key}>
            <dt className="eyebrow text-[0.6rem] text-ink-soft">{f.label}</dt>
            <dd className="text-lg">
              {round1(profile.measurements[f.key])} cm <span className="text-ink-soft">· {round1(cmToIn(profile.measurements[f.key]))}″</span>
            </dd>
          </div>
        ))}
      </dl>
      <div className="border-t border-mist px-5 py-4">
        <Link href="/shop" className="link-thread font-display text-xs uppercase tracking-[0.22em]">
          Shop with my Royal Fit →
        </Link>
      </div>
    </div>
  );
}
