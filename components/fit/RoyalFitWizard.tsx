"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useId, useState, type ReactNode } from "react";
import { SarpechEmblem } from "@/components/brand/SarpechEmblem";
import { Dialog } from "@/components/ui/Dialog";
import { CheckIcon, RulerIcon } from "@/components/ui/icons";
import {
  BUILDS,
  DEFAULT_PREFERENCES,
  FIT_STYLES,
  LENGTH_PREFS,
  MEASUREMENT_FIELDS,
  cmToIn,
  estimateFromBody,
  inToCm,
  madeToMeasureAvailable,
  recommendSize,
  round1,
  validateMeasurements,
  type Build,
  type FitMethod,
  type FitPreferences,
  type FitProfile,
  type Measurements,
} from "@/lib/fit";
import { formatINR } from "@/lib/format";
import { useCatalog } from "@/lib/store/catalog";
import { useFit } from "@/lib/store/fit";
import { track } from "@/lib/track";

// The camera module pulls in MediaPipe — load it only when the Fit Check starts.
const FitCheckCamera = dynamic(() => import("./FitCheckCamera").then((m) => m.FitCheckCamera), {
  ssr: false,
  loading: () => <p className="eyebrow py-16 text-center text-ink-soft">Loading Fit Check…</p>,
});

type Step = "saved" | "method" | "basics" | "camera" | "review" | "prefs" | "result";
type Unit = "cm" | "in";

export function RoyalFitWizard() {
  const { wizard, closeWizard, profile, save } = useFit();
  const open = !!wizard;
  return (
    <Dialog open={open} onClose={closeWizard} label="Royal Fit" variant="center" className="w-[min(52rem,calc(100vw-1rem))]">
      {open && <WizardBody key={wizard.product?.slug ?? "general"} existing={profile} onSave={save} onClose={closeWizard} />}
    </Dialog>
  );
}

