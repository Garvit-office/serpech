"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  BUTTONS,
  COLLAR_LABEL,
  DESIGN_DAYS,
  DESIGN_LOOKS,
  DESIGN_PRODUCT_ID,
  EMBROIDERY,
  FABRIC_COLORS,
  GARMENTS,
  LENGTH_LABEL,
  PATTERNS,
  SLEEVE_LABEL,
  ZONES,
  changeGarment,
  defaultDesign,
  designKey,
  designPrice,
  designSlug,
  designSummary,
  fabricLabel,
  garmentDef,
  type DesignSpec,
  type Fabric,
  type GarmentKind,
  type PatternAngle,
  type Zone,
} from "@sarpech/core/designer";
import { MTM_SIZE, toSnapshot } from "@sarpech/core/fit";
import { formatINR } from "@sarpech/core/format";
import { CheckIcon } from "@/components/ui/icons";
import { QuantityStepper } from "@/components/ui/QuantityStepper";
import { useCart } from "@/lib/store/cart";
import { useSavedDesigns } from "@/lib/store/designs";
import { useFit } from "@/lib/store/fit";
import { DesignArt, FabricSwatch } from "./DesignArt";

type Tab = "fabric" | "style" | "order";
const sameFabric = (a: Fabric, b: Fabric) => fabricLabel(a) === fabricLabel(b);

/**
 * Design Studio: customers compose a shirt, polo, kurta or sherwani — garment,
 * fabric per zone (colour, pattern, scale, angle), and style — see it drawn live,
 * and add it to the bag. Prices come from @sarpech/core/designer and are
 * recomputed by the server at checkout.
 */
