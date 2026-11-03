import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Wordmark } from "@/components/brand/Logo";
import { SarpechEmblem } from "@/components/brand/SarpechEmblem";
import { NewsletterForm } from "@/components/home/Newsletter";
import { FourCorners } from "@/components/ornaments/CornerOrnament";
import { EmbroideredFrame } from "@/components/ornaments/EmbroideredFrame";
import { Jaali } from "@/components/ornaments/Jaali";
import { SectionDivider } from "@/components/ornaments/SectionDivider";
import { StitchIn } from "@/components/ornaments/StitchIn";
import { ZariBorder } from "@/components/ornaments/ZariBorder";
import { ProductCarousel } from "@/components/shop/ProductCarousel";
import { ProductImage } from "@/components/shop/ProductImage";
import { NeedleIcon, RulerIcon, TruckIcon } from "@/components/ui/icons";
import { OCCASIONS, categories, getBestsellers, getWeddingEdit } from "@/lib/catalog";
import { SITE } from "@/lib/format";

export const metadata: Metadata = {
  title: { absolute: `${SITE.name} — ${SITE.tagline} · Luxury Indian Menswear` },
  description: SITE.description,
  alternates: { canonical: "/" },
};

function SectionTitle({ eyebrow, title, intro, id }: { eyebrow: string; title: string; intro?: string; id: string }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className="eyebrow text-ink-soft">{eyebrow}</p>
      <h2 id={id} className="mt-3 text-2xl sm:text-3xl">
        {title}
      </h2>
      {intro && <p className="mt-3 text-xl text-ink-soft">{intro}</p>}
      <SectionDivider size="sm" className="mt-6" />
    </div>
  );
}

const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];

const PROMISES = [
  { title: "Hand Embroidered", body: "Zari laid by master karigars", icon: <NeedleIcon width={26} height={26} /> },
  { title: "Free Alterations", body: "In our ateliers, for life", icon: <RulerIcon width={26} height={26} /> },
  { title: "Insured Shipping", body: "Across India & worldwide", icon: <TruckIcon width={26} height={26} /> },
  {
    title: "14-Day Returns",
    body: "On unaltered pieces",
    icon: (
      <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 12a8 8 0 1 0 2.3-5.6M4 4v4h4" />
      </svg>
    ),
  },
];

const CRAFT = [
  {
    title: "Hand Embroidery",
    body: "Zari, dabka and resham laid by hand by karigars in Lucknow and Jaipur — up to 180 hours in a single sherwani.",
    icon: <NeedleIcon width={28} height={28} />,
  },
  {
    title: "Fine Fabrics",
    body: "Raw Bhagalpur silk, Banarasi brocade from the handloom, Super 120s wool and Irish linen. Nothing less.",
    icon: (
      <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden>
        <path d="M4 5h16v14H4zM4 9h16M4 13h16M8 5v14M12 5v14M16 5v14" />
      </svg>
    ),
  },
  {
    title: "Tailored Fit",
    body: "Cut on a Savile Row block, finished to your measure. Complimentary alterations in our ateliers.",
    icon: <RulerIcon width={28} height={28} />,
  },
];

