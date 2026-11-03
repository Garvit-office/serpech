"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useMemo, useState, type ReactNode } from "react";
import { Dialog } from "@/components/ui/Dialog";
import { ChevronIcon, CloseIcon } from "@/components/ui/icons";
import { categories } from "@/data/categories";
import { COLOR_FAMILIES, OCCASIONS, PRICE_BUCKETS, SIZE_OPTIONS, effectivePrice } from "@/lib/catalog-shared";
import type { CategorySlug, Product } from "@/lib/types";
import { ProductCard } from "./ProductCard";

const SORTS = [
  { value: "featured", label: "Featured" },
  { value: "new", label: "New Arrivals" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
];

type FilterKey = "cat" | "size" | "color" | "price" | "occasion";

function list(params: URLSearchParams, key: string) {
  return params.get(key)?.split(",").filter(Boolean) ?? [];
}

/**
 * Product listing with filters held in the URL (?cat=&size=&color=&price=&occasion=&sort=),
 * so filtered views can be shared and survive reloads.
 */
export function ShopView({ products, lockedCategory }: { products: Product[]; lockedCategory?: CategorySlug }) {
  const params = useSearchParams();
  const pathname = usePathname();
  const [filtersOpen, setFiltersOpen] = useState(false);

  const selected: Record<FilterKey, string[]> = {
    cat: list(params, "cat"),
    size: list(params, "size"),
    color: list(params, "color"),
    price: list(params, "price"),
    occasion: list(params, "occasion"),
  };
  const sort = params.get("sort") ?? "featured";

  const update = (mutate: (p: URLSearchParams) => void) => {
    const next = new URLSearchParams(params.toString());
    mutate(next);
    const qs = next.toString();
    // Native history keeps filtering instant: Next syncs useSearchParams without a server round trip.
    window.history.replaceState(null, "", qs ? `${pathname}?${qs}` : pathname);
  };

  const toggle = (key: FilterKey, value: string) =>
    update((p) => {
      const cur = list(p, key);
      const nextVals = cur.includes(value) ? cur.filter((v) => v !== value) : [...cur, value];
      if (nextVals.length) p.set(key, nextVals.join(","));
      else p.delete(key);
    });

  const clearAll = () =>
    update((p) => {
      (["cat", "size", "color", "price", "occasion"] as FilterKey[]).forEach((k) => p.delete(k));
    });

  // only offer sizes that exist in this listing
  const availableSizes = useMemo(() => {
    const set = new Set(products.flatMap((p) => p.sizes));
    return SIZE_OPTIONS.filter((s) => set.has(s)).concat([...set].filter((s) => !SIZE_OPTIONS.includes(s)));
  }, [products]);

  const results = useMemo(() => {
    const r = products.filter((p) => {
      if (selected.cat.length && !selected.cat.includes(p.category)) return false;
      if (selected.size.length && !p.sizes.some((s) => selected.size.includes(s))) return false;
      if (
        selected.color.length &&
        !p.colors.some((c) => COLOR_FAMILIES.some((f) => selected.color.includes(f.value) && f.match.test(c.name)))
      )
        return false;
      if (selected.price.length) {
        const price = effectivePrice(p);
        if (!PRICE_BUCKETS.some((b) => selected.price.includes(b.value) && price >= b.min && price <= b.max)) return false;
      }
      if (selected.occasion.length && !p.occasions.some((o) => selected.occasion.includes(o))) return false;
      return true;
    });
    const score = (p: Product) => (p.tags.includes("bestseller") ? 2 : 0) + (p.tags.includes("new") ? 1 : 0);
    switch (sort) {
      case "new":
        return [...r].sort((a, b) => Number(b.tags.includes("new")) - Number(a.tags.includes("new")));
      case "price-asc":
        return [...r].sort((a, b) => effectivePrice(a) - effectivePrice(b));
      case "price-desc":
        return [...r].sort((a, b) => effectivePrice(b) - effectivePrice(a));
      default:
        return [...r].sort((a, b) => score(b) - score(a));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- selected is derived from params
  }, [products, params, sort]);

  const chips: { key: FilterKey; value: string; label: string }[] = [
    ...selected.cat.map((v) => ({ key: "cat" as const, value: v, label: categories.find((c) => c.slug === v)?.name ?? v })),
    ...selected.size.map((v) => ({ key: "size" as const, value: v, label: `Size ${v}` })),
    ...selected.color.map((v) => ({ key: "color" as const, value: v, label: COLOR_FAMILIES.find((c) => c.value === v)?.label ?? v })),
    ...selected.price.map((v) => ({ key: "price" as const, value: v, label: PRICE_BUCKETS.find((b) => b.value === v)?.label ?? v })),
    ...selected.occasion.map((v) => ({ key: "occasion" as const, value: v, label: OCCASIONS.find((o) => o.value === v)?.label ?? v })),
  ];

  const panel = (
    <div className="divide-y divide-mist">
      {!lockedCategory && (
        <FilterGroup title="Category" count={selected.cat.length}>
          {categories.map((c) => (
            <Check key={c.slug} checked={selected.cat.includes(c.slug)} onChange={() => toggle("cat", c.slug)} label={c.name} />
          ))}
        </FilterGroup>
      )}
      <FilterGroup title="Size" count={selected.size.length}>
        <div className="flex flex-wrap gap-2">
          {availableSizes.map((s) => {
            const on = selected.size.includes(s);
            return (
              <button
                key={s}
                type="button"
                aria-pressed={on}
                onClick={() => toggle("size", s)}
                className={`min-h-10 min-w-11 border px-2 font-display text-[0.68rem] tracking-[0.08em] transition ${
                  on ? "border-brand-green bg-brand-green text-ivory" : "border-brand-green/30 hover:border-brand-green"
                }`}
              >
                {s}
              </button>
            );
          })}
        </div>
      </FilterGroup>
      <FilterGroup title="Colour" count={selected.color.length}>
        {COLOR_FAMILIES.map((f) => (
          <Check
            key={f.value}
            checked={selected.color.includes(f.value)}
            onChange={() => toggle("color", f.value)}
            label={
              <span className="flex items-center gap-2">
                <span className="size-4 rounded-full border border-brand-green/25" style={{ background: f.swatch }} aria-hidden />
                {f.label}
              </span>
            }
          />
        ))}
      </FilterGroup>
      <FilterGroup title="Price" count={selected.price.length}>
        {PRICE_BUCKETS.map((b) => (
          <Check key={b.value} checked={selected.price.includes(b.value)} onChange={() => toggle("price", b.value)} label={b.label} />
        ))}
      </FilterGroup>
      <FilterGroup title="Occasion" count={selected.occasion.length}>
        {OCCASIONS.map((o) => (
          <Check key={o.value} checked={selected.occasion.includes(o.value)} onChange={() => toggle("occasion", o.value)} label={o.label} />
        ))}
      </FilterGroup>
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
      {/* toolbar */}
      <div className="sticky top-[60px] z-20 -mx-4 flex items-center justify-between gap-3 border-y border-mist bg-white px-4 py-3 sm:-mx-6 sm:px-6 lg:static lg:mx-0 lg:border-t-0 lg:px-0">
        <button type="button" onClick={() => setFiltersOpen(true)} className="btn-outline min-h-10 px-4 py-2 lg:hidden">
          Filters{chips.length ? ` (${chips.length})` : ""}
        </button>
        <p className="hidden text-lg text-ink-soft lg:block" aria-live="polite">
          {results.length} {results.length === 1 ? "piece" : "pieces"}
        </p>
        <label className="flex items-center gap-2">
          <span className="eyebrow hidden text-ink-soft sm:inline">Sort</span>
          <span className="relative">
            <select
              value={sort}
              onChange={(e) => update((p) => (e.target.value === "featured" ? p.delete("sort") : p.set("sort", e.target.value)))}
              className="field min-h-10 appearance-none py-1.5 pl-3 pr-9 text-base"
              aria-label="Sort products"
            >
              {SORTS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
            <ChevronIcon className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" />
          </span>
        </label>
      </div>

      <div className="mt-6 grid gap-10 lg:grid-cols-[15rem_1fr]">
        <aside aria-label="Filters" className="hidden lg:block">
          <div className="sticky top-32">
            <div className="flex items-baseline justify-between pb-2">
              <h2 className="eyebrow">Refine</h2>
              {chips.length > 0 && (
                <button type="button" onClick={clearAll} className="link-thread text-base text-ink-soft">
                  Clear all
                </button>
              )}
            </div>
            {panel}
          </div>
        </aside>

        <section aria-label="Products">
          {chips.length > 0 && (
            <ul className="mb-6 flex flex-wrap gap-2" aria-label="Active filters">
              {chips.map((c) => (
                <li key={`${c.key}-${c.value}`}>
                  <button
                    type="button"
                    onClick={() => toggle(c.key, c.value)}
                    className="inline-flex items-center gap-1.5 border border-gold bg-pearl px-3 py-1 text-base"
                    aria-label={`Remove filter ${c.label}`}
                  >
                    {c.label} <CloseIcon width={14} height={14} />
                  </button>
                </li>
              ))}
              <li>
                <button type="button" onClick={clearAll} className="link-thread px-2 py-1 text-base text-ink-soft">
                  Clear all
                </button>
              </li>
            </ul>
          )}
          <p className="mb-4 text-lg text-ink-soft lg:hidden" aria-live="polite">
            {results.length} {results.length === 1 ? "piece" : "pieces"}
          </p>
          {results.length === 0 ? (
            <div className="border border-mist px-6 py-16 text-center">
              <p className="text-2xl">No pieces match these filters.</p>
              <button type="button" onClick={clearAll} className="btn-royal mt-6">
                Clear filters
              </button>
            </div>
          ) : (
            <ul className="grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 md:grid-cols-3">
              {results.map((p, i) => (
                <li key={p.id}>
                  <ProductCard product={p} priority={i < 3} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <Dialog open={filtersOpen} onClose={() => setFiltersOpen(false)} label="Filters" variant="left" closeClassName="text-ivory">
        <div className="flex min-h-full flex-col">
          <div className="bg-brand-green px-6 py-5 text-ivory">
            <h2 className="font-display text-sm tracking-[0.26em]">Refine</h2>
          </div>
          <div className="flex-1 px-6">{panel}</div>
          <div className="sticky bottom-0 grid grid-cols-2 gap-2 border-t border-mist bg-white p-4">
            <button type="button" onClick={clearAll} className="btn-outline px-3">
              Clear
            </button>
            <button type="button" onClick={() => setFiltersOpen(false)} className="btn-royal px-3">
              Show {results.length}
            </button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}

function FilterGroup({ title, count, children }: { title: string; count: number; children: ReactNode }) {
  return (
    <details open className="group py-4">
      <summary className="flex cursor-pointer list-none items-center justify-between font-display text-[0.72rem] uppercase tracking-[0.22em] [&::-webkit-details-marker]:hidden">
        <span>
          {title}
          {count > 0 && <span className="ml-2 text-gold-dark">({count})</span>}
        </span>
        <ChevronIcon className="text-gold-dark transition-transform group-open:rotate-180" />
      </summary>
      <div className="mt-3 space-y-1.5">{children}</div>
    </details>
  );
}

function Check({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: ReactNode }) {
  return (
    <label className="flex cursor-pointer items-center gap-3 py-0.5 text-[1.05rem]">
      <input type="checkbox" checked={checked} onChange={onChange} className="size-4 accent-brand-green" />
      {label}
    </label>
  );
}
