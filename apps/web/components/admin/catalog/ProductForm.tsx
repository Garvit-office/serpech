"use client";

import { useRouter } from "next/navigation";
import { createContext, useContext, useId, useMemo, useState, useTransition, type ReactNode } from "react";
import { saveProductAction } from "@/app/admin/(panel)/products/actions";
import { categories } from "@sarpech/core/categories";
import { madeToMeasureAvailable } from "@sarpech/core/fit";
import type { ProductInput } from "@sarpech/backend/products";
import type { CategorySlug, Occasion, ProductColor, ProductTag } from "@sarpech/core/types";
import { ImageUploader } from "./ImageUploader";
import { slugify } from "./status";

const SIZE_PRESETS: { label: string; sizes: string[] }[] = [
  { label: "Chest 36–46", sizes: ["36", "38", "40", "42", "44", "46"] },
  { label: "S–XXL", sizes: ["S", "M", "L", "XL", "XXL"] },
  { label: "Waist 30–40", sizes: ["30", "32", "34", "36", "38", "40"] },
  { label: "UK 6–11", sizes: ["UK 6", "UK 7", "UK 8", "UK 9", "UK 10", "UK 11"] },
  { label: "One Size", sizes: ["One Size"] },
];

const PRESET_FOR: Record<CategorySlug, number> = {
  sherwanis: 0,
  bandhgalas: 0,
  kurtas: 1,
  "nehru-jackets": 1,
  shirts: 1,
  polos: 1,
  "t-shirts": 1,
  trousers: 2,
  accessories: 4,
};

const TAGS: { value: ProductTag; label: string }[] = [
  { value: "new", label: "New arrival" },
  { value: "bestseller", label: "Bestseller (home carousel)" },
  { value: "wedding-edit", label: "Wedding Edit" },
];

const OCCASIONS: { value: Occasion; label: string }[] = [
  { value: "wedding", label: "Wedding" },
  { value: "reception", label: "Reception" },
  { value: "festive", label: "Festive" },
  { value: "workwear", label: "Workwear" },
  { value: "everyday", label: "Everyday" },
  { value: "travel", label: "Travel" },
];

export const EMPTY_PRODUCT: ProductInput = {
  name: "",
  slug: "",
  category: "sherwanis",
  subcategory: "",
  price: 0,
  sizes: SIZE_PRESETS[0].sizes,
  colors: [{ name: "Ivory", hex: "#EFE6D2" }],
  fabric: "",
  description: "",
  details: [],
  care: [],
  tags: [],
  occasions: [],
  images: [],
  completeTheLook: [],
  status: "draft",
};

type Errors = Record<string, string>;

/** Unique id prefix per form instance (pages stay mounted under <Activity>, so ids must not collide). */
const IdCtx = createContext("pf");
const usePf = () => {
  const prefix = useContext(IdCtx);
  return (k: string) => `${prefix}-${k}`;
};