function WizardBody({ existing, onSave, onClose }: { existing: FitProfile | null; onSave: (p: FitProfile) => void; onClose: () => void }) {
  const { wizard } = useFit();
  const product = wizard?.product;
  const [step, setStep] = useState<Step>(existing ? "saved" : "method");
  const [method, setMethod] = useState<FitMethod>(existing?.method ?? "camera");
  const [heightCm, setHeightCm] = useState<number | null>(existing?.heightCm ?? null);
  const [weightKg, setWeightKg] = useState<number | null>(existing?.weightKg ?? null);
  const [build, setBuild] = useState<Build | null>(existing?.build ?? null);
  const [measurements, setMeasurements] = useState<Partial<Measurements>>(existing?.measurements ?? {});
  const [review, setReview] = useState<(keyof Measurements)[]>([]);
  const [usedSide, setUsedSide] = useState<boolean | null>(null);
  const [prefs, setPrefs] = useState<FitPreferences>(existing?.preferences ?? DEFAULT_PREFERENCES);

  const finish = () => {
    const p: FitProfile = {
      version: 1,
      method,
      updatedAt: new Date().toISOString(),
      heightCm: heightCm ?? 0,
      weightKg,
      build,
      measurements: measurements as Measurements,
      preferences: prefs,
    };
    onSave(p);
    track("fit_profile_saved", { method, fit: prefs.fit, product: product?.slug ?? null });
    setStep("result");
  };

  const steps: Step[] = method === "camera" ? ["method", "basics", "camera", "review", "prefs", "result"] : ["method", "basics", "review", "prefs", "result"];
  const idx = steps.indexOf(step);

  return (
    <div className="flex max-h-[90dvh] flex-col">
      <header className="on-dark relative shrink-0 bg-brand-green px-6 pb-5 pt-6 pr-14 text-ivory">
        <div className="flex items-center gap-3">
          <SarpechEmblem tone="gold" className="h-10 w-10 shrink-0" />
          <div>
            <h2 className="font-display text-base tracking-[0.24em] text-ivory sm:text-lg">Royal Fit</h2>
            <p className="text-base text-ivory/80">{product ? `Sizing the ${product.name}` : "Your measurements, your preferred fit"}</p>
          </div>
        </div>
        {idx >= 0 && (
          <ol className="mt-4 flex gap-1.5" aria-label={`Step ${idx + 1} of ${steps.length}`}>
            {steps.map((s, i) => (
              <li key={s} className={`h-1 flex-1 ${i <= idx ? "bg-gold" : "bg-ivory/20"}`} />
            ))}
          </ol>
        )}
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6 sm:px-8">
        {step === "saved" && existing && (
          <SavedStep
            profile={existing}
            onUse={() => {
              setStep("result");
            }}
            onUpdate={() => setStep("review")}
            onStartOver={() => {
              setMeasurements({});
              setStep("method");
            }}
          />
        )}
        {step === "method" && (
          <MethodStep
            value={method}
            onPick={(m) => {
              setMethod(m);
              setStep("basics");
            }}
          />
        )}
        {step === "basics" && (
          <BasicsStep
            method={method}
            heightCm={heightCm}
            weightKg={weightKg}
            build={build}
            onBack={() => setStep("method")}
            onNext={(h, w, b) => {
              setHeightCm(h);
              setWeightKg(w);
              setBuild(b);
              if (method === "quick") {
                setMeasurements(estimateFromBody(h, w!, b ?? "average"));
                setReview([]);
                setStep("review");
              } else if (method === "camera") setStep("camera");
              else setStep("review");
            }}
          />
        )}
        {step === "camera" && heightCm && (
          <FitCheckCamera
            heightCm={heightCm}
            weightKg={weightKg}
            build={build}
            onManual={() => {
              setMethod("manual");
              setStep("review");
            }}
            onDone={(r) => {
              setMeasurements(r.measurements);
              setReview(r.review);
              setUsedSide(r.usedSideView);
              setStep("review");
            }}
          />
        )}
        {step === "review" && (
          <ReviewStep
            method={method}
            values={measurements}
            review={review}
            usedSide={usedSide}
            heightCm={heightCm}
            weightKg={weightKg}
            build={build}
            onBack={() => setStep(method === "camera" ? "camera" : "basics")}
            onNext={(m) => {
              setMeasurements(m);
              setStep("prefs");
            }}
          />
        )}
        {step === "prefs" && <PrefsStep value={prefs} onChange={setPrefs} onBack={() => setStep("review")} onNext={finish} />}
        {step === "result" && <ResultStep onClose={onClose} onEdit={() => setStep("review")} />}
      </div>
    </div>
  );
}

/* ───────────── Steps ───────────── */

function StepTitle({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="mb-6">
      <h3 className="text-lg sm:text-xl">{title}</h3>
      {children && <p className="mt-1 text-lg text-ink-soft">{children}</p>}
    </div>
  );
}

function Actions({ onBack, next, nextDisabled, onNext }: { onBack?: () => void; next: string; nextDisabled?: boolean; onNext?: () => void }) {
  return (
    <div className="mt-8 flex flex-col-reverse gap-3 border-t border-mist pt-5 sm:flex-row sm:justify-between">
      {onBack ? (
        <button type="button" onClick={onBack} className="btn-outline">
          Back
        </button>
      ) : (
        <span />
      )}
      <button type={onNext ? "button" : "submit"} onClick={onNext} disabled={nextDisabled} className="btn-royal">
        {next}
      </button>
    </div>
  );
}

function SavedStep({ profile, onUse, onUpdate, onStartOver }: { profile: FitProfile; onUse: () => void; onUpdate: () => void; onStartOver: () => void }) {
  const style = FIT_STYLES.find((f) => f.value === profile.preferences.fit)!;
  return (
    <div>
      <StepTitle title="Welcome back">
        Your Royal Fit from {new Date(profile.updatedAt).toLocaleDateString("en-IN", { day: "numeric", month: "long" })} is saved on this device.
      </StepTitle>
      <ProfileSummary profile={profile} />
      <p className="mt-4 text-lg">
        Preferred fit: <strong>{style.label}</strong> — {style.short.toLowerCase()}
      </p>
      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        <button type="button" onClick={onUse} className="btn-royal">
          Use my Royal Fit
        </button>
        <button type="button" onClick={onUpdate} className="btn-outline">
          Adjust
        </button>
        <button type="button" onClick={onStartOver} className="btn-outline">
          Start over
        </button>
      </div>
    </div>
  );
}

