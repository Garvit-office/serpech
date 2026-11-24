import type { Metadata } from "next";
import { LogoRoundel, Lockup, Wordmark } from "@sarpech/brand/Logo";
import { SarpechEmblem } from "@sarpech/brand/SarpechEmblem";
import { ProductCard } from "@/components/shop/ProductCard";
import { CornerOrnament } from "@sarpech/brand/ornaments/CornerOrnament";
import { EmbroideredFrame } from "@sarpech/brand/ornaments/EmbroideredFrame";
import { Jaali } from "@sarpech/brand/ornaments/Jaali";
import { SectionDivider } from "@sarpech/brand/ornaments/SectionDivider";
import { ZariBorder } from "@sarpech/brand/ornaments/ZariBorder";
import { products } from "@sarpech/backend/seed-products";

export const metadata: Metadata = {
  title: "Design System",
  description: "SARPECH tokens, typography, buttons, gold-embroidery ornaments and garment templates.",
  robots: { index: false },
};

const SWATCHES = [
  { name: "White", token: "bg-white", hex: "#FFFFFF", note: "Page background", text: "text-brand-green", border: true },
  { name: "Brand Green", token: "brand-green", hex: "#0E1A15", note: "Header, footer, buttons, headings", text: "text-ivory" },
  { name: "Secondary Green", token: "brand-green-2", hex: "#1F3A2E", note: "Hover, cards on dark", text: "text-ivory" },
  { name: "Gold", token: "gold", hex: "#C9A04A", note: "Decoration only on white", text: "text-brand-green" },
  { name: "Gold Light", token: "gold-light", hex: "#F3DFA2", note: "Gradient start, text on green", text: "text-brand-green" },
  { name: "Gold Dark", token: "gold-dark", hex: "#8E6A22", note: "Gradient end, focus rings", text: "text-ivory" },
  { name: "Ruby", token: "ruby", hex: "#A3162B", note: "Sale, cart count, jewel", text: "text-white" },
  { name: "Ivory", token: "ivory", hex: "#F5EEE0", note: "Text on green", text: "text-brand-green" },
];

const BG: Record<string, string> = {
  "brand-green": "bg-brand-green",
  "brand-green-2": "bg-brand-green-2",
  gold: "bg-gold",
  "gold-light": "bg-gold-light",
  "gold-dark": "bg-gold-dark",
  ruby: "bg-ruby",
  ivory: "bg-ivory",
};

function Section({ title, children, id }: { title: string; children: React.ReactNode; id: string }) {
  return (
    <section aria-labelledby={id} className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <h2 id={id} className="text-xl sm:text-2xl">
        {title}
      </h2>
      <div className="mt-8">{children}</div>
    </section>
  );
}