export function ProductForm({
  initial,
  id,
  others,
}: {
  initial: ProductInput;
  id?: string;
  others: { slug: string; name: string; category: string }[];
}) {
  const router = useRouter();
  const prefix = `pf${useId().replace(/:/g, "")}`;
  const pf = (k: string) => `${prefix}-${k}`;
  const [p, setP] = useState<ProductInput>(initial);
  const [slugEdited, setSlugEdited] = useState(!!id);
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [customSize, setCustomSize] = useState("");
  const [lookFilter, setLookFilter] = useState("");

  const set = <K extends keyof ProductInput>(k: K, v: ProductInput[K]) => setP((prev) => ({ ...prev, [k]: v }));

  const save = (status?: ProductInput["status"]) => {
    setFormError(null);
    start(async () => {
      const res = await saveProductAction({ ...p, status: status ?? p.status }, id);
      if (!res.ok) {
        setErrors(res.fieldErrors ?? {});
        setFormError(res.error);
        const first = Object.keys(res.fieldErrors ?? {})[0];
        if (first) document.getElementById(pf(first))?.focus();
        return;
      }
      setErrors({});
      router.push(`/admin/products?saved=${id ? "updated" : "created"}`);
      router.refresh();
    });
  };

  const lookOptions = useMemo(() => {
    const q = lookFilter.trim().toLowerCase();
    return others.filter((o) => o.slug !== p.slug && (!q || o.name.toLowerCase().includes(q)));
  }, [others, lookFilter, p.slug]);

  const toggleIn = <T extends string>(list: T[] | undefined, v: T) => ((list ?? []).includes(v) ? (list ?? []).filter((x) => x !== v) : [...(list ?? []), v]);

  return (
    <IdCtx.Provider value={prefix}>
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
      className="grid gap-6 pb-24 xl:grid-cols-[1fr_20rem]"
    >
      <div className="grid gap-6">
        <Section title="Basics">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="name" label="Product name" error={errors.name} className="sm:col-span-2">
              <input
                id={pf("name")}
                className="field"
                value={p.name}
                onChange={(e) => {
                  const name = e.target.value;
                  setP((prev) => ({ ...prev, name, slug: slugEdited ? prev.slug : slugify(name) }));
                }}
                aria-invalid={!!errors.name}
                required
              />
            </Field>
            <Field id="slug" label="URL (slug)" error={errors.slug} hint={`/product/${p.slug || "…"}`} className="sm:col-span-2">
              <input
                id={pf("slug")}
                className="field font-mono text-base"
                value={p.slug}
                onChange={(e) => {
                  setSlugEdited(true);
                  set("slug", slugify(e.target.value.replace(/\s/g, "-")) || e.target.value.toLowerCase());
                }}
                aria-invalid={!!errors.slug}
              />
            </Field>
            <Field id="category" label="Category" error={errors.category}>
              <select
                id={pf("category")}
                className="field"
                value={p.category}
                onChange={(e) => {
                  const category = e.target.value as CategorySlug;
                  setP((prev) => ({ ...prev, category, sizes: id ? prev.sizes : SIZE_PRESETS[PRESET_FOR[category]].sizes }));
                }}
              >
                {categories.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field id="subcategory" label="Sub-category (optional)" hint="e.g. Wedding, Reception, Linen">
              <input id={pf("subcategory")} className="field" value={p.subcategory ?? ""} onChange={(e) => set("subcategory", e.target.value)} />
            </Field>
            <Field id="price" label="Price (₹, incl. GST)" error={errors.price} hint="Discounts are set under Sales, not here.">
              <input
                id={pf("price")}
                className="field"
                inputMode="numeric"
                value={p.price ? String(p.price) : ""}
                onChange={(e) => set("price", Number(e.target.value.replace(/[^\d]/g, "")) || 0)}
                aria-invalid={!!errors.price}
              />
            </Field>
          </div>
        </Section>

        <Section title="Images" error={errors.images}>
          <ImageUploader value={p.images ?? []} onChange={(v) => set("images", v)} label="Product images" />
          <p className="mt-2 text-sm text-ink-soft">The first image is used on product cards. Portrait 5:6 works best (e.g. 1500×1800).</p>
        </Section>

        <Section title="Sizes" error={errors.sizes}>
          <div id={pf("sizes")} tabIndex={-1} className="flex flex-wrap gap-2">
            {p.sizes.map((s) => (
              <span key={s} className="inline-flex items-center gap-1 border border-brand-green/30 bg-pearl py-1 pl-3 pr-1 font-display text-xs tracking-[0.08em]">
                {s}
                <button type="button" className="grid size-7 place-items-center text-ink-soft hover:text-ruby" aria-label={`Remove size ${s}`} onClick={() => set("sizes", p.sizes.filter((x) => x !== s))}>
                  ×
                </button>
              </span>
            ))}
            {p.sizes.length === 0 && <span className="text-base text-ink-soft">No sizes yet.</span>}
          </div>
          <div className="mt-4 flex flex-wrap items-end gap-2">
            <span className="eyebrow mr-1 self-center text-[0.6rem] text-ink-soft">Presets</span>
            {SIZE_PRESETS.map((pr) => (
              <button key={pr.label} type="button" className="btn-outline min-h-9 px-3 py-1 text-[0.62rem]" onClick={() => set("sizes", pr.sizes)}>
                {pr.label}
              </button>
            ))}
          </div>
          <div className="mt-3 flex max-w-sm gap-2">
            <label htmlFor={pf("custom-size")} className="sr-only">
              Custom size
            </label>
            <input
              id={pf("custom-size")}
              className="field min-h-10 py-1.5"
              placeholder="Custom size, e.g. 48"
              value={customSize}
              onChange={(e) => setCustomSize(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  const v = customSize.trim();
                  if (v && !p.sizes.includes(v)) set("sizes", [...p.sizes, v]);
                  setCustomSize("");
                }
              }}
            />
            <button
              type="button"
              className="btn-outline min-h-10 px-4 py-1.5"
              onClick={() => {
                const v = customSize.trim();
                if (v && !p.sizes.includes(v)) set("sizes", [...p.sizes, v]);
                setCustomSize("");
              }}
            >
              Add
            </button>
          </div>
        </Section>

        <Section title="Stock" error={errors.stock}>
          <label className="flex items-center gap-3 text-[1.02rem]">
            <input
              id={pf("stock")}
              type="checkbox"
              checked={!!p.stock}
              onChange={(e) => set("stock", e.target.checked ? Object.fromEntries(p.sizes.map((s) => [s, 0])) : undefined)}
              className="size-4 accent-brand-green"
            />
            Track stock for this product
          </label>
          {p.stock ? (
            <>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                {p.sizes.map((s) => (
                  <div key={s}>
                    <label htmlFor={pf(`stock-${s}`)} className="field-label">
                      {s}
                    </label>
                    <input
                      id={pf(`stock-${s}`)}
                      type="number"
                      inputMode="numeric"
                      min={0}
                      step={1}
                      placeholder="—"
                      value={p.stock?.[s] ?? ""}
                      onChange={(e) => {
                        const next = { ...p.stock };
                        if (e.target.value === "") delete next[s];
                        else next[s] = Number(e.target.value);
                        set("stock", next);
                      }}
                      className="field min-h-10 py-1.5"
                    />
                  </div>
                ))}
              </div>
              <p className="mt-2 text-sm text-ink-soft">
                Units on hand per size. Orders take stock automatically and cancelled or refunded orders put it back. A size at 0 shows as sold out;
                leave a size blank to stop tracking it. Made-to-measure orders never use stock. Saving replaces the numbers, so reload before editing if
                orders may have come in.
              </p>
            </>
          ) : (
            <p className="mt-2 text-sm text-ink-soft">Not tracked: every size is always available.</p>
          )}
        </Section>

        <Section title="Colours" error={errors.colors}>
          <ul id={pf("colors")} tabIndex={-1} className="grid gap-4">
            {p.colors.map((c, i) => (
              <ColorRow
                key={i}
                index={i}
                color={c}
                onChange={(next) => set("colors", p.colors.map((x, k) => (k === i ? next : x)))}
                onRemove={p.colors.length > 1 ? () => set("colors", p.colors.filter((_, k) => k !== i)) : undefined}
              />
            ))}
          </ul>
          <button type="button" className="btn-outline mt-4 min-h-10 px-4 py-1.5" onClick={() => set("colors", [...p.colors, { name: "", hex: "#C9A04A" }])}>
            + Add colour
          </button>
        </Section>

        <Section title="Story & care">
          <div className="grid gap-4">
            <Field id="fabric" label="Fabric" error={errors.fabric} hint="Shown on cards (before “with”) and in the Fabric accordion.">
              <input id={pf("fabric")} className="field" value={p.fabric} onChange={(e) => set("fabric", e.target.value)} aria-invalid={!!errors.fabric} />
            </Field>
            <Field id="description" label="Description" error={errors.description}>
              <textarea id={pf("description")} rows={4} className="field" value={p.description} onChange={(e) => set("description", e.target.value)} aria-invalid={!!errors.description} />
            </Field>
            <ListEditor label="Details (bullet points)" items={p.details} onChange={(v) => set("details", v)} placeholder="e.g. Hand-laid zari, 180 hours" />
            <ListEditor label="Care notes" items={p.care} onChange={(v) => set("care", v)} placeholder="e.g. Dry clean only" />
          </div>
        </Section>
      </div>

      <div className="grid content-start gap-6">
        <Section title="Status">
          <fieldset className="grid gap-2">
            <legend className="sr-only">Status</legend>
            {(["active", "draft"] as const).map((s) => (
              <label key={s} className="flex items-center gap-3 text-[1.05rem]">
                <input type="radio" name="status" checked={p.status === s} onChange={() => set("status", s)} className="size-4 accent-brand-green" />
                {s === "active" ? "Active — visible in the store" : "Draft — hidden"}
              </label>
            ))}
          </fieldset>
        </Section>

        <Section title="Royal Fit">
          <fieldset className="grid gap-2">
            <legend className="field-label">Made to measure</legend>
            {(
              [
                { v: undefined, label: `Category default (${madeToMeasureAvailable({ category: p.category }) ? "offered" : "not offered"})` },
                { v: true, label: "Offer made to measure" },
                { v: false, label: "Standard sizes only" },
              ] as const
            ).map((o) => (
              <label key={String(o.v)} className="flex items-center gap-3 text-[1.02rem]">
                <input
                  type="radio"
                  name="madeToMeasure"
                  checked={p.madeToMeasure === o.v}
                  onChange={() => set("madeToMeasure", o.v)}
                  className="size-4 accent-brand-green"
                />
                {o.label}
              </label>
            ))}
            <p className="text-sm text-ink-soft">Customers order with their Royal Fit measurements; the fee is set in Settings.</p>
          </fieldset>
        </Section>

        <Section title="Merchandising">
          <fieldset>
            <legend className="field-label">Tags</legend>
            {TAGS.map((t) => (
              <label key={t.value} className="flex items-center gap-3 py-0.5 text-[1.02rem]">
                <input type="checkbox" checked={p.tags.includes(t.value)} onChange={() => set("tags", toggleIn(p.tags, t.value))} className="size-4 accent-brand-green" />
                {t.label}
              </label>
            ))}
          </fieldset>
          <fieldset className="mt-4">
            <legend className="field-label">Occasions (shop filter)</legend>
            <div className="grid grid-cols-2 gap-x-3">
              {OCCASIONS.map((o) => (
                <label key={o.value} className="flex items-center gap-3 py-0.5 text-[1.02rem]">
                  <input type="checkbox" checked={p.occasions.includes(o.value)} onChange={() => set("occasions", toggleIn(p.occasions, o.value))} className="size-4 accent-brand-green" />
                  {o.label}
                </label>
              ))}
            </div>
          </fieldset>
        </Section>

        <Section title="Complete the look">
          <p className="mb-2 text-sm text-ink-soft">Up to 8 pieces shown on the product page. {(p.completeTheLook ?? []).length} selected.</p>
          <label htmlFor={pf("look-filter")} className="sr-only">
            Filter products
          </label>
          <input id={pf("look-filter")} className="field min-h-10 py-1.5" placeholder="Filter products…" value={lookFilter} onChange={(e) => setLookFilter(e.target.value)} />
          <div className="mt-2 max-h-64 overflow-y-auto border border-mist">
            {lookOptions.map((o) => {
              const checked = (p.completeTheLook ?? []).includes(o.slug);
              const full = (p.completeTheLook ?? []).length >= 8;
              return (
                <label key={o.slug} className="flex items-center gap-3 border-b border-mist px-3 py-1.5 text-base last:border-b-0">
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={!checked && full}
                    onChange={() => set("completeTheLook", toggleIn(p.completeTheLook, o.slug))}
                    className="size-4 accent-brand-green"
                  />
                  <span className="min-w-0 flex-1 truncate">{o.name}</span>
                </label>
              );
            })}
            {lookOptions.length === 0 && <p className="px-3 py-2 text-base text-ink-soft">No matches.</p>}
          </div>
        </Section>
      </div>

      {/* sticky save bar */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-mist bg-white/95 px-4 py-3 shadow-lift lg:left-60">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-end gap-3">
          {formError && (
            <p role="alert" className="mr-auto text-base text-ruby">
              {formError}
            </p>
          )}
          <button type="button" onClick={() => router.push("/admin/products")} className="btn-outline min-h-10 px-4 py-1.5">
            Cancel
          </button>
          {p.status === "draft" && (
            <button type="button" disabled={pending} onClick={() => save("active")} className="btn-outline min-h-10 px-4 py-1.5">
              Save &amp; publish
            </button>
          )}
          <button type="submit" disabled={pending} className="btn-royal min-h-10 px-6 py-1.5">
            {pending ? "Saving…" : id ? "Save changes" : "Create product"}
          </button>
        </div>
      </div>
    </form>
    </IdCtx.Provider>
  );
}

function Section({ title, error, children }: { title: string; error?: string; children: ReactNode }) {
  return (
    <section className="border border-mist bg-white shadow-card">
      <h2 className="border-b border-mist px-5 py-3 font-display text-[0.72rem] uppercase tracking-[0.2em]">{title}</h2>
      <div className="p-5">
        {children}
        {error && (
          <p role="alert" className="mt-3 text-base text-ruby">
            {error}
          </p>
        )}
      </div>
    </section>
  );
}

function Field({ id, label, error, hint, className = "", children }: { id: string; label: string; error?: string; hint?: string; className?: string; children: ReactNode }) {
  const pf = usePf();
  return (
    <div className={className}>
      <label htmlFor={pf(id)} className="field-label">
        {label}
      </label>
      {children}
      {error ? (
        <p className="mt-1 text-sm text-ruby">{error}</p>
      ) : hint ? (
        <p className="mt-1 text-sm text-ink-soft">{hint}</p>
      ) : null}
    </div>
  );
}

function ColorRow({ index, color, onChange, onRemove }: { index: number; color: ProductColor; onChange: (c: ProductColor) => void; onRemove?: () => void }) {
  const [showImages, setShowImages] = useState(!!color.images?.length);
  const pf = usePf();
  return (
    <li className="border border-mist p-3">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor={pf(`color-hex-${index}`)} className="field-label">
            Swatch
          </label>
          <input
            id={pf(`color-hex-${index}`)}
            type="color"
            value={/^#[0-9a-f]{6}$/i.test(color.hex) ? color.hex : "#000000"}
            onChange={(e) => onChange({ ...color, hex: e.target.value.toUpperCase() })}
            className="h-12 w-14 cursor-pointer border border-mist bg-white p-1"
          />
        </div>
        <div className="min-w-40 flex-1">
          <label htmlFor={pf(`color-name-${index}`)} className="field-label">
            Colour name
          </label>
          <input id={pf(`color-name-${index}`)} className="field" value={color.name} onChange={(e) => onChange({ ...color, name: e.target.value })} placeholder="e.g. Midnight Blue" />
        </div>
        <div className="w-28">
          <label htmlFor={pf(`color-code-${index}`)} className="field-label">
            Hex
          </label>
          <input id={pf(`color-code-${index}`)} className="field font-mono text-base uppercase" value={color.hex} onChange={(e) => onChange({ ...color, hex: e.target.value.trim() })} />
        </div>
        <div className="flex gap-3 pb-3">
          <button type="button" className="text-base underline decoration-gold/60 underline-offset-4" onClick={() => setShowImages((s) => !s)} aria-expanded={showImages}>
            {showImages ? "Hide photos" : "Colour photos"}
          </button>
          {onRemove && (
            <button type="button" className="text-base text-ruby underline underline-offset-4" onClick={onRemove}>
              Remove
            </button>
          )}
        </div>
      </div>
      {showImages && (
        <div className="mt-3">
          <p className="mb-2 text-sm text-ink-soft">Optional. When this colour is selected, these photos replace the main product images.</p>
          <ImageUploader compact label={`${color.name || "Colour"} photos`} value={color.images ?? []} onChange={(images) => onChange({ ...color, images })} />
        </div>
      )}
    </li>
  );
}

function ListEditor({ label, items, onChange, placeholder }: { label: string; items: string[]; onChange: (v: string[]) => void; placeholder: string }) {
  const [draft, setDraft] = useState("");
  const add = () => {
    const v = draft.trim();
    if (v) onChange([...items, v]);
    setDraft("");
  };
  const pf = usePf();
  const fieldId = pf(`list-${label.replace(/\W+/g, "-").toLowerCase()}`);
  return (
    <div>
      <label htmlFor={fieldId} className="field-label">
        {label}
      </label>
      {items.length > 0 && (
        <ul className="mb-2 grid gap-1.5">
          {items.map((it, i) => (
            <li key={i} className="flex items-center gap-2">
              <input
                aria-label={`${label} ${i + 1}`}
                className="field min-h-10 flex-1 py-1.5"
                value={it}
                onChange={(e) => onChange(items.map((x, k) => (k === i ? e.target.value : x)))}
              />
              <button type="button" aria-label={`Remove ${label} ${i + 1}`} className="grid size-10 place-items-center border border-mist text-ink-soft hover:text-ruby" onClick={() => onChange(items.filter((_, k) => k !== i))}>
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex gap-2">
        <input
          id={fieldId}
          className="field min-h-10 flex-1 py-1.5"
          placeholder={placeholder}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
        />
        <button type="button" className="btn-outline min-h-10 px-4 py-1.5" onClick={add}>
          Add
        </button>
      </div>
    </div>
  );
}
