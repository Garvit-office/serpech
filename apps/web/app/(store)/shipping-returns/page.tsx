import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { SectionDivider } from "@sarpech/brand/ornaments/SectionDivider";
import { TruckIcon } from "@/components/ui/icons";

export const metadata: Metadata = {
  title: "Shipping & Returns",
  description:
    "Complimentary insured shipping above ₹10,000, delivery timelines in India and abroad, made-to-measure lead times, and SARPECH's 14-day returns and exchange policy.",
};

const RATES = [
  ["India — orders above ₹10,000", "Complimentary, insured", "3–7 working days"],
  ["India — orders below ₹10,000", "₹350, insured", "3–7 working days"],
  ["International", "Calculated at checkout", "7–12 working days"],
  ["Express (metro cities)", "₹750", "1–2 working days"],
];

const MTM = [
  ["Kurtas, shirts & Nehru jackets", "2–3 weeks"],
  ["Bandhgalas & Jodhpuri suits", "4–6 weeks"],
  ["Wedding sherwanis", "6–8 weeks"],
  ["Rush service (subject to availability)", "From 10 days"],
];

export default function ShippingReturnsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Client Care"
        title="Shipping & Returns"
        intro={<p>Every order leaves our atelier wrapped in muslin, boxed, and insured to your door.</p>}
      />

      <div className="mx-auto max-w-4xl space-y-16 px-4 pb-20 sm:px-6">
        <section aria-labelledby="shipping">
          <h2 id="shipping" className="flex items-center gap-3 text-xl">
            <TruckIcon className="size-6 text-gold-dark" /> Shipping
          </h2>
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[32rem] border-collapse text-left text-lg">
              <caption className="sr-only">Shipping rates and delivery times</caption>
              <thead>
                <tr className="border-b border-brand-green">
                  {["Destination", "Cost", "Delivery"].map((h) => (
                    <th key={h} scope="col" className="px-3 py-2 font-display text-[0.68rem] font-medium uppercase tracking-[0.18em]">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {RATES.map(([d, c, t]) => (
                  <tr key={d} className="border-b border-mist">
                    <th scope="row" className="px-3 py-3 font-normal">
                      {d}
                    </th>
                    <td className="px-3 py-3">{c}</td>
                    <td className="px-3 py-3 text-ink-soft">{t}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ul className="mt-6 list-disc space-y-2 pl-6 text-lg text-ink-soft marker:text-gold-dark">
            <li>Orders placed before 2pm IST on working days are dispatched the same day.</li>
            <li>You will receive a tracking link by email and SMS when your parcel leaves us.</li>
            <li>International duties and taxes are shown and paid at checkout — no surprises at the door.</li>
          </ul>
        </section>

        <SectionDivider size="sm" />

        <section aria-labelledby="mtm">
          <h2 id="mtm" className="text-xl">
            Made-to-Measure Timelines
          </h2>
          <p className="mt-4 text-lg text-ink-soft">
            Lead times begin after your final measurements are confirmed. For weddings, we recommend ordering at least
            eight weeks ahead.
          </p>
          <dl className="mt-6 divide-y divide-mist border-y border-mist">
            {MTM.map(([k, v]) => (
              <div key={k} className="flex items-baseline justify-between gap-4 py-3 text-lg">
                <dt>{k}</dt>
                <dd className="font-display text-sm tracking-[0.12em]">{v}</dd>
              </div>
            ))}
          </dl>
        </section>

        <SectionDivider size="sm" />

        <section aria-labelledby="returns">
          <h2 id="returns" className="text-xl">
            Returns &amp; Exchanges
          </h2>
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <div className="border border-mist p-6">
              <h3 className="text-sm">14-day returns</h3>
              <p className="mt-3 text-lg text-ink-soft">
                Ready-to-wear pieces may be returned within 14 days of delivery, unworn, with tags and the original
                packaging. Refunds are issued to the original payment method within 5–7 working days of receipt.
              </p>
            </div>
            <div className="border border-mist p-6">
              <h3 className="text-sm">Free exchanges</h3>
              <p className="mt-3 text-lg text-ink-soft">
                Exchange for another size or colour within 14 days. We collect the original and send the replacement
                at no cost, subject to stock.
              </p>
            </div>
          </div>
          <p className="mt-6 border-l-2 border-ruby pl-4 text-lg">
            Altered, monogrammed and made-to-measure garments, and pre-tied safas, cannot be returned or exchanged.
          </p>
          <h3 className="mt-10 text-sm">How to return</h3>
          <ol className="mt-4 list-decimal space-y-2 pl-6 text-lg text-ink-soft marker:font-display marker:text-brand-green">
            <li>Email care@sarpech.in with your order number and the pieces you are returning.</li>
            <li>We schedule a free pickup within two working days.</li>
            <li>Pack the garment in its muslin bag and box; our courier will collect it.</li>
          </ol>
        </section>

        <p className="text-center text-lg">
          Questions? See the <Link href="/faq" className="underline">FAQ</Link> or{" "}
          <Link href="/contact" className="underline">
            contact client care
          </Link>
          .
        </p>
      </div>
    </>
  );
}
