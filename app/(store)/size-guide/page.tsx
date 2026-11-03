import type { Metadata } from "next";
import Link from "next/link";
import { MeasureDiagram } from "@/components/content/MeasureDiagram";
import { PageHeader } from "@/components/layout/PageHeader";
import { SectionDivider } from "@/components/ornaments/SectionDivider";
import { SizeChart } from "@/components/shop/SizeChart";
import { HOW_TO_MEASURE, SIZE_CHARTS, type SizeChartKey } from "@/data/size-guide";

export const metadata: Metadata = {
  title: "Size Guide",
  description:
    "SARPECH size charts for sherwanis, bandhgalas, kurtas, shirts, polos, trousers and mojaris, with how-to-measure instructions and fit notes.",
};

const FIT_NOTES = [
  { title: "Sherwanis & bandhgalas", text: "Cut close through the chest with room to sit cross-legged at the mandap. If between sizes, choose the larger — we can take it in." },
  { title: "Kurtas & Nehru jackets", text: "A relaxed, straight cut. Nehru jackets are sized to wear over a kurta; choose your kurta size." },
  { title: "Polos & tees", text: "Heavyweight cotton is pre-shrunk. Regular fit; size down for a closer cut." },
];

export default function SizeGuidePage() {
  const keys = Object.keys(SIZE_CHARTS) as SizeChartKey[];
  return (
    <>
      <PageHeader
        eyebrow="Fit & Measurements"
        title="Size Guide"
        intro={<p>All measurements are body measurements in inches unless noted. Measure over a light shirt.</p>}
      >
        <nav aria-label="Size charts" className="mt-8">
          <ul className="flex flex-wrap justify-center gap-2">
            {keys.map((k) => (
              <li key={k}>
                <a href={`#chart-${k}`} className="eyebrow block border border-mist px-3 py-2 hover:border-gold">
                  {SIZE_CHARTS[k].title.split(",")[0].split(" & ")[0]}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </PageHeader>

      <div className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        <section aria-labelledby="measure" className="grid items-center gap-10 py-8 md:grid-cols-[1fr_1.2fr]">
          <div className="mx-auto w-full max-w-xs bg-pearl p-6 shadow-card">
            <MeasureDiagram className="h-auto w-full" />
          </div>
          <div>
            <h2 id="measure" className="text-xl">
              How to Measure
            </h2>
            <dl className="mt-6 space-y-4">
              {HOW_TO_MEASURE.map((m) => (
                <div key={m.part} className="border-l border-gold pl-4">
                  <dt className="font-display text-sm tracking-[0.18em]">{m.part}</dt>
                  <dd className="text-lg text-ink-soft">{m.how}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <SectionDivider className="my-12" size="sm" />

        <div className="space-y-16">
          {keys.map((k) => (
            <section key={k} id={`chart-${k}`} className="scroll-mt-40" aria-label={SIZE_CHARTS[k].title}>
              <SizeChart chart={k} />
            </section>
          ))}
        </div>

        <SectionDivider className="my-12" size="sm" />

        <section aria-labelledby="fit">
          <h2 id="fit" className="text-center text-xl">
            Fit Notes
          </h2>
          <ul className="mt-8 grid gap-6 md:grid-cols-3">
            {FIT_NOTES.map((f) => (
              <li key={f.title} className="border border-mist p-6">
                <h3 className="text-sm">{f.title}</h3>
                <p className="mt-3 text-lg text-ink-soft">{f.text}</p>
              </li>
            ))}
          </ul>
          <div className="mt-12 text-center">
            <p className="text-xl">Prefer to be measured by a master tailor?</p>
            <Link href="/contact" className="btn-royal mt-5">
              Book a Fitting
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}
