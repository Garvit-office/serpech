import type { Metadata } from "next";
import Link from "next/link";
import { SarpechEmblem } from "@sarpech/brand/SarpechEmblem";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmbroideredFrame } from "@sarpech/brand/ornaments/EmbroideredFrame";
import { Jaali } from "@sarpech/brand/ornaments/Jaali";
import { SectionDivider } from "@sarpech/brand/ornaments/SectionDivider";
import { StitchIn } from "@sarpech/brand/ornaments/StitchIn";
import { NeedleIcon, RulerIcon } from "@/components/ui/icons";

export const metadata: Metadata = {
  title: "Our Story",
  description:
    "The meaning of the sarpech — the jewelled turban ornament of kings — and the craft, karigars and values behind SARPECH Royal Heritage Wear.",
};

const ANATOMY = [
  { name: "The Kalgi", text: "A plume rising from the centre — once a heron feather, later wrought in gold — the mark of sovereignty." },
  { name: "The Ruby", text: "Set in an almond mount at the heart of the ornament, the jewel stood for courage and the blood of the line." },
  { name: "The Pearls", text: "Drops that swayed with every step, for grace and the calm that should temper power." },
];

const TIMELINE = [
  { era: "16th century", title: "The Mughal court", text: "Emperors pin jewelled sarpech to the turban. Granting one becomes the highest honour a ruler can bestow." },
  { era: "17th–19th c.", title: "The Rajput darbar", text: "In Jaipur, Jodhpur and Udaipur the sarpech crowns the safa at coronations, weddings and durbars." },
  { era: "Today", title: "The groom's crown", text: "Every Indian groom still wears a sarpech on his wedding safa — one day as a king." },
  { era: "Est. 2026", title: "SARPECH", text: "A house founded to dress modern men with that same sense of honour, every day of the year." },
];

const CRAFT = [
  { title: "Zari & Dabka", text: "Gilt metal thread couched by hand, coil by coil. A single wedding sherwani carries up to 180 hours of work." },
  { title: "Handloom Weavers", text: "Brocades from the looms of Banaras and Chanderi silk woven in Madhya Pradesh, bought direct from weaving families." },
  { title: "Lucknow Chikankari", text: "White-on-white shadow work stitched by women artisans in Lucknow, sometimes over months for one kurta." },
];

const VALUES = [
  { icon: <NeedleIcon className="size-7" />, title: "Craft first", text: "Hand embroidery where it matters, machine precision where it serves — never shortcuts." },
  { icon: <SarpechEmblem tone="green" ring={false} ruby={false} strokeWidth={3} className="size-10" />, title: "Fair to our karigars", text: "Artisans are paid per hour, above market, with work all year, not only in wedding season." },
  { icon: <RulerIcon className="size-7" />, title: "Made to fit, made to last", text: "Savile Row blocks, generous seam allowances and free first alterations so each piece can be passed down." },
];

