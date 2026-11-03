import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/PageHeader";
import { MadeToMeasureTerms, SavedProfile, StartFitButton } from "@/components/fit/RoyalFitPageClient";
import { EmbroideredFrame } from "@/components/ornaments/EmbroideredFrame";
import { SectionDivider } from "@/components/ornaments/SectionDivider";
import { FIT_STYLES } from "@/lib/fit";

export const metadata: Metadata = {
  title: "Royal Fit — Fit Check & Made to Measure",
  description:
    "Find your Royal Fit: a 20-second camera Fit Check that runs privately on your device, your preferred fit from slim to a little baggy, and made-to-measure tailoring.",
  alternates: { canonical: "/royal-fit" },
};

const STEPS = [
  {
    n: "I",
    title: "Fit Check",
    body: "Prop up your phone, step back and stand like a star. In about twenty seconds we read your chest, waist, hips, shoulders, sleeves and inseam — or type them in.",
  },
  {
    n: "II",
    title: "Choose your fit",
    body: "Royal Tailored, Regular, Relaxed or Loose — plus how long you like your sleeves and hems. We add the right ease for every piece.",
  },
  {
    n: "III",
    title: "Wear it royal",
    body: "Every product shows the size made for you. Or choose made-to-measure and our tailors cut it to your exact numbers.",
  },
];

export default function RoyalFitPage() {
  return (
    <>
      <PageHeader
        tone="green"
        eyebrow="Fit Check · Made to Measure"
        title="Your Royal Fit"
        intro="A king was never fitted off the rack. Tell us your measure once — by camera or by tape — and every SARPECH piece is sized to you."
      >
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <StartFitButton />
        </div>
        <p className="mt-4 text-base text-ivory/75">Runs privately on your device · nothing is uploaded or stored by us</p>
      </PageHeader>

      <section aria-labelledby="how-title" className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="eyebrow text-ink-soft">How it works</p>
          <h2 id="how-title" className="mt-3 text-2xl sm:text-3xl">
            Three steps to the throne
          </h2>
          <SectionDivider size="sm" className="mt-6" />
        </div>
        <ol className="mt-12 grid gap-6 md:grid-cols-3">
          {STEPS.map((s) => (
            <li key={s.n} className="relative border border-mist px-7 py-9">
              <span className="font-display text-sm tracking-[0.2em] text-gold-dark">{s.n}</span>
              <h3 className="mt-3 text-base tracking-[0.2em]">{s.title}</h3>
              <p className="mt-3 text-lg text-ink-soft">{s.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="fits-title" className="border-y border-mist bg-pearl">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
          <h2 id="fits-title" className="text-center text-xl sm:text-2xl">
            Four ways to wear it
          </h2>
          <ul className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-4">
            {FIT_STYLES.map((f) => (
              <li key={f.value} className="border border-gold/50 bg-white px-5 py-6 text-center">
                <p className="font-display text-xs uppercase tracking-[0.2em]">{f.label}</p>
                <p className="mt-1 text-lg italic text-ink-soft">{f.short}</p>
                <p className="mt-2 text-base text-ink-soft">{f.description}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section aria-labelledby="mtm-title" className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-20 sm:px-6 md:grid-cols-2 lg:px-8">
        <div>
          <p className="eyebrow text-ink-soft">Made to Measure</p>
          <h2 id="mtm-title" className="mt-3 text-2xl sm:text-3xl">
            Cut for one
          </h2>
          <div className="mt-5">
            <MadeToMeasureTerms />
          </div>
        </div>
        <EmbroideredFrame className="px-8 py-10">
          <h3 className="text-base tracking-[0.2em]">Privacy &amp; accuracy</h3>
          <ul className="mt-4 space-y-3 text-lg">
            <li>The camera image is analysed in your browser and never leaves your device.</li>
            <li>Camera readings are estimates, typically within 2–4 cm. You review and adjust every number.</li>
            <li>Your Royal Fit is saved only on this device — clear it any time below.</li>
            <li>Measurements reach us only with a made-to-measure order, for your tailor.</li>
          </ul>
        </EmbroideredFrame>
      </section>

      <section aria-labelledby="saved-title" className="mx-auto max-w-4xl px-4 pb-24 sm:px-6">
        <h2 id="saved-title" className="mb-6 text-center text-xl">
          Your saved Royal Fit
        </h2>
        <SavedProfile />
      </section>
    </>
  );
}
