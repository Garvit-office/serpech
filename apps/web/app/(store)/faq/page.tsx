import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { AccordionItem } from "@/components/content/Accordion";
import { PageHeader } from "@/components/layout/PageHeader";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Answers on ordering, sizing and alterations, shipping, returns, garment care and payment at SARPECH.",
};

const GROUPS: { id: string; title: string; items: { q: string; a: ReactNode }[] }[] = [
  {
    id: "orders",
    title: "Orders",
    items: [
      { q: "Do I need an account to order?", a: "No. You can check out as a guest; your bag and wishlist are saved on this device." },
      {
        q: "Can I change or cancel my order?",
        a: "Ready-to-wear orders can be changed or cancelled within 12 hours by writing to care@sarpech.in. Made-to-measure orders cannot be cancelled once cutting has begun.",
      },
      {
        q: "Do you dress the whole wedding party?",
        a: (
          <>
            Yes — we coordinate the groom, his family and groomsmen in complementary colourways. <Link href="/contact">Book a fitting</Link> and mention the party size.
          </>
        ),
      },
    ],
  },
  {
    id: "sizing",
    title: "Sizing & Alterations",
    items: [
      {
        q: "How do I find my size?",
        a: (
          <>
            Sherwanis and bandhgalas are sized by chest in inches (36–46); everything else runs S–XXL. See the{" "}
            <Link href="/size-guide">size guide</Link> for full measurements.
          </>
        ),
      },
      { q: "Are alterations included?", a: "Your first alteration is complimentary at any atelier, or by courier within 30 days of delivery." },
      { q: "Do you offer made-to-measure?", a: "Yes. Sherwanis, bandhgalas and Jodhpuri suits can be made to measure in six to eight weeks." },
    ],
  },
  {
    id: "shipping",
    title: "Shipping",
    items: [
      {
        q: "How much is shipping?",
        a: (
          <>
            Complimentary and insured on orders above ₹10,000; ₹350 otherwise. Details on <Link href="/shipping-returns">Shipping &amp; Returns</Link>.
          </>
        ),
      },
      { q: "How long does delivery take?", a: "3–7 working days within India, 7–12 working days internationally." },
      { q: "Do you ship internationally?", a: "Yes, to most countries. Duties and taxes are calculated at checkout." },
    ],
  },
  {
    id: "returns",
    title: "Returns",
    items: [
      {
        q: "What is your returns policy?",
        a: "Unworn ready-to-wear pieces with tags may be returned within 14 days of delivery. Altered and made-to-measure garments cannot be returned.",
      },
      { q: "Can I exchange a size?", a: "Yes — exchanges are free within 14 days, subject to stock." },
    ],
  },
  {
    id: "care",
    title: "Care",
    items: [
      {
        q: "How do I care for zari embroidery?",
        a: "Dry clean only. Store folded in the muslin bag provided, away from damp, and keep perfume away from metal thread to prevent tarnish.",
      },
      { q: "Can I wash my polo or tee?", a: "Yes — machine wash cold, inside out. Do not iron directly over the embroidered crest." },
    ],
  },
  {
    id: "payments",
    title: "Payments",
    items: [
      {
        q: "Which payment methods do you accept?",
        a: "UPI, all major credit and debit cards, net banking and wallets. Secure checkout through Razorpay is coming soon.",
      },
      { q: "Is EMI available?", a: "No-cost EMI on orders above ₹25,000 will be available with major cards when Razorpay checkout launches." },
      { q: "Are prices inclusive of tax?", a: "Yes. All prices in INR include GST." },
    ],
  },
];

export default function FaqPage() {
  return (
    <>
      <PageHeader eyebrow="Client Care" title="Frequently Asked Questions" intro={<p>Everything you need to know before, during and after your order.</p>} />
      <div className="mx-auto grid max-w-6xl gap-10 px-4 pb-20 sm:px-6 lg:grid-cols-[14rem_1fr]">
        <nav aria-label="FAQ topics" className="lg:sticky lg:top-40 lg:self-start">
          <ul className="flex flex-wrap gap-2 lg:flex-col lg:gap-3">
            {GROUPS.map((g) => (
              <li key={g.id}>
                <a href={`#${g.id}`} className="eyebrow block border border-mist px-3 py-2 hover:border-gold lg:border-0 lg:p-0 lg:hover:underline">
                  {g.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="space-y-12">
          {GROUPS.map((g) => (
            <section key={g.id} id={g.id} aria-labelledby={`${g.id}-h`} className="scroll-mt-40">
              <h2 id={`${g.id}-h`} className="border-b border-brand-green pb-3 text-lg">
                {g.title}
              </h2>
              {g.items.map((it) => (
                <AccordionItem key={it.q} question={it.q}>
                  {it.a}
                </AccordionItem>
              ))}
            </section>
          ))}
          <p className="text-lg text-ink-soft">
            Still have a question? <Link href="/contact" className="text-brand-green underline">Contact client care</Link>.
          </p>
        </div>
      </div>
    </>
  );
}