export default async function HomePage() {
  const [bestsellers, wedding] = await Promise.all([getBestsellers(10), getWeddingEdit()]);
  // Feature the first three wedding-edit pieces (admin controls this with the "wedding-edit" tag).
  const [weddingHero, ...weddingSide] = wedding;

  return (
    <>
      {/* ───────── Hero ───────── */}
      <section aria-labelledby="hero-title" className="on-dark relative overflow-hidden bg-brand-green text-ivory">
        <Jaali opacity={0.06} />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgb(31_58_46/0.9),transparent_65%)]"
        />
        <div className="relative mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10">
          <StitchIn className="relative px-4 py-14 text-center sm:py-20 lg:py-24">
            <span aria-hidden className="pointer-events-none absolute inset-0 border border-gold/50" />
            <span aria-hidden className="pointer-events-none absolute inset-2 border border-dashed border-gold/30 sm:inset-3" />
            <FourCorners className="h-16 w-16 sm:h-24 sm:w-24" animate />

            <div className="gold-shimmer mx-auto w-fit rounded-full">
              <SarpechEmblem
                tone="gold"
                stitch
                strokeWidth={1.8}
                className="h-40 w-40 animate-fade-up sm:h-56 sm:w-56"
                title="The SARPECH emblem — a jewelled turban ornament"
              />
            </div>
            <h1 id="hero-title" className="mt-8 animate-fade-up [animation-delay:150ms]">
              <span className="sr-only">SARPECH — </span>
              <span aria-hidden className="text-zari block font-display text-4xl font-semibold tracking-[0.3em] sm:text-6xl sm:tracking-[0.36em]">
                SARPECH
              </span>
              <span className="mt-4 block font-serif text-2xl font-normal normal-case italic tracking-normal text-ivory sm:text-3xl">
                {SITE.tagline}
              </span>
            </h1>
            <p className="eyebrow mt-4 animate-fade-up text-gold-light [animation-delay:300ms]">{SITE.secondary}</p>
            <div className="mt-10 flex animate-fade-up flex-col items-center justify-center gap-3 [animation-delay:450ms] sm:flex-row">
              <Link href="/shop" className="btn-royal btn-royal-gold min-w-60">
                Shop the Collection
              </Link>
              <Link href="/wedding-edit" className="btn-outline min-w-60">
                The Wedding Edit
              </Link>
            </div>
          </StitchIn>
        </div>
      </section>
      <ZariBorder />

      {/* ───────── Promise strip ───────── */}
      <section aria-label="The SARPECH promise" className="border-b border-mist">
        <ul className="mx-auto grid max-w-7xl grid-cols-2 gap-y-5 px-4 py-6 sm:px-6 md:grid-cols-4 lg:px-8">
          {PROMISES.map((p) => (
            <li key={p.title} className="flex items-center justify-center gap-3 text-center md:border-r md:border-mist md:last:border-r-0">
              <span aria-hidden className="text-gold-dark">
                {p.icon}
              </span>
              <span className="text-left">
                <span className="block font-display text-[0.66rem] uppercase tracking-[0.18em]">{p.title}</span>
                <span className="block text-[0.92rem] leading-snug text-ink-soft">{p.body}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* ───────── Shop by category ───────── */}
      <section aria-labelledby="cat-title" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <SectionTitle id="cat-title" eyebrow="The Wardrobe" title="Shop by Category" />
        <ul className="mt-12 grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3">
          {categories.map((c, i) => (
            <li key={c.slug} className={i === categories.length - 1 ? "col-span-2 md:col-span-1" : ""}>
              <Link
                href={`/shop/${c.slug}`}
                className="group stitch-frame relative flex aspect-[4/3] flex-col items-center justify-center overflow-hidden bg-pearl px-4 text-center shadow-card transition-shadow duration-300 hover:shadow-lift sm:aspect-[5/4]"
              >
                {c.image ? (
                  <Image src={c.image} alt="" fill sizes="(min-width:768px) 33vw, 50vw" className="object-cover transition-transform duration-700 group-hover:scale-105" />
                ) : (
                  <>
                    <Jaali opacity={0.09} size={48} />
                    <span aria-hidden className="absolute left-4 top-3 font-display text-xs tracking-[0.2em] text-gold-dark sm:left-5 sm:top-4">
                      {ROMAN[i]}
                    </span>
                    <SarpechEmblem tone="gold" ring={false} strokeWidth={2.6} className="relative h-12 w-12 transition-transform duration-500 group-hover:-translate-y-1 sm:h-16 sm:w-16" />
                  </>
                )}
                <div className={c.image ? "absolute inset-x-0 bottom-0 bg-gradient-to-t from-brand-green/85 to-transparent px-4 pb-4 pt-12 text-ivory" : "relative mt-3 sm:mt-4"}>
                  <h3 className="font-display text-[0.74rem] tracking-[0.18em] sm:text-base sm:tracking-[0.2em]">{c.name}</h3>
                  <span className={`mt-1 hidden text-[0.95rem] sm:block ${c.image ? "text-ivory/85" : "text-ink-soft"}`}>{c.short}</span>
                  <span
                    aria-hidden
                    className={`mt-2 inline-flex items-center gap-2 font-display text-[0.6rem] uppercase tracking-[0.24em] ${c.image ? "text-gold-light" : "text-gold-dark"}`}
                  >
                    <span className="h-px w-4 bg-current transition-all duration-500 group-hover:w-10" />
                    Explore
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* ───────── Shop by occasion ───────── */}
      <section aria-labelledby="occ-title" className="border-y border-mist bg-pearl">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <h2 id="occ-title" className="text-center text-lg sm:text-xl">
            Dress for the Occasion
          </h2>
          <ul className="no-scrollbar -mx-4 mt-8 flex snap-x gap-3 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:justify-center sm:overflow-visible sm:px-0">
            {OCCASIONS.map((o) => (
              <li key={o.value} className="shrink-0 snap-start">
                <Link
                  href={`/shop?occasion=${o.value}`}
                  className="group relative block border border-gold/60 bg-white px-6 py-3 font-display text-[0.7rem] uppercase tracking-[0.24em] transition-colors hover:border-brand-green hover:bg-brand-green hover:text-ivory"
                >
                  <span aria-hidden className="absolute inset-1 border border-dashed border-gold/40 transition-colors group-hover:border-gold/70" />
                  <span className="relative">{o.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ───────── Wedding edit feature ───────── */}
      <section aria-labelledby="wed-title" className="on-dark jaali-bg bg-brand-green text-ivory">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:px-8">
          <StitchIn className="relative px-6 py-12 sm:px-12">
            <span aria-hidden className="pointer-events-none absolute inset-0 border border-gold/40" />
            <FourCorners className="h-14 w-14" animate />
            <p className="eyebrow text-gold-light">The Royal Collection</p>
            <h2 id="wed-title" className="mt-4 text-3xl text-ivory sm:text-4xl">
              The Wedding Edit
            </h2>
            <p className="mt-5 text-xl leading-relaxed text-ivory/85">
              For the baraat, the pheras and the reception — sherwanis in raw silk and brocade, safas tied in the Rajput
              manner, and the sarpech that crowns them. Dressed as a groom was meant to be.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/wedding-edit" className="btn-royal btn-royal-gold">
                Explore the Edit
              </Link>
              <Link href="/contact" className="btn-outline">
                Book a Groom Fitting
              </Link>
            </div>
          </StitchIn>
          {weddingHero && (
          <div className="grid grid-cols-3 grid-rows-2 gap-4">
            <Link
              href={`/product/${weddingHero.slug}`}
              className="stitch-frame col-span-2 row-span-2 block bg-pearl p-4 shadow-lift"
              aria-label={weddingHero.name}
            >
              <ProductImage product={weddingHero} sizes="(min-width:1024px) 30vw, 66vw" />
            </Link>
            {weddingSide.slice(0, 2).map((p) => (
              <Link key={p.id} href={`/product/${p.slug}`} className="stitch-frame block bg-pearl p-2 shadow-lift" aria-label={p.name}>
                <ProductImage product={p} sizes="20vw" />
              </Link>
            ))}
          </div>
          )}
        </div>
      </section>

      {/* ───────── Bestsellers ───────── */}
      <section aria-labelledby="best-title" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <SectionTitle id="best-title" eyebrow="Most Coveted" title="Bestsellers" />
        <div className="mt-12">
          <ProductCarousel products={bestsellers} label="Bestsellers" />
        </div>
      </section>

      {/* ───────── Meaning of Sarpech ───────── */}
      <section aria-labelledby="meaning-title" className="border-y border-mist bg-white">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-20 sm:px-6 md:grid-cols-[auto_1fr] md:gap-16 lg:px-8">
          <EmbroideredFrame className="mx-auto p-10 sm:p-12" cornerClassName="h-12 w-12">
            <SarpechEmblem tone="green" stitch className="h-44 w-44 sm:h-52 sm:w-52" title="The sarpech ornament" />
          </EmbroideredFrame>
          <div>
            <p className="eyebrow text-ink-soft">
              सरपेच · <span lang="hi">Sarpech</span>
            </p>
            <h2 id="meaning-title" className="mt-3 text-2xl sm:text-3xl">
              The Meaning of Sarpech
            </h2>
            <p className="mt-5 text-xl leading-relaxed">
              A sarpech is the jewelled ornament pinned to the front of a king’s pagri — a plume of gold set with a ruby
              and hung with pearls. In the Mughal and Rajput courts it was worn only by rulers, and given by them as the
              highest mark of honour.
            </p>
            <blockquote className="mt-6 border-l-2 border-gold pl-5 text-2xl italic text-brand-green">
              “We make clothes worthy of the crown.”
            </blockquote>
            <Link href="/our-story" className="link-thread mt-8 inline-block font-display text-xs uppercase tracking-[0.24em]">
              Read our story →
            </Link>
          </div>
        </div>
      </section>

      {/* ───────── Craftsmanship ───────── */}
      <section aria-labelledby="craft-title" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <SectionTitle id="craft-title" eyebrow="The Atelier" title="Craftsmanship" />
        <ul className="mt-12 grid gap-6 md:grid-cols-3">
          {CRAFT.map((c) => (
            <li key={c.title} className="relative border border-mist px-8 py-10 text-center">
              <span className="mx-auto grid size-16 place-items-center rounded-full border border-gold text-brand-green">{c.icon}</span>
              <h3 className="mt-6 font-display text-sm tracking-[0.22em]">{c.title}</h3>
              <p className="mt-3 text-lg text-ink-soft">{c.body}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* ───────── Newsletter ───────── */}
      <section aria-labelledby="news-title" className="on-dark relative overflow-hidden bg-brand-green text-ivory">
        <Jaali opacity={0.07} />
        <div className="relative mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
          <SarpechEmblem tone="gold" ring={false} className="mx-auto h-14 w-14" />
          <h2 id="news-title" className="mt-4 text-2xl text-ivory sm:text-3xl">
            Join the Royal Court
          </h2>
          <p className="mt-3 text-xl text-ivory/85">
            Private previews, atelier stories and 10% off your first order. Letters, never noise.
          </p>
          <NewsletterForm />
          <Wordmark tone="gold" className="mt-12 text-sm opacity-80" />
        </div>
      </section>
    </>
  );
}
