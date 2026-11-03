import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmbroideredFrame } from "@/components/ornaments/EmbroideredFrame";
import { SectionDivider } from "@/components/ornaments/SectionDivider";
import { ProductCard } from "@/components/shop/ProductCard";
import { ProductImage } from "@/components/shop/ProductImage";
import { getAllProducts, getWeddingEdit } from "@/lib/catalog";
import type { Product } from "@/lib/types";

export const metadata: Metadata = {
  title: "The Wedding Edit",
  description:
    "A lookbook for the groom and his court — sherwanis, Jodhpuri suits, safas and sarpech brooches for the baraat, the pheras, the sangeet and the reception.",
};

const LOOKS: {
  id: string;
  chapter: string;
  title: string;
  hero: string;
  colour: string;
  copy: string;
  note: string;
  shop: string[];
}[] = [
  {
    id: "baraat",
    chapter: "Chapter I",
    title: "The Baraat",
    hero: "maharaja-ivory-sherwani",
    colour: "Ivory",
    copy:
      "The procession arrives with drums and torchlight. Ivory raw silk catches every flame; zari climbs the collar and placket the way gold leaf climbs a palace arch. Crown it with a red safa and a kundan sarpech.",
    note: "Raw silk · 180 hours of hand-laid zari",
    shop: ["maharaja-ivory-sherwani", "rajputana-safa", "kundan-sarpech-brooch", "shahi-zari-mojari"],
  },
  {
    id: "pheras",
    chapter: "Chapter II",
    title: "The Pheras",
    hero: "darbar-jodhpuri-suit",
    colour: "Ivory",
    copy:
      "Seven rounds of the sacred fire ask for something quieter. A Jodhpuri in ivory raw silk, zari only at the collar, lets the moment hold the light.",
    note: "Raw silk · zari collar · tailored trouser",
    shop: ["darbar-jodhpuri-suit", "mughal-paisley-stole", "darbar-churidar"],
  },
  {
    id: "sangeet",
    chapter: "Chapter III",
    title: "The Sangeet",
    hero: "mehfil-brocade-jacket",
    colour: "Onyx Black",
    copy:
      "Music, mehfil and late nights. A brocade Nehru jacket woven with antique-gold paisleys over a silk kurta set — easy to dance in, impossible to miss.",
    note: "Banarasi brocade · woven paisley",
    shop: ["mehfil-brocade-jacket", "pushkar-silk-kurta-set", "shahi-zari-mojari"],
  },
  {
    id: "reception",
    chapter: "Chapter IV",
    title: "The Reception",
    hero: "amber-mahal-reception-sherwani",
    colour: "Midnight Blue",
    copy:
      "The evening belongs to velvet. Midnight silk velvet drinks in the candlelight while antique zari paisleys glint at the collar and cuffs.",
    note: "Silk velvet · antique zari",
    shop: ["amber-mahal-reception-sherwani", "rajmahal-cufflinks", "mughal-paisley-stole"],
  },
];

function resolver(all: Product[]) {
  const bySlug = new Map(all.map((p) => [p.slug, p]));
  return (slugs: string[]) => slugs.map((s) => bySlug.get(s)).filter((p): p is Product => !!p);
}

export default async function WeddingEditPage() {
  const [all, catalog] = await Promise.all([getWeddingEdit(), getAllProducts()]);
  const resolve = resolver(catalog);

  return (
    <>
      <PageHeader
        tone="green"
        eyebrow="Lookbook · Season of Weddings"
        title="The Wedding Edit"
        intro={
          <p>
            Four chapters, one crown. Dressing the groom and his court for every ceremony — from the torchlit baraat to
            the last dance of the reception.
          </p>
        }
      >
        <nav aria-label="Chapters" className="mt-8">
          <ul className="flex flex-wrap justify-center gap-x-6 gap-y-2">
            {LOOKS.map((l) => (
              <li key={l.id}>
                <a href={`#${l.id}`} className="link-thread font-display text-xs uppercase tracking-[0.24em] text-gold-light">
                  {l.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </PageHeader>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {LOOKS.map((look, i) => {
          const [hero] = resolve([look.hero]);
          const shop = resolve(look.shop);
          const reversed = i % 2 === 1;
          return (
            <section key={look.id} id={look.id} aria-labelledby={`${look.id}-title`} className="scroll-mt-32 py-16 sm:py-24">
              <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
                <div className={reversed ? "lg:order-2" : ""}>
                  {hero && (
                    <EmbroideredFrame className="bg-pearl p-8 shadow-card sm:p-12">
                      <Link href={`/product/${hero.slug}`} className="mx-auto block aspect-[5/6] max-w-md">
                        <ProductImage product={hero} colorName={look.colour} sizes="(min-width: 1024px) 40vw, 90vw" />
                      </Link>
                    </EmbroideredFrame>
                  )}
                </div>
                <div className={reversed ? "lg:order-1" : ""}>
                  <p className="eyebrow text-ink-soft">{look.chapter}</p>
                  <h2 id={`${look.id}-title`} className="mt-3 text-3xl sm:text-4xl">
                    {look.title}
                  </h2>
                  <span aria-hidden className="mt-5 block h-px w-24 bg-gradient-to-r from-gold to-transparent" />
                  <p className="mt-6 max-w-xl text-xl leading-relaxed">{look.copy}</p>
                  <p className="mt-4 text-lg italic text-ink-soft">{look.note}</p>
                  {hero && (
                    <Link href={`/product/${hero.slug}`} className="btn-royal mt-8">
                      Discover the {hero.name.split(" ").slice(-1)[0]}
                    </Link>
                  )}
                </div>
              </div>

              <div className="mt-14">
                <h3 className="eyebrow text-center">Shop the Look</h3>
                <ul className="mt-6 flex flex-wrap justify-center gap-4 sm:gap-6">
                  {shop.map((p) => (
                    <li key={p.id} className="flex *:w-full w-[calc(50%-0.5rem)] sm:w-[calc(50%-0.75rem)] lg:w-[calc(25%-1.125rem)]">
                      <ProductCard product={p} />
                    </li>
                  ))}
                </ul>
              </div>
              {i < LOOKS.length - 1 && <SectionDivider className="mt-16 sm:mt-24" />}
            </section>
          );
        })}
      </div>

      <section aria-labelledby="all-wedding" className="border-t border-mist bg-white py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="eyebrow text-ink-soft">{all.length} pieces</p>
            <h2 id="all-wedding" className="mt-3 text-2xl sm:text-3xl">
              The Complete Wedding Edit
            </h2>
            <SectionDivider className="mt-6" size="sm" />
          </div>
          <ul className="mt-10 grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
            {all.map((p) => (
              <li key={p.id} className="flex">
                <ProductCard product={p} />
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section aria-labelledby="fitting-cta" className="on-dark jaali-bg bg-brand-green px-4 py-16 text-center text-ivory sm:py-20">
        <p className="eyebrow text-gold-light">For the groom and his court</p>
        <h2 id="fitting-cta" className="mt-3 text-2xl text-ivory sm:text-3xl">
          Book a Wedding Fitting
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-xl text-ivory/85">
          A private appointment at our Jaipur, Jodhpur or New Delhi atelier — or by video. Allow six to eight weeks for
          made-to-measure.
        </p>
        <Link href="/contact" className="btn-royal btn-royal-gold mt-8">
          Book a Fitting
        </Link>
      </section>
    </>
  );
}