export default function StyleGuidePage() {
  return (
    <>
      <header className="mx-auto max-w-7xl px-4 pb-4 pt-14 text-center sm:px-6">
        <p className="eyebrow text-ink-soft">SARPECH · Design System</p>
        <h1 className="mt-3 text-3xl sm:text-4xl">Style Guide</h1>
        <p className="mx-auto mt-4 max-w-2xl text-xl text-ink-soft">
          Gold thread on white cloth. Green is the ink; gold is only ever embroidery — borders, dividers and accents.
        </p>
        <SectionDivider className="mt-8" />
      </header>

      <Section title="Logo" id="sg-logo">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <figure className="grid place-items-center gap-3 border border-mist p-6">
            <LogoRoundel className="h-36 w-36" />
            <figcaption className="eyebrow text-ink-soft">Primary · on green</figcaption>
          </figure>
          <figure className="grid place-items-center gap-3 border border-mist p-6">
            <SarpechEmblem tone="gold" className="h-36 w-36" title="Gold emblem" />
            <figcaption className="eyebrow text-ink-soft">Emblem · gold</figcaption>
          </figure>
          <figure className="grid place-items-center gap-3 border border-mist p-6">
            <SarpechEmblem tone="green" className="h-36 w-36" title="Green emblem" />
            <figcaption className="eyebrow text-ink-soft">Emblem · green</figcaption>
          </figure>
          <figure className="grid place-items-center gap-3 bg-brand-green p-6">
            <SarpechEmblem tone="white" ruby={false} className="h-36 w-36" title="White emblem" />
            <figcaption className="eyebrow text-ivory">Emblem · white</figcaption>
          </figure>
        </div>
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <div className="grid place-items-center bg-brand-green p-8">
            <Lockup tone="ivory" emblemClassName="h-16 w-16" textClassName="text-3xl" />
          </div>
          <div className="grid place-items-center border border-mist p-8">
            <Lockup tone="green" emblemClassName="h-16 w-16" textClassName="text-3xl" />
          </div>
        </div>
      </Section>

      <Section title="Colour" id="sg-colour">
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {SWATCHES.map((s) => (
            <li key={s.name} className="border border-mist">
              <div className={`h-24 ${s.border ? "bg-white" : BG[s.token]} ${s.text} flex items-end p-3 font-display text-xs tracking-[0.2em]`}>
                Aa
              </div>
              <div className="p-3">
                <p className="font-display text-xs tracking-[0.16em] uppercase">{s.name}</p>
                <p className="text-base text-ink-soft">
                  {s.hex} · <code className="text-sm">{s.token}</code>
                </p>
                <p className="text-sm text-ink-soft">{s.note}</p>
              </div>
            </li>
          ))}
        </ul>
        <div className="mt-4 h-10 bg-[linear-gradient(90deg,#F3DFA2,#C9A04A,#8E6A22)]" aria-label="Zari gold gradient" role="img" />
      </Section>

      <Section title="Typography" id="sg-type">
        <div className="space-y-5">
          <p className="font-display text-4xl tracking-[0.12em] sm:text-5xl">CROWNED IN HERITAGE</p>
          <h1 className="text-3xl">H1 · Cinzel 500, tracked</h1>
          <h2 className="text-2xl">H2 · Royal Collection</h2>
          <h3 className="text-lg">H3 · Fabric &amp; Care</h3>
          <p className="eyebrow">Eyebrow · Cinzel 12px / 0.28em</p>
          <p className="max-w-2xl text-xl">
            Body · Cormorant Garamond. A sarpech was the jewelled ornament pinned to a king’s pagri — a plume of gold,
            set with a ruby and hung with pearls, given only as the highest honour.
          </p>
          <p className="text-2xl italic">Taglines · Cormorant italic — “Crowned in Heritage”</p>
        </div>
      </Section>

      <Section title="Buttons" id="sg-buttons">
        <div className="flex flex-wrap items-center gap-4">
          <button type="button" className="btn-royal">Shop the Collection</button>
          <button type="button" className="btn-outline">Outline</button>
          <button type="button" className="btn-royal" disabled>Disabled</button>
        </div>
        <div className="on-dark mt-6 flex flex-wrap items-center gap-4 bg-brand-green p-6">
          <button type="button" className="btn-royal btn-royal-gold">Gold on green</button>
          <button type="button" className="btn-royal border border-gold/40">Green on green</button>
          <button type="button" className="btn-outline">Outline on green</button>
        </div>
      </Section>

      <Section title="Ornaments" id="sg-ornaments">
        <div className="space-y-10">
          <div>
            <p className="eyebrow mb-3 text-ink-soft">Zari border</p>
            <ZariBorder />
          </div>
          <div>
            <p className="eyebrow mb-3 text-ink-soft">Section divider</p>
            <SectionDivider />
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <p className="eyebrow mb-3 text-ink-soft">Corner ornaments</p>
              <div className="relative h-48 border border-mist">
                <CornerOrnament corner="tl" className="h-20 w-20" />
                <CornerOrnament corner="tr" className="h-20 w-20" />
                <CornerOrnament corner="bl" className="h-20 w-20" />
                <CornerOrnament corner="br" className="h-20 w-20" />
              </div>
            </div>
            <div>
              <p className="eyebrow mb-3 text-ink-soft">Jaali on green (7%)</p>
              <div className="relative h-48 overflow-hidden bg-brand-green">
                <Jaali opacity={0.07} />
              </div>
            </div>
          </div>
          <div>
            <p className="eyebrow mb-3 text-ink-soft">Embroidered frame (stitches in on scroll)</p>
            <EmbroideredFrame className="px-8 py-16 text-center">
              <p className="font-display text-xl tracking-[0.2em]">THE ROYAL COLLECTION</p>
              <p className="mt-2 text-lg text-ink-soft">Hover a product card to see the stitched frame.</p>
            </EmbroideredFrame>
          </div>
        </div>
      </Section>

      <Section title="Product card" id="sg-card">
        <p className="mb-6 max-w-2xl text-lg text-ink-soft">
          Off-white card, soft shadow, a stitched double gold frame on hover or keyboard focus. Shows the product photo, or a
          branded placeholder until photography is supplied.
        </p>
        <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
          {products.slice(0, 4).map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </Section>

      <div className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
        <Wordmark devanagari className="text-2xl" />
      </div>
    </>
  );
}