export default function OurStoryPage() {
  return (
    <>
      <PageHeader
        eyebrow="Our Story · सरपेच"
        title="Crowned in Heritage"
        intro={<p>The story of a jewel once worn only by kings, and of a house that makes clothes worthy of it.</p>}
      />

      {/* The meaning */}
      <section aria-labelledby="meaning" className="on-dark relative isolate overflow-hidden bg-brand-green text-ivory">
        <Jaali opacity={0.07} />
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[1fr_1.2fr] lg:px-8 lg:py-28">
          <StitchIn className="mx-auto w-full max-w-sm">
            <div className="gold-shimmer rounded-full">
              <SarpechEmblem tone="gold" stitch className="h-auto w-full" title="The sarpech emblem" />
            </div>
          </StitchIn>
          <div>
            <p className="eyebrow text-gold-light">The meaning of Sarpech</p>
            <h2 id="meaning" className="mt-3 text-3xl text-ivory sm:text-4xl">
              The jewel of the turban
            </h2>
            <p className="mt-6 text-xl leading-relaxed text-ivory/90">
              <em>Sar</em> means head; <em>pech</em>, the turn of a turban. A sarpech is the jewelled ornament fixed to
              the front of a king&rsquo;s pagri. In the Mughal and Rajput courts it was worn only by the sovereign — and
              when a ruler wished to honour a general, a poet or an ally, he unpinned a sarpech and gave it as the
              highest mark of favour.
            </p>
            <ul className="mt-8 grid gap-6 sm:grid-cols-3">
              {ANATOMY.map((a) => (
                <li key={a.name} className="border-t border-gold/40 pt-4">
                  <h3 className="font-display text-sm text-gold-light">{a.name}</h3>
                  <p className="mt-2 text-lg text-ivory/85">{a.text}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section aria-labelledby="timeline" className="mx-auto max-w-5xl px-4 py-20 sm:px-6">
        <h2 id="timeline" className="text-center text-2xl sm:text-3xl">
          Four Centuries of Honour
        </h2>
        <SectionDivider className="mt-6" size="sm" />
        <ol className="relative mt-12 space-y-10 before:absolute before:inset-y-2 before:left-[0.4rem] before:w-px before:bg-gold/60 sm:before:left-1/2">
          {TIMELINE.map((t, i) => (
            <li key={t.title} className={`relative pl-10 sm:w-1/2 sm:pl-0 ${i % 2 ? "sm:ml-auto sm:pl-12" : "sm:pr-12 sm:text-right"}`}>
              <span
                aria-hidden
                className={`absolute top-2 size-3.5 rotate-45 border border-gold bg-white left-0 ${i % 2 ? "sm:-left-[0.45rem]" : "sm:left-auto sm:-right-[0.45rem]"}`}
              />
              <p className="eyebrow text-ink-soft">{t.era}</p>
              <h3 className="mt-1 text-lg">{t.title}</h3>
              <p className="mt-2 text-lg text-ink-soft">{t.text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Origin + pull quote */}
      <section aria-labelledby="origin" className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <p className="eyebrow text-ink-soft">The House · Est. 2026</p>
            <h2 id="origin" className="mt-3 text-2xl sm:text-3xl">
              A Rajput palace and a Savile Row atelier
            </h2>
            <p className="mt-6 text-xl leading-relaxed">
              SARPECH began with a simple question: why should a man feel like a king only on his wedding day? We pair
              the ornament of Rajasthan&rsquo;s courts — zari, brocade, the closed collar of the bandhgala — with the
              discipline of English tailoring: canvassed fronts, hand-set sleeves and a fit that is drafted, not
              guessed.
            </p>
            <p className="mt-4 text-xl leading-relaxed text-ink-soft">
              Every garment carries our signature: a small gold sarpech, or a line of zari, so the collection reads as
              one family.
            </p>
          </div>
          <EmbroideredFrame className="px-8 py-14 text-center sm:px-14">
            <blockquote>
              <p className="font-serif text-3xl italic leading-snug sm:text-4xl">
                &ldquo;A sarpech was never bought. It was bestowed.&rdquo;
              </p>
              <footer className="eyebrow mt-6 text-ink-soft">— The founding idea of the house</footer>
            </blockquote>
          </EmbroideredFrame>
        </div>
      </section>

      {/* Craft */}
      <section aria-labelledby="craft" className="border-y border-mist bg-pearl py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="eyebrow text-ink-soft">The Craft</p>
            <h2 id="craft" className="mt-3 text-2xl sm:text-3xl">
              Made by Hand, Thread by Thread
            </h2>
            <SectionDivider className="mt-6" size="sm" />
          </div>
          <ul className="mt-12 grid gap-6 md:grid-cols-3">
            {CRAFT.map((c, i) => (
              <li key={c.title} className="stitch-frame relative bg-white p-8 shadow-card">
                <span className="font-display text-4xl text-gold-dark" aria-hidden>
                  {["I", "II", "III"][i]}
                </span>
                <h3 className="mt-4 text-lg">{c.title}</h3>
                <p className="mt-3 text-lg text-ink-soft">{c.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Values */}
      <section aria-labelledby="values" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <h2 id="values" className="text-center text-2xl sm:text-3xl">
          What We Stand For
        </h2>
        <SectionDivider className="mt-6" size="sm" />
        <ul className="mt-12 grid gap-10 md:grid-cols-3">
          {VALUES.map(({ icon, title, text }) => (
            <li key={title} className="text-center">
              <span className="mx-auto grid size-16 place-items-center rounded-full border border-gold text-brand-green">
                {icon}
              </span>
              <h3 className="mt-5 text-lg">{title}</h3>
              <p className="mx-auto mt-3 max-w-xs text-lg text-ink-soft">{text}</p>
            </li>
          ))}
        </ul>
        <div className="mt-16 flex flex-wrap justify-center gap-4">
          <Link href="/shop" className="btn-royal">
            Shop the Collection
          </Link>
          <Link href="/contact" className="btn-outline">
            Visit an Atelier
          </Link>
        </div>
      </section>
    </>
  );
}
