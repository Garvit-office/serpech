"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { track } from "@/lib/track";
import type { Product } from "@sarpech/core/types";
import { useCatalog } from "./catalog";

const KEY = "sarpech.wishlist.v1";

interface WishlistState {
  ready: boolean;
  slugs: string[];
  has: (slug: string) => boolean;
  toggle: (slug: string) => void;
  remove: (slug: string) => void;
  /** Replace the whole list (used when merging with a signed-in account). */
  replace: (slugs: string[]) => void;
}

const WishlistContext = createContext<WishlistState | null>(null);

function read(getProduct: (slug: string) => Product | undefined): string[] {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((s): s is string => typeof s === "string" && !!getProduct(s)) : [];
  } catch {
    return [];
  }
}

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { getProduct } = useCatalog();
  const [slugs, setSlugs] = useState<string[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate from storage after mount
    setSlugs(read(getProduct));
    setReady(true);
    const onStorage = (e: StorageEvent) => e.key === KEY && setSlugs(read(getProduct));
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [getProduct]);

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(KEY, JSON.stringify(slugs));
    } catch {
      /* storage unavailable */
    }
  }, [slugs, ready]);

  const toggle = useCallback(
    (slug: string) => {
      if (!slugs.includes(slug)) track("wishlist_add", { slug });
      setSlugs((prev) => (prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]));
    },
    [slugs],
  );
  const remove = useCallback((slug: string) => setSlugs((prev) => prev.filter((s) => s !== slug)), []);
  const replace = useCallback((next: string[]) => setSlugs(next.filter((s) => !!getProduct(s))), [getProduct]);

  const value = useMemo(
    () => ({ ready, slugs, has: (s: string) => slugs.includes(s), toggle, remove, replace }),
    [ready, slugs, toggle, remove, replace],
  );
  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used inside <WishlistProvider>");
  return ctx;
}