const METHODS: { value: FitMethod; title: string; body: string; badge?: string; icon: ReactNode }[] = [
  {
    value: "camera",
    title: "Fit Check",
    body: "Stand in front of your camera for about 20 seconds. We read your measurements on this device — nothing is uploaded.",
    badge: "Recommended",
    icon: (
      <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" aria-hidden>
        <path d="M3 8h3.5L8 5.5h8L17.5 8H21v11H3z" />
        <circle cx="12" cy="13" r="3.6" />
      </svg>
    ),
  },
  {
    value: "manual",
    title: "Enter my measurements",
    body: "Already know your numbers, or have a tape measure handy? Type them in.",
    icon: <RulerIcon width={28} height={28} />,
  },
  {
    value: "quick",
    title: "Quick estimate",
    body: "Height, weight and build — a good starting point you can fine-tune.",
    icon: (
      <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" aria-hidden>
        <circle cx="12" cy="5" r="2.4" />
        <path d="M12 8v7m0 0l-3 6m3-6l3 6M7 11h10" />
      </svg>
    ),
  },
];

function MethodStep({ value, onPick }: { value: FitMethod; onPick: (m: FitMethod) => void }) {
  return (
    <div>
      <StepTitle title="How would you like to be measured?">Pick one — you can review and adjust every number afterwards.</StepTitle>
      <ul className="grid gap-3">
        {METHODS.map((m) => (
          <li key={m.value}>
            <button
              type="button"
              onClick={() => onPick(m.value)}
              aria-current={value === m.value ? "true" : undefined}
              className="group relative flex w-full items-start gap-4 border border-mist bg-white p-5 text-left transition hover:border-gold hover:shadow-card"
            >
              <span aria-hidden className="absolute inset-1.5 border border-dashed border-gold/0 transition group-hover:border-gold/50" />
              <span className="grid size-12 shrink-0 place-items-center rounded-full border border-gold text-brand-green">{m.icon}</span>
              <span className="relative min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="font-display text-sm tracking-[0.18em]">{m.title}</span>
                  {m.badge && <span className="bg-gold-light px-2 py-0.5 font-display text-[0.56rem] uppercase tracking-[0.18em]">{m.badge}</span>}
                </span>
                <span className="mt-1 block text-[1.02rem] text-ink-soft">{m.body}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function BasicsStep({
  method,
  heightCm,
  weightKg,
  build,
  onBack,
  onNext,
}: {
  method: FitMethod;
  heightCm: number | null;
  weightKg: number | null;
  build: Build | null;
  onBack: () => void;
  onNext: (h: number, w: number | null, b: Build | null) => void;
}) {
  const id = useId();
  const [unit, setUnit] = useState<"cm" | "ft">("cm");
  const [cm, setCm] = useState(heightCm ? String(heightCm) : "");
  const [ft, setFt] = useState(heightCm ? String(Math.floor(cmToIn(heightCm) / 12)) : "");
  const [inch, setInch] = useState(heightCm ? String(Math.round(cmToIn(heightCm) % 12)) : "");
  const [kg, setKg] = useState(weightKg ? String(weightKg) : "");
  const [b, setB] = useState<Build | null>(build ?? (method === "quick" ? "average" : null));
  const [error, setError] = useState<string | null>(null);
  const needWeight = method === "quick";

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const h = unit === "cm" ? Number(cm) : inToCm(Number(ft) * 12 + Number(inch || 0));
    if (!Number.isFinite(h) || h < 130 || h > 220) return setError("Please enter your height (130–220 cm / 4′3″–7′2″).");
    const w = kg.trim() ? Number(kg) : null;
    if (needWeight && (!w || w < 35 || w > 200)) return setError("Please enter your weight in kg (35–200).");
    if (w !== null && (!Number.isFinite(w) || w < 35 || w > 200)) return setError("Weight should be between 35 and 200 kg.");
    onNext(round1(h), w, b);
  };

  return (
    <form onSubmit={submit} noValidate>
      <StepTitle title={method === "camera" ? "Before we begin" : "A little about you"}>
        {method === "camera"
          ? "Your height lets us turn the camera image into real measurements."
          : "These help us estimate the measurements you haven't got to hand."}
      </StepTitle>

      <fieldset>
        <legend className="field-label">Height</legend>
        <div className="mb-2 inline-flex border border-brand-green/30" role="group" aria-label="Height unit">
          {(["cm", "ft"] as const).map((u) => (
            <button key={u} type="button" aria-pressed={unit === u} onClick={() => setUnit(u)} className={`min-h-9 px-4 font-display text-[0.65rem] uppercase tracking-[0.18em] ${unit === u ? "bg-brand-green text-ivory" : ""}`}>
              {u === "cm" ? "cm" : "ft / in"}
            </button>
          ))}
        </div>
        {unit === "cm" ? (
          <div className="flex max-w-xs items-center gap-2">
            <label htmlFor={`${id}-cm`} className="sr-only">
              Height in centimetres
            </label>
            <input id={`${id}-cm`} inputMode="decimal" value={cm} onChange={(e) => setCm(e.target.value)} placeholder="178" className="field" autoFocus />
            <span className="text-ink-soft">cm</span>
          </div>
        ) : (
          <div className="flex max-w-xs items-center gap-2">
            <label htmlFor={`${id}-ft`} className="sr-only">
              Feet
            </label>
            <input id={`${id}-ft`} inputMode="numeric" value={ft} onChange={(e) => setFt(e.target.value)} placeholder="5" className="field" />
            <span className="text-ink-soft">ft</span>
            <label htmlFor={`${id}-in`} className="sr-only">
              Inches
            </label>
            <input id={`${id}-in`} inputMode="numeric" value={inch} onChange={(e) => setInch(e.target.value)} placeholder="10" className="field" />
            <span className="text-ink-soft">in</span>
          </div>
        )}
      </fieldset>

      <div className="mt-5 max-w-xs">
        <label htmlFor={`${id}-kg`} className="field-label">
          Weight {needWeight ? "" : "(optional — improves accuracy)"}
        </label>
        <div className="flex items-center gap-2">
          <input id={`${id}-kg`} inputMode="decimal" value={kg} onChange={(e) => setKg(e.target.value)} placeholder="75" className="field" />
          <span className="text-ink-soft">kg</span>
        </div>
      </div>

      {method !== "manual" && (
        <fieldset className="mt-5">
          <legend className="field-label">Build {method === "camera" ? "(optional)" : ""}</legend>
          <div className="flex flex-wrap gap-2">
            {BUILDS.map((o) => (
              <button key={o.value} type="button" aria-pressed={b === o.value} onClick={() => setB(o.value)} className={`min-h-10 border px-4 text-base transition ${b === o.value ? "border-brand-green bg-brand-green text-ivory" : "border-brand-green/30 hover:border-brand-green"}`}>
                {o.label}
              </button>
            ))}
          </div>
        </fieldset>
      )}

      {method === "camera" && (
        <div className="mt-6 border border-gold/50 bg-pearl p-4">
          <p className="font-display text-xs uppercase tracking-[0.2em]">For the best reading</p>
          <ul className="mt-2 grid gap-1.5 text-base sm:grid-cols-2">
            {["Wear fitted clothing (no jackets or loose kurtas)", "Plain wall behind you, good light", "Camera at waist height, 2–3 m away", "Arms out to the sides, about 45°"].map((t) => (
              <li key={t} className="flex gap-2">
                <CheckIcon className="mt-1 shrink-0 text-gold-dark" />
                {t}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-sm text-ink-soft">Prop your phone against something — the Fit Check captures automatically and talks you through it.</p>
        </div>
      )}

      {error && (
        <p role="alert" className="mt-4 text-base text-ruby">
          {error}
        </p>
      )}
      <Actions onBack={onBack} next={method === "camera" ? "Start camera" : "Continue"} />
    </form>
  );
}

function ReviewStep({
  method,
  values,
  review,
  usedSide,
  heightCm,
  weightKg,
  build,
  onBack,
  onNext,
}: {
  method: FitMethod;
  values: Partial<Measurements>;
  review: (keyof Measurements)[];
  usedSide: boolean | null;
  heightCm: number | null;
  weightKg: number | null;
  build: Build | null;
  onBack: () => void;
  onNext: (m: Measurements) => void;
}) {
  const id = useId();
  const [unit, setUnit] = useState<Unit>("cm");
  const [m, setM] = useState<Partial<Measurements>>(values);
  const [invalid, setInvalid] = useState<(keyof Measurements)[]>([]);
  const show = (k: keyof Measurements) => {
    const v = m[k];
    if (v === undefined || v === null || Number.isNaN(v)) return "";
    return String(unit === "cm" ? round1(v) : round1(cmToIn(v)));
  };
  const set = (k: keyof Measurements, raw: string) => {
    const n = Number(raw);
    setM((prev) => ({ ...prev, [k]: raw.trim() === "" || !Number.isFinite(n) ? undefined : unit === "cm" ? n : inToCm(n) }));
  };
  const canEstimate = heightCm && weightKg;
  const empty = MEASUREMENT_FIELDS.every((f) => m[f.key] === undefined);

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        const v = validateMeasurements(m);
        setInvalid(v.invalid);
        if (v.ok) onNext(Object.fromEntries(MEASUREMENT_FIELDS.map((f) => [f.key, round1(m[f.key]!)])) as unknown as Measurements);
        else document.getElementById(`${id}-${v.invalid[0]}`)?.focus();
      }}
    >
      <StepTitle title={method === "manual" ? "Your measurements" : "Review your measurements"}>
        {method === "camera"
          ? `Measured from your Fit Check${usedSide === false ? " (front view only)" : ""}. Adjust anything that looks off.`
          : method === "quick"
            ? "Estimated from your height, weight and build. Fine-tune any you know."
            : "Body measurements, taken over a fitted shirt. We add the ease for your preferred fit."}
      </StepTitle>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex border border-brand-green/30" role="group" aria-label="Units">
          {(["cm", "in"] as const).map((u) => (
            <button key={u} type="button" aria-pressed={unit === u} onClick={() => setUnit(u)} className={`min-h-9 px-4 font-display text-[0.65rem] uppercase tracking-[0.18em] ${unit === u ? "bg-brand-green text-ivory" : ""}`}>
              {u === "cm" ? "Centimetres" : "Inches"}
            </button>
          ))}
        </div>
        {method === "manual" && empty && canEstimate && (
          <button type="button" className="link-thread text-base" onClick={() => setM(estimateFromBody(heightCm!, weightKg!, build ?? "average"))}>
            Start from an estimate
          </button>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {MEASUREMENT_FIELDS.map((f) => {
          const bad = invalid.includes(f.key);
          const flag = review.includes(f.key);
          return (
            <div key={f.key} className={flag ? "bg-gold-light/25 p-2 -m-2" : ""}>
              <label htmlFor={`${id}-${f.key}`} className="field-label">
                {f.label}
                {flag && <span className="ml-2 normal-case tracking-normal text-gold-dark">· please check</span>}
              </label>
              <div className="flex items-center gap-2">
                <input
                  id={`${id}-${f.key}`}
                  inputMode="decimal"
                  value={show(f.key)}
                  onChange={(e) => set(f.key, e.target.value)}
                  aria-invalid={bad}
                  aria-describedby={`${id}-${f.key}-how`}
                  className="field"
                />
                <span className="w-7 text-ink-soft">{unit}</span>
              </div>
              <p id={`${id}-${f.key}-how`} className={`mt-1 text-sm ${bad ? "text-ruby" : "text-ink-soft"}`}>
                {bad ? `Enter a value between ${unit === "cm" ? f.min : Math.round(cmToIn(f.min))} and ${unit === "cm" ? f.max : Math.round(cmToIn(f.max))} ${unit}.` : f.how}
              </p>
            </div>
          );
        })}
      </div>
      {method === "camera" && (
        <p className="mt-5 text-sm text-ink-soft">
          Camera measurements are estimates (typically within 2–4 cm). For made-to-measure pieces our master tailor reviews
          every set of numbers and will call you if anything needs confirming.
        </p>
      )}
      <Actions onBack={onBack} next="Continue to fit" />
    </form>
  );
}

function Segmented<T extends string>({ label, options, value, onChange }: { label: string; options: { value: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <fieldset>
      <legend className="field-label">{label}</legend>
      <div className="flex flex-wrap gap-2" role="radiogroup">
        {options.map((o) => (
          <button key={o.value} type="button" role="radio" aria-checked={value === o.value} onClick={() => onChange(o.value)} className={`min-h-10 border px-4 text-base transition ${value === o.value ? "border-brand-green bg-brand-green text-ivory" : "border-brand-green/30 hover:border-brand-green"}`}>
            {o.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

/** Tiny silhouette showing the amount of ease for each fit. */
function FitGlyph({ ease }: { ease: number }) {
  const w = 26 + ease * 5;
  const x = (60 - w) / 2;
  return (
    <svg viewBox="0 0 60 64" className="h-14 w-14" aria-hidden>
      <path d="M22 8q8-5 16 0l12 8-4 10-6-3v33H20V23l-6 3-4-10z" fill="none" stroke="#0E1A15" strokeOpacity=".25" strokeWidth="1.2" />
      <path d={`M${x} 14h${w}l-2 44h-${w - 4}z`} fill="#F3DFA2" fillOpacity=".55" stroke="#8E6A22" strokeWidth="1.2" />
    </svg>
  );
}

function PrefsStep({ value, onChange, onBack, onNext }: { value: FitPreferences; onChange: (p: FitPreferences) => void; onBack: () => void; onNext: () => void }) {
  const id = useId();
  return (
    <div>
      <StepTitle title="How do you like to wear it?">Choose your preferred fit — we size every piece to it.</StepTitle>
      <fieldset>
        <legend className="sr-only">Preferred fit</legend>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4" role="radiogroup">
          {FIT_STYLES.map((f, i) => {
            const on = value.fit === f.value;
            return (
              <button
                key={f.value}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => onChange({ ...value, fit: f.value })}
                className={`relative flex flex-col items-center border p-4 text-center transition ${on ? "border-brand-green bg-pearl shadow-card" : "border-mist hover:border-gold"}`}
              >
                {on && <span aria-hidden className="absolute inset-1.5 border border-dashed border-gold" />}
                <FitGlyph ease={i} />
                <span className="mt-2 font-display text-[0.7rem] uppercase tracking-[0.16em]">{f.label}</span>
                <span className="text-base italic text-ink-soft">{f.short}</span>
                <span className="mt-1 text-sm text-ink-soft">{f.description}</span>
              </button>
            );
          })}
        </div>
      </fieldset>
      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <Segmented label="Garment length" options={LENGTH_PREFS} value={value.length} onChange={(length) => onChange({ ...value, length })} />
        <Segmented label="Sleeve length" options={LENGTH_PREFS} value={value.sleeve} onChange={(sleeve) => onChange({ ...value, sleeve })} />
      </div>
      <div className="mt-5">
        <label htmlFor={`${id}-notes`} className="field-label">
          Notes for the tailor (optional)
        </label>
        <textarea
          id={`${id}-notes`}
          rows={3}
          maxLength={300}
          value={value.notes}
          onChange={(e) => onChange({ ...value, notes: e.target.value })}
          placeholder="e.g. sloping right shoulder, prefer a higher collar, room for a watch on the left wrist"
          className="field"
        />
      </div>
      <Actions onBack={onBack} next="See my Royal Fit" onNext={onNext} />
    </div>
  );
}

function ProfileSummary({ profile }: { profile: FitProfile }) {
  return (
    <dl className="grid grid-cols-2 gap-x-6 gap-y-2 border border-mist bg-pearl p-4 text-base sm:grid-cols-4">
      {MEASUREMENT_FIELDS.map((f) => (
        <div key={f.key}>
          <dt className="eyebrow text-[0.58rem] text-ink-soft">{f.label}</dt>
          <dd>
            {round1(profile.measurements[f.key])} cm <span className="text-ink-soft">· {round1(cmToIn(profile.measurements[f.key]))}″</span>
          </dd>
        </div>
      ))}
      <div>
        <dt className="eyebrow text-[0.58rem] text-ink-soft">Height</dt>
        <dd>{profile.heightCm ? `${profile.heightCm} cm` : "—"}</dd>
      </div>
    </dl>
  );
}

function ResultStep({ onClose, onEdit }: { onClose: () => void; onEdit: () => void }) {
  const { profile, wizard } = useFit();
  const { settings } = useCatalog();
  const product = wizard?.product;
  useEffect(() => {
    document.getElementById("royal-fit-result")?.focus();
  }, []);
  if (!profile) return null;
  const style = FIT_STYLES.find((f) => f.value === profile.preferences.fit)!;
  const advice = product ? recommendSize(product, profile) : null;
  const mtm = product ? madeToMeasureAvailable(product) : false;

  return (
    <div>
      <div className="text-center">
        <p className="eyebrow text-ink-soft">Your Royal Fit</p>
        <h3 id="royal-fit-result" tabIndex={-1} className="mt-2 text-2xl focus:outline-none sm:text-3xl">
          {advice?.size ? `Size ${advice.size}` : style.label}
        </h3>
        <p className="mt-1 text-lg italic text-ink-soft">
          {style.label} · {style.short}
        </p>
      </div>

      {advice && (
        <div className="mx-auto mt-6 max-w-xl border border-gold/60 bg-pearl p-5 text-center">
          <p className="text-lg">{advice.reason}</p>
          <p className="mt-2 font-display text-[0.62rem] uppercase tracking-[0.2em] text-gold-dark">
            {advice.confidence === "high" ? "Confident match" : advice.confidence === "medium" ? "Good match" : "Between sizes"}
            {advice.alternative ? ` · Also consider ${advice.alternative}` : ""}
          </p>
        </div>
      )}

      {product ? (
        <div className={`mx-auto mt-6 grid max-w-xl gap-3 ${mtm ? "sm:grid-cols-2" : ""}`}>
          {advice?.size && (
            <button
              type="button"
              className={advice.suggestMadeToMeasure ? "btn-outline" : "btn-royal"}
              onClick={() => {
                wizard?.onChoose?.({ size: advice.size! });
                onClose();
              }}
            >
              Select size {advice.size}
            </button>
          )}
          {mtm && (
            <button
              type="button"
              className={advice?.suggestMadeToMeasure || !advice?.size ? "btn-royal" : "btn-outline"}
              onClick={() => {
                wizard?.onChoose?.({ madeToMeasure: true });
                onClose();
              }}
            >
              Made to measure +{formatINR(settings.madeToMeasureFee)}
            </button>
          )}
        </div>
      ) : (
        <div className="mx-auto mt-6 max-w-xl text-center">
          <p className="text-lg">
            Saved on this device. Every product page will now show your size, and made-to-measure pieces are tailored to these
            numbers.
          </p>
          <Link href="/shop" onClick={onClose} className="btn-royal mt-6">
            Shop with my Royal Fit
          </Link>
        </div>
      )}
      {mtm && (
        <p className="mx-auto mt-3 max-w-xl text-center text-sm text-ink-soft">
          Made to measure: cut to your exact measurements and {style.label.toLowerCase()} preference, dispatched in about{" "}
          {settings.madeToMeasureDays} extra days. Our tailor confirms your numbers before cutting.
        </p>
      )}

      <div className="mt-8">
        <ProfileSummary profile={profile} />
        <button type="button" onClick={onEdit} className="link-thread mt-3 text-base">
          Adjust measurements or fit
        </button>
      </div>
    </div>
  );
}
