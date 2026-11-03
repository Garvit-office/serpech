"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { FourCorners } from "@/components/ornaments/CornerOrnament";
import { Dialog } from "@/components/ui/Dialog";
import { ChevronIcon, RulerIcon, TruckIcon } from "@/components/ui/icons";
import { QuantityStepper } from "@/components/ui/QuantityStepper";
import { HOW_TO_MEASURE, chartForCategory } from "@/data/size-guide";
import { LOW_STOCK, allSizesSoldOut, stockLeft } from "@/lib/catalog-shared";
import { formatINR } from "@/lib/format";
import { FIT_STYLES, MTM_SIZE, madeToMeasureAvailable, recommendSize, round1, toSnapshot } from "@/lib/fit";
import { useCatalog } from "@/lib/store/catalog";
import { useFit } from "@/lib/store/fit";
import { track } from "@/lib/track";
import { useCart } from "@/lib/store/cart";
import type { Product } from "@/lib/types";
import { Price } from "./Price";
import { ProductImage, productImages } from "./ProductImage";
import { SizeChart } from "./SizeChart";
import { WishlistButton } from "./WishlistButton";

export function ProductDetail({ product, categoryName }: { product: Product; categoryName: string }) {
  const cart = useCart();
  const router = useRouter();
  const { settings } = useCatalog();
  useEffect(() => {
    track("product_view", { slug: product.slug, category: product.category });
  }, [product.slug, product.category]);
  const [color, setColor] = useState(product.colors[0].name);
  const [size, setSize] = useState<string | null>(product.sizes.length === 1 && stockLeft(product, product.sizes[0]) !== 0 ? product.sizes[0] : null);
  const [qty, setQty] = useState(1);
  const [active, setActive] = useState(0);
  const [guideOpen, setGuideOpen] = useState(false);
  const [error, setError] = useState(false);
  const sizeLabelId = useId();
  const colorLabelId = useId();

  // Sticky mobile bar once the main buttons scroll out of view
  const actionsRef = useRef<HTMLDivElement>(null);
  const [showBar, setShowBar] = useState(false);
  useEffect(() => {
    const el = actionsRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([e]) => setShowBar(!e.isIntersecting && e.boundingClientRect.top < 0), { threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const images = productImages(product, color);
  const views = Math.max(1, images.length);

  // Royal Fit
  const fit = useFit();
  const mtmOK = madeToMeasureAvailable(product);
  const advice = fit.profile ? recommendSize(product, fit.profile) : null;
  const isMtm = size === MTM_SIZE;
  // Stock for the chosen standard size (null = not tracked).
  const left = size && !isMtm ? stockLeft(product, size) : null;
  const maxQty = left === null ? 10 : Math.max(1, Math.min(10, left));
  const soldOut = allSizesSoldOut(product) && !mtmOK;
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- keep quantity within what's left
    if (qty > maxQty) setQty(maxQty);
  }, [qty, maxQty]);
  const unitPrice = (product.salePrice ?? product.price) + (isMtm ? settings.madeToMeasureFee : 0);
  const openFit = (thenMtm = false) =>
    fit.openWizard({
      product,
      onChoose: (c) => {
        setError(false);
        if (c.madeToMeasure || thenMtm) setSize(MTM_SIZE);
        else if (c.size && stockLeft(product, c.size) !== 0) setSize(c.size);
      },
    });

  const commit = (thenCheckout: boolean) => {
    if (!size) {
      setError(true);
      document.getElementById(sizeLabelId)?.scrollIntoView({ block: "center", behavior: "smooth" });
      return;
    }
    if (size === MTM_SIZE && !fit.profile) return openFit(true);
    if (left === 0) return;
    cart.add(
      { productId: product.id, slug: product.slug, size, color, qty, ...(size === MTM_SIZE && fit.profile ? { fit: toSnapshot(fit.profile) } : {}) },
      { openDrawer: !thenCheckout },
    );
    if (thenCheckout) router.push("/checkout");
  };

  return (
    <div className="grid gap-10 lg:grid-cols-[1.15fr_1fr] lg:gap-16">
      {/* ───────── Gallery ───────── */}
      <section aria-label="Product images" className="lg:sticky lg:top-32 lg:self-start">
        <div className="relative bg-pearl p-3 shadow-card sm:p-4">
          <FourCorners className="z-[2] h-12 w-12 sm:h-16 sm:w-16" />
          <div className="relative aspect-[5/6] overflow-hidden">
            <ProductImage
              key={`${color}-${active}`}
              product={product}
              colorName={color}
              index={active}
              priority
              sizes="(min-width: 1024px) 55vw, 100vw"
              className="h-full w-full animate-fade-up"
            />
          </div>
        </div>
        {views > 1 && (
          <ul className="mt-4 grid grid-cols-4 gap-3" aria-label="Choose view">
            {Array.from({ length: views }, (_, i) => (
              <li key={i}>
                <button
                  type="button"
                  onClick={() => setActive(i)}
                  aria-label={`View image ${i + 1} of ${views}`}
                  aria-current={active === i}
                  className={`block aspect-[5/6] w-full overflow-hidden bg-pearl outline-offset-2 transition ${
                    active === i ? "ring-1 ring-gold ring-offset-2" : "opacity-75 hover:opacity-100"
                  }`}
                >
                  <ProductImage product={product} colorName={color} index={i} sizes="120px" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ───────── Purchase panel ───────── */}
      <section aria-labelledby="product-title">
        <p className="eyebrow text-ink-soft">
          {categoryName}
          {product.subcategory ? ` · ${product.subcategory}` : ""}
        </p>
        <h1 id="product-title" className="mt-3 text-2xl leading-snug sm:text-3xl">
          {product.name}
        </h1>
        <div className="mt-3">
          <Price product={product} size="lg" />
          <p className="text-base text-ink-soft">
            Inclusive of all taxes{isMtm ? ` · Made to measure +${formatINR(settings.madeToMeasureFee)} (${formatINR(unitPrice)} total)` : ""}
          </p>
        </div>
        <p className="mt-5 text-xl leading-relaxed">{product.description}</p>

        {/* Colour */}
        <fieldset className="mt-8">
          <legend id={colorLabelId} className="eyebrow">
            Colour · <span className="normal-case tracking-normal font-serif text-base">{color}</span>
          </legend>
          <div className="mt-3 flex flex-wrap gap-3" role="radiogroup" aria-labelledby={colorLabelId}>
            {product.colors.map((c) => {
              const on = c.name === color;
              return (
                <button
                  key={c.name}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  aria-label={c.name}
                  title={c.name}
                  onClick={() => {
                    setColor(c.name);
                    setActive(0);
                  }}
                  className={`grid size-11 place-items-center rounded-full border transition ${
                    on ? "border-gold-dark ring-1 ring-gold-dark" : "border-transparent hover:border-mist"
                  }`}
                >
                  <span className="size-8 rounded-full border border-brand-green/20" style={{ background: c.hex }} />
                </button>
              );
            })}
          </div>
        </fieldset>

        {/* Size */}
        <fieldset className="mt-8">
          <div className="flex items-baseline justify-between">
            <legend id={sizeLabelId} className="eyebrow">
              Size{size ? <span className="font-serif text-base normal-case tracking-normal"> · {size}</span> : null}
            </legend>
            <button type="button" onClick={() => setGuideOpen(true)} className="link-thread inline-flex items-center gap-1.5 text-base">
              <RulerIcon /> Size guide
            </button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2" role="radiogroup" aria-labelledby={sizeLabelId} aria-describedby={error ? `${sizeLabelId}-err` : undefined}>
            {product.sizes.map((s) => {
              const on = s === size;
              const yours = advice?.size === s;
              const out = stockLeft(product, s) === 0;
              return (
                <button
                  key={s}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  disabled={out}
                  aria-label={out ? `${s} — sold out` : yours ? `${s} — your Royal Fit` : undefined}
                  title={out ? "Sold out" : undefined}
                  onClick={() => {
                    setSize(s);
                    setError(false);
                  }}
                  className={`relative min-h-12 min-w-14 border px-3 font-display text-xs tracking-[0.1em] transition ${
                    out
                      ? "cursor-not-allowed border-mist text-ink-soft/60 line-through"
                      : on
                        ? "border-brand-green bg-brand-green text-ivory"
                        : yours
                          ? "border-gold-dark ring-1 ring-gold"
                          : "border-brand-green/30 hover:border-brand-green"
                  }`}
                >
                  {s}
                  {yours && (
                    <span aria-hidden className="absolute -top-2 left-1/2 -translate-x-1/2 whitespace-nowrap bg-gold-light px-1.5 font-display text-[0.5rem] uppercase tracking-[0.14em] text-brand-green">
                      Your fit
                    </span>
                  )}
                </button>
              );
            })}
            {mtmOK && (
              <button
                type="button"
                role="radio"
                aria-checked={isMtm}
                onClick={() => {
                  setError(false);
                  if (!fit.profile) openFit(true);
                  else setSize(MTM_SIZE);
                }}
                className={`relative min-h-12 border px-4 text-left transition ${
                  isMtm ? "border-brand-green bg-brand-green text-ivory" : "border-dashed border-gold-dark hover:border-brand-green"
                }`}
              >
                <span className="block font-display text-[0.66rem] uppercase tracking-[0.14em]">Made to Measure</span>
                <span className={`block text-sm leading-tight ${isMtm ? "text-ivory/80" : "text-ink-soft"}`}>+{formatINR(settings.madeToMeasureFee)}</span>
              </button>
            )}
          </div>

          {/* Royal Fit panel */}
          <div className="mt-4 flex items-start gap-3 border border-gold/50 bg-pearl px-4 py-3">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" aria-hidden className="mt-0.5 shrink-0 text-gold-dark">
              <path d="M3 8h3.5L8 5.5h8L17.5 8H21v11H3z" />
              <circle cx="12" cy="13" r="3.6" />
            </svg>
            <div className="min-w-0 flex-1 text-base">
              {isMtm && fit.profile ? (
                <>
                  <p>
                    <strong className="font-semibold">Tailored to your Royal Fit</strong> ·{" "}
                    {FIT_STYLES.find((f) => f.value === fit.profile!.preferences.fit)!.label}
                  </p>
                  <p className="text-ink-soft">
                    Chest {round1(fit.profile.measurements.chest)} · Waist {round1(fit.profile.measurements.waist)} · Shoulder{" "}
                    {round1(fit.profile.measurements.shoulder)} · Sleeve {round1(fit.profile.measurements.sleeve)} cm · about{" "}
                    {settings.madeToMeasureDays} extra days
                  </p>
                </>
              ) : advice ? (
                <>
                  <p>
                    <strong className="font-semibold">Your Royal Fit{advice.size ? `: ${advice.size}` : ""}</strong> ·{" "}
                    {FIT_STYLES.find((f) => f.value === fit.profile!.preferences.fit)!.label}
                  </p>
                  <p className="text-ink-soft">
                    {advice.reason}
                    {advice.suggestMadeToMeasure && mtmOK ? " Made to measure is recommended." : ""}
                  </p>
                </>
              ) : (
                <>
                  <p>
                    <strong className="font-semibold">Find your Royal Fit</strong>
                  </p>
                  <p className="text-ink-soft">A 20-second camera Fit Check, or your measurements — then choose slim, regular or a little baggy.</p>
                </>
              )}
            </div>
            <button type="button" onClick={() => openFit()} className="link-thread shrink-0 font-display text-[0.62rem] uppercase tracking-[0.18em]">
              {fit.profile ? "Edit" : "Start"}
            </button>
          </div>
          {error && (
            <p id={`${sizeLabelId}-err`} role="alert" className="mt-2 text-base text-ruby">
              Please choose a size.
            </p>
          )}
          {left !== null && left > 0 && left <= LOW_STOCK && (
            <p role="status" className="mt-2 text-base text-ruby">
              Only {left} left in size {size}.
            </p>
          )}
          {soldOut && (
            <p role="status" className="mt-2 text-base text-ruby">
              This piece is sold out in every size.{" "}
              <Link href="/contact" className="underline underline-offset-4">
                Ask about a restock
              </Link>
            </p>
          )}
        </fieldset>

        {/* Quantity + actions */}
        <div className="mt-8 flex flex-wrap items-center gap-4">
          <QuantityStepper value={qty} onChange={setQty} max={maxQty} />
          <WishlistButton slug={product.slug} name={product.name} />
        </div>
        <div ref={actionsRef} className="mt-5 grid gap-3 sm:grid-cols-2">
          <button type="button" onClick={() => commit(false)} disabled={soldOut} className="btn-royal w-full">
            {soldOut ? "Sold Out" : "Add to Cart"}
          </button>
          <button type="button" onClick={() => commit(true)} disabled={soldOut} className="btn-outline w-full disabled:cursor-not-allowed disabled:opacity-50">
            Buy Now
          </button>
        </div>
        <p className="mt-4 flex items-center gap-2 text-base text-ink-soft">
          <TruckIcon /> Complimentary insured shipping above {formatINR(settings.freeShippingThreshold)} · Dispatched in 3–5 days
        </p>

        {/* Accordions */}
        <div className="mt-10 border-t border-mist">
          <Accordion title="Details" defaultOpen>
            <ul className="list-none space-y-1.5">
              {product.details.map((d) => (
                <li key={d} className="flex gap-3">
                  <span aria-hidden className="mt-2.5 size-1.5 shrink-0 rotate-45 border border-gold-dark" />
                  {d}
                </li>
              ))}
            </ul>
          </Accordion>
          <Accordion title="Fabric & Care">
            <p>
              <strong className="font-semibold">Fabric:</strong> {product.fabric}
            </p>
            <ul className="mt-3 space-y-1.5">
              {product.care.map((c) => (
                <li key={c} className="flex gap-3">
                  <span aria-hidden className="mt-2.5 size-1.5 shrink-0 rotate-45 border border-gold-dark" />
                  {c}
                </li>
              ))}
            </ul>
          </Accordion>
          <Accordion title="Shipping & Returns">
            <p>
              Complimentary insured shipping across India on orders above {formatINR(settings.freeShippingThreshold)};{" "}
              {formatINR(settings.standardShipping)} otherwise. Returns and exchanges within 14 days on unaltered pieces.{" "}
              <Link href="/shipping-returns" className="underline decoration-gold underline-offset-4">
                Read the policy
              </Link>
              .
            </p>
          </Accordion>
          <Accordion title="Book a Fitting">
            <p>
              Try the piece in our Jaipur, Jodhpur or New Delhi ateliers, or on a video fitting with our master tailor.{" "}
              <Link href="/contact" className="underline decoration-gold underline-offset-4">
                Book an appointment
              </Link>
              .
            </p>
          </Accordion>
        </div>
      </section>

      <div
        aria-hidden={!showBar}
        inert={!showBar}
        className={`fixed inset-x-0 bottom-0 z-30 border-t border-gold/40 bg-white px-4 py-3 shadow-lift transition-transform duration-300 lg:hidden ${
          showBar ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-[0.68rem] uppercase tracking-[0.14em]">{product.name}</p>
            <p className="text-base">
              {formatINR(unitPrice)}
              {size ? <span className="text-ink-soft"> · {isMtm ? "Made to measure" : `Size ${size}`}</span> : null}
            </p>
          </div>
          <button type="button" onClick={() => commit(false)} disabled={soldOut} className="btn-royal min-h-11 shrink-0 px-5 py-2">
            {soldOut ? "Sold Out" : size ? "Add to Cart" : "Choose Size"}
          </button>
        </div>
      </div>

      <Dialog open={guideOpen} onClose={() => setGuideOpen(false)} label="Size guide" variant="center">
        <div className="p-6 sm:p-8">
          <h2 className="pr-10 text-xl">Size Guide</h2>
          <div className="mt-6">
            <SizeChart chart={chartForCategory(product.category, product.sizes)} />
          </div>
          <h3 className="mt-8 font-display text-sm tracking-[0.2em]">How to measure</h3>
          <dl className="mt-3 grid gap-3 sm:grid-cols-2">
            {HOW_TO_MEASURE.map((m) => (
              <div key={m.part}>
                <dt className="font-semibold">{m.part}</dt>
                <dd className="text-ink-soft">{m.how}</dd>
              </div>
            ))}
          </dl>
          <Link href="/size-guide" className="link-thread mt-6 inline-block font-display text-xs uppercase tracking-[0.2em]">
            Full size guide →
          </Link>
        </div>
      </Dialog>
    </div>
  );
}

function Accordion({ title, children, defaultOpen = false }: { title: string; children: ReactNode; defaultOpen?: boolean }) {
  return (
    <details open={defaultOpen} className="group border-b border-mist">
      <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between font-display text-[0.75rem] uppercase tracking-[0.22em] [&::-webkit-details-marker]:hidden">
        {title}
        <ChevronIcon className="text-gold-dark transition-transform group-open:rotate-180" />
      </summary>
      <div className="pb-5 text-lg leading-relaxed">{children}</div>
    </details>
  );
}
