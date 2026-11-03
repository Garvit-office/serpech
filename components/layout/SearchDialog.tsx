"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDeferredValue, useId, useState } from "react";
import { ProductImage } from "@/components/shop/ProductImage";
import { Dialog } from "@/components/ui/Dialog";
import { SearchIcon } from "@/components/ui/icons";
import { effectivePrice, searchIn } from "@/lib/catalog-shared";
import { useCatalog } from "@/lib/store/catalog";
import { track } from "@/lib/track";
import { formatINR } from "@/lib/format";

const SUGGESTIONS = ["Sherwani", "Ivory", "Polo", "Safa", "Linen", "Velvet"];

export function SearchDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [q, setQ] = useState("");
  const deferred = useDeferredValue(q);
  const { products } = useCatalog();
  const results = searchIn(products, deferred, 6);
  const router = useRouter();
  const inputId = useId();

  return (
    <Dialog open={open} onClose={onClose} label="Search" variant="top">
      <div className="mx-auto max-w-4xl px-4 pb-8 pt-6 sm:px-8">
        <form
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            if (q.trim()) {
              track("search", { q: q.trim().toLowerCase(), results: results.length });
              router.push(`/search?q=${encodeURIComponent(q.trim())}`);
            }
          }}
          className="flex items-center gap-3 border-b border-brand-green pb-2 pr-10"
        >
          <SearchIcon className="shrink-0" />
          <label htmlFor={inputId} className="sr-only">
            Search the collection
          </label>
          <input
            id={inputId}
            autoFocus
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search sherwanis, safas, polos…"
            className="w-full bg-transparent py-2 font-serif text-2xl placeholder:text-ink-soft/70 focus:outline-none"
            autoComplete="off"
          />
        </form>

        {!q && (
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <span className="eyebrow mr-2 text-ink-soft">Popular</span>
            {SUGGESTIONS.map((s) => (
              <button key={s} type="button" onClick={() => setQ(s)} className="border border-mist px-3 py-1 text-base hover:border-gold">
                {s}
              </button>
            ))}
          </div>
        )}

        <div aria-live="polite" className="mt-6">
          {q && results.length === 0 && <p className="text-ink-soft">No pieces match “{q}”. Try “kurta” or “gold”.</p>}
          {results.length > 0 && (
            <>
              <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                {results.map((p) => (
                  <li key={p.id}>
                    <Link href={`/product/${p.slug}`} onClick={onClose} className="group flex gap-3">
                      <span className="block h-24 w-20 shrink-0 bg-pearl">
                        <ProductImage product={p} />
                      </span>
                      <span className="min-w-0">
                        <span className="block font-display text-[0.72rem] uppercase tracking-[0.14em] group-hover:underline">{p.name}</span>
                        <span className="block text-base text-ink-soft">{formatINR(effectivePrice(p))}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
              <Link
                href={`/search?q=${encodeURIComponent(q)}`}
                onClick={onClose}
                className="link-thread mt-6 inline-block font-display text-xs uppercase tracking-[0.22em]"
              >
                See all results →
              </Link>
            </>
          )}
        </div>
      </div>
    </Dialog>
  );
}
