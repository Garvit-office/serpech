"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useDeferredValue, useEffect, useState } from "react";
import { SearchIcon } from "@/components/ui/icons";
import { searchIn } from "@/lib/catalog-shared";
import { useCatalog } from "@/lib/store/catalog";
import { track } from "@/lib/track";
import { ProductCard } from "./ProductCard";

/** Live search: results update as you type; the query is mirrored to ?q= for sharing. */
export function SearchView() {
  const params = useSearchParams();
  const pathname = usePathname();
  const [q, setQ] = useState(params.get("q") ?? "");
  const deferred = useDeferredValue(q);
  const { products } = useCatalog();
  const results = searchIn(products, deferred, 48);

  useEffect(() => {
    const t = window.setTimeout(() => {
      const next = deferred.trim() ? `${pathname}?q=${encodeURIComponent(deferred.trim())}` : pathname;
      window.history.replaceState(null, "", next);
    }, 300);
    // log the settled query once the visitor pauses typing
    const log = window.setTimeout(() => {
      if (deferred.trim().length >= 2) track("search", { q: deferred.trim().toLowerCase(), results: searchIn(products, deferred, 48).length });
    }, 1200);
    return () => {
      window.clearTimeout(t);
      window.clearTimeout(log);
    };
  }, [deferred, pathname, products]);

  return (
    <div className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
      <form role="search" onSubmit={(e) => e.preventDefault()} className="mx-auto flex max-w-2xl items-center gap-3 border-b border-brand-green pb-2">
        <SearchIcon />
        <label htmlFor="search-page-input" className="sr-only">
          Search the collection
        </label>
        <input
          id="search-page-input"
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Sherwani, ivory, linen…"
          className="w-full bg-transparent py-2 text-2xl placeholder:text-ink-soft/70 focus:outline-none"
          autoComplete="off"
        />
      </form>
      <p className="mt-6 text-center text-lg text-ink-soft" aria-live="polite">
        {deferred.trim()
          ? `${results.length} ${results.length === 1 ? "result" : "results"} for “${deferred.trim()}”`
          : "Start typing to search the collection."}
      </p>
      {results.length > 0 && (
        <ul className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 md:grid-cols-3 lg:grid-cols-4">
          {results.map((p) => (
            <li key={p.id}>
              <ProductCard product={p} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