export function DesignStudio() {
  const cart = useCart();
  const fit = useFit();
  const saved = useSavedDesigns();
  const [spec, setSpec] = useState<DesignSpec>(() => DESIGN_LOOKS[0].spec);
  const [zone, setZone] = useState<Zone>("body");
  const [tab, setTab] = useState<Tab>("fabric");
  const [size, setSize] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [sizeError, setSizeError] = useState(false);

  const g = garmentDef(spec.garment);
  const price = useMemo(() => designPrice(spec), [spec]);
  const zones = ZONES.filter((z) => z.key !== "collar" || spec.options.collar !== "round");
  const current = spec.fabrics[zone];
  const linked = zone !== "body" && sameFabric(current, spec.fabrics.body);

  const update = (next: DesignSpec) => {
    setSpec(next);
    setNotice(null);
  };
  const setFabric = (patch: Partial<Fabric>) => {
    const nextFabric = { ...current, ...patch };
    const fabrics = { ...spec.fabrics, [zone]: nextFabric };
    // Editing the body carries along every zone that still matches it.
    if (zone === "body") for (const z of ZONES) if (z.key !== "body" && sameFabric(spec.fabrics[z.key], spec.fabrics.body)) fabrics[z.key] = { ...nextFabric };
    update({ ...spec, fabrics });
  };
  const setOption = <K extends keyof DesignSpec["options"]>(k: K, v: DesignSpec["options"][K]) => update({ ...spec, options: { ...spec.options, [k]: v } });
  const pickGarment = (k: GarmentKind) => {
    update(changeGarment(spec, k));
    setSize(null);
    if (k !== spec.garment && zone === "collar") setZone("body");
  };
  const loadDesign = (s: DesignSpec, id: string | null = null) => {
    update(s);
    setSavedId(id);
    setSize(null);
    setZone("body");
  };

  const addToBag = () => {
    if (!size) {
      setSizeError(true);
      setTab("order");
      return;
    }
    if (size === MTM_SIZE && !fit.profile) return fit.openWizard();
    cart.add(
      {
        productId: DESIGN_PRODUCT_ID,
        slug: designSlug(spec.garment),
        size,
        color: designKey(spec),
        qty,
        design: spec,
        ...(size === MTM_SIZE && fit.profile ? { fit: toSnapshot(fit.profile) } : {}),
      },
      { openDrawer: true },
    );
  };

  const save = () => {
    const id = saved.save(spec, savedId ?? undefined);
    setSavedId(id);
    setNotice("Design saved on this device.");
  };

  return (
    <div className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
      {/* Garment */}
      <div role="radiogroup" aria-label="Garment" className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 py-6 sm:mx-0 sm:grid sm:grid-cols-4 sm:px-0">
        {GARMENTS.map((x) => {
          const on = x.kind === spec.garment;
          return (
            <button
              key={x.kind}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => pickGarment(x.kind)}
              className={`group flex w-40 shrink-0 flex-col items-center border bg-white p-3 text-center transition sm:w-auto ${
                on ? "border-brand-green ring-1 ring-brand-green" : "border-mist hover:border-gold"
              }`}
            >
              <DesignArt spec={changeGarment(spec, x.kind)} className="h-24 w-auto transition-transform duration-300 group-hover:-translate-y-0.5" title={x.label} />
              <span className="mt-2 font-display text-[0.68rem] uppercase tracking-[0.18em]">{x.label}</span>
              <span className="text-sm text-ink-soft">from {formatINR(x.basePrice)}</span>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-12">
        {/* Preview */}
        <section aria-label="Your design" className="lg:sticky lg:top-32 lg:self-start">
          <div className="relative overflow-hidden border border-mist bg-[radial-gradient(ellipse_at_50%_35%,#fffdf9,#f3eee3)] p-4 shadow-card sm:p-6">
            <span aria-hidden className="pointer-events-none absolute inset-2 border border-dashed border-gold/40" />
            <div key={spec.garment} className="animate-fade-up">
              <DesignArt spec={spec} title={`Your ${g.label.toLowerCase()} design`} className="mx-auto h-[min(60vh,30rem)] w-auto max-w-full" />
            </div>
          </div>
          <div className="mt-4 flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="font-display text-[0.72rem] uppercase tracking-[0.18em]">{spec.name || `Custom ${g.label}`}</p>
              <p className="mt-0.5 text-base text-ink-soft">{designSummary(spec)}</p>
            </div>
            <p className="shrink-0 font-display text-xl">{formatINR(price.total)}</p>
          </div>
          <details className="mt-2 text-base text-ink-soft">
            <summary className="cursor-pointer select-none">Price breakdown</summary>
            <ul className="mt-2 space-y-1">
              {price.lines.map((l) => (
                <li key={l.label} className="flex justify-between gap-4">
                  <span>{l.label}</span>
                  <span>{formatINR(l.amount)}</span>
                </li>
              ))}
            </ul>
          </details>
        </section>

        {/* Controls */}
        <section aria-label="Design controls">
          <div className="mb-6">
            <p className="eyebrow text-[0.62rem] text-ink-soft">Start from a look</p>
            <div className="no-scrollbar -mx-4 mt-2 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
              {DESIGN_LOOKS.map((l) => (
                <button key={l.title} type="button" onClick={() => loadDesign(l.spec)} title={l.note} className="shrink-0 border border-mist bg-white px-3 py-2 text-left transition hover:border-gold">
                  <span className="block font-display text-[0.62rem] uppercase tracking-[0.16em]">{l.title}</span>
                  <span className="block text-sm text-ink-soft">{l.note}</span>
                </button>
              ))}
            </div>
          </div>

          <div role="tablist" aria-label="Design steps" className="flex border-b border-mist">
            {(
              [
                ["fabric", "1 · Fabric"],
                ["style", "2 · Style"],
                ["order", "3 · Size & order"],
              ] as const
            ).map(([k, label]) => (
              <button
                key={k}
                type="button"
                role="tab"
                aria-selected={tab === k}
                onClick={() => setTab(k)}
                className="relative flex-1 px-2 py-3 font-display text-[0.64rem] uppercase tracking-[0.18em] text-ink-soft transition-colors aria-selected:text-brand-green aria-selected:after:absolute aria-selected:after:inset-x-3 aria-selected:after:bottom-0 aria-selected:after:h-0.5 aria-selected:after:bg-gold"
              >
                {label}
              </button>
            ))}
          </div>

          <div className="pt-6">
            {tab === "fabric" && (
              <div className="space-y-7">
                <Group label="Part of the garment">
                  <div className="flex flex-wrap gap-2">
                    {zones.map((z) => (
                      <Chip key={z.key} on={zone === z.key} onClick={() => setZone(z.key)}>
                        {z.label}
                      </Chip>
                    ))}
                  </div>
                  {zone !== "body" && (
                    <label className="mt-3 flex items-center gap-3 text-[1.02rem]">
                      <input
                        type="checkbox"
                        checked={linked}
                        onChange={(e) => update({ ...spec, fabrics: { ...spec.fabrics, [zone]: e.target.checked ? { ...spec.fabrics.body } : { ...current, color: current.color === "#F7F4EC" ? "#17191A" : "#F7F4EC", pattern: "solid" } } })}
                        className="size-4 accent-brand-green"
                      />
                      Same fabric as the body {linked ? "" : "(contrast panel)"}
                    </label>
                  )}
                </Group>

                <Group label={`Colour · ${FABRIC_COLORS.find((c) => c.hex === current.color)?.name ?? current.color}`}>
                  <Swatches value={current.color} onPick={(hex) => setFabric({ color: hex })} />
                </Group>

                <Group label={`Pattern · ${PATTERNS.find((p) => p.key === current.pattern)?.note}`}>
                  <div className="grid grid-cols-5 gap-2">
                    {PATTERNS.map((p) => {
                      const on = p.key === current.pattern;
                      return (
                        <button
                          key={p.key}
                          type="button"
                          aria-pressed={on}
                          onClick={() => setFabric({ pattern: p.key })}
                          className={`group flex flex-col items-center gap-1 border p-1.5 transition ${on ? "border-brand-green ring-1 ring-brand-green" : "border-mist hover:border-gold"}`}
                        >
                          <FabricSwatch fabric={{ ...current, pattern: p.key }} className="aspect-square w-full" />
                          <span className="text-[0.8rem] leading-tight">{p.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </Group>

                {current.pattern !== "solid" && (
                  <>
                    <Group label={`Pattern colour · ${FABRIC_COLORS.find((c) => c.hex === current.accent)?.name ?? current.accent}`}>
                      <Swatches value={current.accent} onPick={(hex) => setFabric({ accent: hex })} />
                    </Group>
                    <div className="grid gap-6 sm:grid-cols-2">
                      <Group label={`Pattern size · ${current.scale.toFixed(1)}×`}>
                        <input
                          type="range"
                          min={0.6}
                          max={1.6}
                          step={0.1}
                          value={current.scale}
                          onChange={(e) => setFabric({ scale: Number(e.target.value) })}
                          aria-label="Pattern size"
                          className="w-full accent-brand-green"
                        />
                        <div className="flex justify-between text-sm text-ink-soft">
                          <span>Fine</span>
                          <span>Bold</span>
                        </div>
                      </Group>
                      <Group label="Direction">
                        <div className="flex flex-wrap gap-2">
                          {([0, 45, 90, 135] as PatternAngle[]).map((a) => (
                            <Chip key={a} on={current.angle === a} onClick={() => setFabric({ angle: a })}>
                              <span aria-hidden className="inline-block h-3 w-px bg-current" style={{ transform: `rotate(${a}deg)` }} />
                              <span className="sr-only">{a} degrees</span>
                              {a}°
                            </Chip>
                          ))}
                        </div>
                      </Group>
                    </div>
                  </>
                )}
              </div>
            )}

            {tab === "style" && (
              <div className="space-y-7">
                {g.sleeves.length > 1 && (
                  <Group label="Sleeves">
                    <div className="flex flex-wrap gap-2">
                      {g.sleeves.map((s) => (
                        <Chip key={s} on={spec.options.sleeve === s} onClick={() => setOption("sleeve", s)}>
                          {SLEEVE_LABEL[s]}
                        </Chip>
                      ))}
                    </div>
                  </Group>
                )}
                {g.collars.length > 1 && (
                  <Group label="Collar">
                    <div className="flex flex-wrap gap-2">
                      {g.collars.map((c) => (
                        <Chip key={c} on={spec.options.collar === c} onClick={() => setOption("collar", c)}>
                          {COLLAR_LABEL[c]}
                        </Chip>
                      ))}
                    </div>
                  </Group>
                )}
                {g.lengths.length > 1 && (
                  <Group label="Length">
                    <div className="flex flex-wrap gap-2">
                      {g.lengths.map((l) => (
                        <Chip key={l} on={spec.options.length === l} onClick={() => setOption("length", l)}>
                          {LENGTH_LABEL[l]}
                        </Chip>
                      ))}
                    </div>
                  </Group>
                )}
                <Group label="Buttons">
                  <div className="flex flex-wrap gap-2">
                    {BUTTONS.map((b) => (
                      <Chip key={b.key} on={spec.options.buttons === b.key} onClick={() => setOption("buttons", b.key)}>
                        <span aria-hidden className="size-4 rounded-full border border-brand-green/30" style={{ background: b.hex ?? spec.fabrics.trim.color }} />
                        {b.label}
                      </Chip>
                    ))}
                  </div>
                </Group>
                {g.embroidery.length > 1 && (
                  <Group label="Embroidery">
                    <div className="grid gap-2 sm:grid-cols-2">
                      {EMBROIDERY.filter((e) => g.embroidery.includes(e.key)).map((e) => {
                        const on = spec.options.embroidery === e.key;
                        const extra = designPrice({ ...spec, options: { ...spec.options, embroidery: e.key } }).total - designPrice({ ...spec, options: { ...spec.options, embroidery: "none" } }).total;
                        return (
                          <button
                            key={e.key}
                            type="button"
                            aria-pressed={on}
                            onClick={() => setOption("embroidery", e.key)}
                            className={`border px-4 py-3 text-left transition ${on ? "border-brand-green bg-pearl ring-1 ring-brand-green" : "border-mist hover:border-gold"}`}
                          >
                            <span className="flex justify-between gap-2 font-display text-[0.66rem] uppercase tracking-[0.16em]">
                              {e.label}
                              {extra > 0 && <span className="text-gold-dark">+{formatINR(extra)}</span>}
                            </span>
                            <span className="text-sm text-ink-soft">{e.note}</span>
                          </button>
                        );
                      })}
                    </div>
                  </Group>
                )}
                {g.pocket && (
                  <label className="flex items-center gap-3 text-[1.02rem]">
                    <input type="checkbox" checked={spec.options.pocket} onChange={(e) => setOption("pocket", e.target.checked)} className="size-4 accent-brand-green" />
                    Chest pocket
                  </label>
                )}
              </div>
            )}

            {tab === "order" && (
              <div className="space-y-7">
                <Group label="Name your design (optional)">
                  <input
                    value={spec.name}
                    maxLength={40}
                    onChange={(e) => update({ ...spec, name: e.target.value })}
                    placeholder="e.g. Sangeet kurta"
                    className="field"
                  />
                </Group>
                <Group label="Size">
                  <div role="radiogroup" aria-label="Size" className="flex flex-wrap gap-2">
                    {g.sizes.map((s) => (
                      <Chip
                        key={s}
                        on={size === s}
                        onClick={() => {
                          setSize(s);
                          setSizeError(false);
                        }}
                      >
                        {s}
                      </Chip>
                    ))}
                    <Chip
                      on={size === MTM_SIZE}
                      onClick={() => {
                        setSizeError(false);
                        if (!fit.profile) fit.openWizard();
                        else setSize(MTM_SIZE);
                      }}
                    >
                      Royal Fit · made to measure
                    </Chip>
                  </div>
                  <p className="mt-2 text-sm text-ink-soft">
                    {fit.profile
                      ? "Your saved Royal Fit measurements are included at no extra cost."
                      : "No measurements yet? Choose Royal Fit to measure with your camera or a tape — included at no extra cost."}
                  </p>
                  {sizeError && (
                    <p role="alert" className="mt-2 text-base text-ruby">
                      Please choose a size.
                    </p>
                  )}
                </Group>
                <Group label="Quantity">
                  <QuantityStepper value={qty} onChange={setQty} />
                </Group>
                <p className="border-l-2 border-gold pl-3 text-base text-ink-soft">
                  Made to order in our atelier and dispatched in about {DESIGN_DAYS} working days. Our master tailor reviews every design before the
                  cloth is cut.
                </p>
              </div>
            )}
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-[1fr_auto]">
            <button type="button" onClick={addToBag} className="btn-royal w-full">
              Add to bag · {formatINR(price.total * qty)}
            </button>
            <button type="button" onClick={save} className="btn-outline">
              {savedId ? "Update saved design" : "Save design"}
            </button>
          </div>
          {notice && (
            <p role="status" className="mt-3 flex items-center gap-2 text-base text-[#1F5B45]">
              <CheckIcon /> {notice}
            </p>
          )}
          <button type="button" onClick={() => loadDesign(defaultDesign(spec.garment))} className="link-thread mt-4 text-base text-ink-soft">
            Start this {g.label.toLowerCase()} again
          </button>

          {saved.designs.length > 0 && (
            <div className="mt-10 border-t border-mist pt-6">
              <p className="eyebrow text-[0.62rem] text-ink-soft">Your saved designs</p>
              <ul className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-4">
                {saved.designs.map((d) => (
                  <li key={d.id} className="relative">
                    <button type="button" onClick={() => loadDesign(d.spec, d.id)} className="block w-full border border-mist bg-white p-2 text-left hover:border-gold">
                      <DesignArt spec={d.spec} className="mx-auto h-24 w-auto" />
                      <span className="mt-1 block truncate font-display text-[0.58rem] uppercase tracking-[0.14em]">{d.spec.name || garmentDef(d.spec.garment).label}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        saved.remove(d.id);
                        if (savedId === d.id) setSavedId(null);
                      }}
                      aria-label={`Delete saved design ${d.spec.name || garmentDef(d.spec.garment).label}`}
                      className="absolute right-1 top-1 grid size-6 place-items-center bg-white/90 text-ink-soft hover:text-ruby"
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function Group({ label, children }: { label: string; children: ReactNode }) {
  return (
    <fieldset className="min-w-0">
      <legend className="field-label">{label}</legend>
      <div className="mt-2">{children}</div>
    </fieldset>
  );
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={`inline-flex min-h-11 items-center gap-2 border px-4 font-display text-[0.64rem] uppercase tracking-[0.14em] transition ${
        on ? "border-brand-green bg-brand-green text-ivory" : "border-brand-green/30 hover:border-brand-green"
      }`}
    >
      {children}
    </button>
  );
}

function Swatches({ value, onPick }: { value: string; onPick: (hex: string) => void }) {
  return (
    <div className="grid grid-cols-10 gap-2">
      {FABRIC_COLORS.map((c) => {
        const on = c.hex.toUpperCase() === value.toUpperCase();
        return (
          <button
            key={c.hex}
            type="button"
            aria-pressed={on}
            aria-label={c.name}
            title={c.name}
            onClick={() => onPick(c.hex)}
            className={`grid aspect-square place-items-center rounded-full border transition ${on ? "border-brand-green ring-2 ring-gold ring-offset-1" : "border-brand-green/20 hover:scale-105"}`}
            style={{ background: c.hex }}
          >
            {on && <span className="size-1.5 rounded-full bg-white mix-blend-difference" />}
          </button>
        );
      })}
    </div>
  );
}
